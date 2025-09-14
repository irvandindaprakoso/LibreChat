const { logger } = require('@librechat/data-schemas');
const { SystemRoles } = require('librechat-data-provider');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {
  updateUser,
  deleteUserById,
} = require('~/models');
const { User } = require('~/db/models');
const { Subscription } = require('~/db/models');
const { Transaction } = require('~/db/models');
const { Invoice } = require('~/db/models');
const { PaymentLog } = require('~/db/models');

// Constants
const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  PENDING: 'pending'
};

const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed'
};

const WEBHOOK_EVENTS = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  CHARGE_SUCCEEDED: 'charge.succeeded',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted'
};

const BILLING_REASONS = {
  SUBSCRIPTION_CYCLE: 'subscription_cycle',
  SUBSCRIPTION_CREATE: 'subscription_create'
};

// Helper Functions
/**
 * Finds or creates a Stripe customer for a user
 * @param {Object} user - User object
 * @returns {Promise<string>} - Stripe customer ID
 */
const ensureStripeCustomer = async (user) => {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user._id.toString()
    }
  });

  await User.findByIdAndUpdate(user._id, { 
    stripeCustomerId: customer.id 
  });

  return customer.id;
};

/**
 * Creates a transaction record
 * @param {Object} params - Transaction parameters
 * @returns {Promise<Object>} - Created transaction
 */
const createTransaction = async (params) => {
  const {
    user,
    plan,
    billingCycle,
    subscription,
    status = TRANSACTION_STATUS.PENDING
  } = params;

  const amount = billingCycle === BILLING_CYCLES.YEARLY 
    ? subscription.priceYearly 
    : subscription.priceMonthly;

  return await Transaction.create({
    user: user._id,
    tokenType: 'credits',
    context: `Subscription: ${plan} (${billingCycle})`,
    rawAmount: amount,
    status,
    ...params.additionalFields
  });
};

/**
 * Creates an invoice record
 * @param {Object} params - Invoice parameters
 * @returns {Promise<Object|null>} - Created invoice or null
 */
const createInvoiceRecord = async (params) => {
  if (!Invoice) {
    logger.warn('Invoice model not available');
    return null;
  }

  try {
    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = await Invoice.create({
      user: params.user._id,
      transaction: params.transaction._id,
      invoiceNumber,
      amount: params.transaction.rawAmount,
      currency: 'usd',
      status: TRANSACTION_STATUS.PENDING,
      ...params.additionalFields
    });

    logger.info('Invoice created:', invoice._id);
    return invoice;
  } catch (error) {
    logger.error('Error creating invoice:', error);
    return null;
  }
};

/**
 * Updates user subscription
 * @param {string} userId - User ID
 * @param {Object} subscriptionData - Subscription data to update
 */
const updateUserSubscription = async (userId, subscriptionData) => {
  await User.findByIdAndUpdate(userId, {
    subscription: {
      ...subscriptionData,
      updatedAt: new Date()
    }
  });
};

/**
 * Logs payment event
 * @param {Object} params - Payment log parameters
 */
const logPaymentEvent = async (params) => {
  try {
    await PaymentLog.create({
      user: params.userId,
      stripeEventId: params.eventId,
      eventType: params.eventType,
      payload: params.payload
    });
  } catch (error) {
    logger.error('Error creating payment log:', error);
  }
};

/**
 * Finds user by Stripe customer ID
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object|null>} - User object or null
 */
const findUserByCustomerId = async (customerId) => {
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) {
    logger.error('User not found for Stripe customer:', customerId);
  }
  return user;
};

/**
 * Calculate subscription expiry date
 * @param {Object} subscription - Stripe subscription object
 * @returns {Date} - Expiry date
 */
const calculateSubscriptionExpiry = (subscription) => {
  return new Date(subscription.current_period_end * 1000);
};

/**
 * Convert Stripe amount from cents to dollars
 * @param {number} amountInCents - Amount in cents
 * @returns {number} - Amount in dollars
 */
const convertFromCents = (amountInCents) => {
  return amountInCents / 100;
};

// Event Handlers
const handleCheckoutCompleted = async (session) => {
  logger.info('Processing checkout completion:', session.id);

  const transaction = await Transaction.findById(session.metadata.transactionId);
  if (!transaction) {
    logger.error('Transaction not found:', session.metadata.transactionId);
    return { success: false, message: 'Transaction not found' };
  }

  // Update transaction
  transaction.status = TRANSACTION_STATUS.PAID;
  transaction.stripeCheckoutSessionId = session.id;
  transaction.stripeSubscriptionId = session.subscription;
  await transaction.save();

  // Update invoice
  if (Invoice) {
    await Invoice.findOneAndUpdate(
      { transaction: transaction._id },
      { 
        status: TRANSACTION_STATUS.PAID, 
        paidAt: new Date(), 
        stripeInvoiceId: session.invoice 
      }
    );
  }

  // Update user subscription
  await updateUserSubscription(transaction.user, {
    status: SUBSCRIPTION_STATUS.ACTIVE,
    plan: session.metadata.plan || 'Premium',
    billingCycle: session.metadata.billingCycle || BILLING_CYCLES.MONTHLY,
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    stripeSubscriptionId: session.subscription
  });

  logger.info('Checkout processing completed for transaction:', transaction._id);
  return { success: true, message: 'Checkout processed successfully' };
};

const handleInvoicePaymentSucceeded = async (invoice) => {
  logger.info('Processing invoice payment success:', invoice.id);

  // Handle automatic subscription billing
  if (invoice.billing_reason === BILLING_REASONS.SUBSCRIPTION_CYCLE) {
    const user = await findUserByCustomerId(invoice.customer);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Extend subscription period
    const currentExpiry = user.subscription?.expiresAt || new Date();
    const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()) + 30 * 24 * 60 * 60 * 1000);
    
    await updateUserSubscription(user._id, {
      ...user.subscription,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      expiresAt: newExpiry,
      lastBilledAt: new Date()
    });

    // Create transaction record for automatic billing
    if (invoice.charge) {
      await Transaction.create({
        user: user._id,
        tokenType: 'credits',
        context: `Automatic subscription billing - ${invoice.subscription}`,
        rawAmount: convertFromCents(invoice.amount_paid),
        status: TRANSACTION_STATUS.PAID,
        stripeInvoiceId: invoice.id,
        stripeChargeId: invoice.charge,
        stripeSubscriptionId: invoice.subscription
      });
    }

    // Update invoice record
    if (Invoice) {
      await Invoice.findOneAndUpdate(
        { stripeInvoiceId: invoice.id },
        {
          status: TRANSACTION_STATUS.PAID,
          paidAt: new Date(),
          amount: convertFromCents(invoice.amount_paid)
        },
        { upsert: true }
      );
    }

    logger.info(`Subscription extended for user ${user._id} until ${newExpiry}`);
    return { success: true, message: 'Automatic billing processed' };
  }

  return { success: true, message: 'Invoice payment processed' };
};

const handleInvoicePaymentFailed = async (invoice) => {
  logger.warn('Processing invoice payment failure:', invoice.id);

  // Update transaction status to failed
  if (invoice.metadata?.transactionId) {
    await Transaction.findByIdAndUpdate(invoice.metadata.transactionId, {
      status: TRANSACTION_STATUS.FAILED
    });
  }

  // Handle subscription billing failure
  if (invoice.billing_reason === BILLING_REASONS.SUBSCRIPTION_CYCLE) {
    const user = await findUserByCustomerId(invoice.customer);
    if (user) {
      await updateUserSubscription(user._id, {
        ...user.subscription,
        status: 'payment_failed',
        paymentFailedAt: new Date()
      });
      logger.warn(`Subscription payment failed for user ${user._id}`);
    }
  }

  return { success: true, message: 'Payment failure processed' };
};

const handleChargeSucceeded = async (charge) => {
  logger.info('Processing charge success:', charge.id);

  // Handle automatic subscription billing charges
  if (charge.billing_details && charge.invoice) {
    const user = await findUserByCustomerId(charge.customer);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Log the successful charge
    await logPaymentEvent({
      userId: user._id,
      eventId: charge.id,
      eventType: WEBHOOK_EVENTS.CHARGE_SUCCEEDED,
      payload: {
        chargeId: charge.id,
        amount: convertFromCents(charge.amount),
        currency: charge.currency,
        invoiceId: charge.invoice,
        billing_reason: charge.metadata?.billing_reason || BILLING_REASONS.SUBSCRIPTION_CYCLE
      }
    });

    logger.info(`Automatic charge logged for user ${user._id}: $${convertFromCents(charge.amount)}`);
  }

  return { success: true, message: 'Charge processed' };
};

const handleSubscriptionUpdated = async (subscription) => {
  logger.info('Processing subscription update:', subscription.id);

  const user = await findUserByCustomerId(subscription.customer);
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  const expiresAt = calculateSubscriptionExpiry(subscription);
  
  await updateUserSubscription(user._id, {
    ...user.subscription,
    status: subscription.status,
    expiresAt,
    stripeSubscriptionId: subscription.id,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: expiresAt
  });

  logger.info(`Subscription updated for user ${user._id}, expires: ${expiresAt}`);
  return { success: true, message: 'Subscription updated' };
};

const handleSubscriptionDeleted = async (subscription) => {
  logger.info('Processing subscription deletion:', subscription.id);

  const user = await findUserByCustomerId(subscription.customer);
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  await updateUserSubscription(user._id, {
    status: SUBSCRIPTION_STATUS.CANCELLED,
    cancelledAt: new Date()
  });

  logger.info(`Subscription cancelled for user ${user._id}`);
  return { success: true, message: 'Subscription cancelled' };
};

// Main Controllers
/**
 * Create a Stripe checkout session for subscription
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
const checkoutController = async (req, res) => {
  try {
    // Debug logging for troubleshooting
    logger.debug('Checkout request body:', req.body);
    logger.debug('Request headers:', req.headers);

    const { plan, billingCycle } = req.body || {};
    const userId = req.user?._id;

    // Enhanced validation
    if (!req.body) {
      return res.status(400).json({ 
        error: 'Request body is missing. Ensure Content-Type is application/json' 
      });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    if (!plan || !billingCycle) {
      return res.status(400).json({ 
        error: 'Plan and billing cycle are required',
        received: { plan, billingCycle }
      });
    }

    if (!Object.values(BILLING_CYCLES).includes(billingCycle)) {
      return res.status(400).json({ 
        error: `Invalid billing cycle. Must be one of: ${Object.values(BILLING_CYCLES).join(', ')}`,
        received: billingCycle
      });
    }

    // Find user and subscription
    const [user, subscription] = await Promise.all([
      User.findById(userId),
      Subscription.findOne({ title: plan })
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    // Ensure Stripe customer exists
    const customerId = await ensureStripeCustomer(user);

    // Get price ID
    const priceId = billingCycle === BILLING_CYCLES.YEARLY
      ? subscription.stripePriceIdYearly
      : subscription.stripePriceIdMonthly;

    if (!priceId) {
      return res.status(400).json({ error: `Price not configured for ${billingCycle} billing` });
    }

    // Create transaction and invoice
    const transaction = await createTransaction({
      user,
      plan,
      billingCycle,
      subscription
    });

    const invoice = await createInvoiceRecord({
      user,
      transaction
    });

    // Create Stripe Checkout Session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3090';
    const invoiceNumber = invoice?.invoiceNumber || `INV-${Date.now()}`;
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${frontendUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}`,
      metadata: {
        transactionId: transaction._id.toString(),
        invoiceNumber,
        plan,
        billingCycle,
        userId: userId.toString()
      },
    });

    // Update transaction with session ID
    transaction.stripeCheckoutSessionId = session.id;
    await transaction.save();

    logger.info(`Checkout session created for user ${userId}:`, session.id);
    res.json({ url: session.url });

  } catch (error) {
    logger.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Checkout session creation failed' });
  }
};

/**
 * Handle Stripe webhook events
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
const webhookController = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;
    
    // Verify webhook signature
    if (process.env.NODE_ENV === 'development' && !sig) {
      logger.warn('Development mode: Skipping signature verification');
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else {
      if (!sig) {
        logger.error('No Stripe signature found in webhook request');
        return res.status(400).json({ error: 'No signature found' });
      }

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        logger.info('Webhook event received:', event.type);
      } catch (err) {
        logger.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ 
          error: `Webhook signature verification failed: ${err.message}` 
        });
      }
    }

    // Log all webhook events
    const userId = event.data.object.metadata?.userId || 
                   event.data.object.customer;
    
    if (userId) {
      await logPaymentEvent({
        userId,
        eventId: event.id,
        eventType: event.type,
        payload: event.data.object
      });
    }

    // Handle webhook events
    let result = { success: true, message: 'Event processed' };

    switch (event.type) {
      case WEBHOOK_EVENTS.CHECKOUT_COMPLETED:
        result = await handleCheckoutCompleted(event.data.object);
        break;

      case WEBHOOK_EVENTS.INVOICE_PAYMENT_SUCCEEDED:
        result = await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
        result = await handleInvoicePaymentFailed(event.data.object);
        break;

      case WEBHOOK_EVENTS.CHARGE_SUCCEEDED:
        result = await handleChargeSucceeded(event.data.object);
        break;

      case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
        result = await handleSubscriptionUpdated(event.data.object);
        break;

      case WEBHOOK_EVENTS.SUBSCRIPTION_DELETED:
        result = await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
        result = { success: false, message: `Unhandled event type: ${event.type}` };
    }

    // Return appropriate response
    if (result.success) {
      res.json({ 
        status: true,
        message: result.message
      });
    } else {
      res.status(400).json({ 
        status: false,
        message: result.message
      });
    }

  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  checkoutController,
  webhookController,
  // Export helper functions for testing
  ensureStripeCustomer,
  createTransaction,
  createInvoiceRecord,
  updateUserSubscription,
  logPaymentEvent,
  findUserByCustomerId,
  calculateSubscriptionExpiry,
  convertFromCents,
  // Export constants
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  TRANSACTION_STATUS,
  WEBHOOK_EVENTS,
  BILLING_REASONS
};