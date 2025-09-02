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

/**
 * Create a Stripe checkout session for subscription
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
const checkoutController = async (req, res) => {
  try {
    const { plan, billingCycle } = req.body; // plan is the plan title, billingCycle is monthly/yearly
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find subscription by title instead of ID
    const subscription = await Subscription.findOne({ title: plan });
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Create customer in Stripe if not exists
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Select Stripe price
    const priceId =
      billingCycle === 'yearly'
        ? subscription.stripePriceIdYearly
        : subscription.stripePriceIdMonthly;

    // Create Transaction
    let transaction;
    try {
      transaction = await Transaction.create({
        user: user._id,
        tokenType: 'credits', // Required field for subscription payments
        context: `Subscription: ${plan} (${billingCycle})`, // Store subscription info in context
        rawAmount:
          billingCycle === 'yearly'
            ? subscription.priceYearly
            : subscription.priceMonthly,
        status: 'pending',
      });
      console.log('Transaction created:', transaction._id);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    // Create Invoice
    let invoice;
    let invoiceNumber = `INV-${Date.now()}`; // Declare in outer scope
    
    if (Invoice) {
      try {
        invoice = await Invoice.create({
          user: user._id,
          transaction: transaction._id,
          invoiceNumber,
          amount: transaction.rawAmount,
          currency: 'usd',
          status: 'pending',
        });
        console.log('Invoice created:', invoice._id);
      } catch (error) {
        console.error('Error creating invoice:', error);
        // Don't fail the entire process if invoice creation fails
        console.warn('Invoice creation failed, continuing without invoice');
      }
    } else {
      console.warn('Invoice model not available, skipping invoice creation');
    }

    // Create Stripe Checkout Session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3090'; // Fallback to localhost if not set
    
    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${frontendUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}`,
      metadata: {
        transactionId: transaction._id.toString(),
        invoiceNumber,
        plan: plan,
        billingCycle: billingCycle,
        userId: userId.toString()
      },
    });

    // Update Transaction with sessionId
    transaction.stripeCheckoutSessionId = session.id;
    await transaction.save();

    res.json({ url: session.url });
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Checkout failed' });
  }
};

const webhookController = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    
    let event;
    
    // Skip signature verification for local testing
    if (process.env.NODE_ENV === 'development' && !sig) {
      console.log('Development mode: Skipping signature verification');
      // Parse the body as JSON if it's a string
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else {
      if (!sig) {
        console.error('No Stripe signature found in webhook request');
        return res.status(400).json({ error: 'No signature found' });
      }

      try {
        // Use the raw body for signature verification
        event = stripe.webhooks.constructEvent(
          req.body, 
          sig, 
          process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test'
        );
        console.log('Webhook event received:', event.type);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
      }
    }
    const userId = event.data.object.metadata.userId;
    await PaymentLog.create({
      user: userId,
      stripeEventId: event.id,
      eventType: event.type,
      payload: event.data.object
    });
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        
        try {
          // Find and update the transaction
          const transaction = await Transaction.findById(session.metadata.transactionId);
          if (transaction) {
            transaction.status = 'paid';
            transaction.stripeCheckoutSessionId = session.id;
            transaction.stripeSubscriptionId = session.subscription;
            await transaction.save();
            console.log('Transaction updated to paid:', transaction._id);

            // Update invoice if it exists
            if (Invoice) {
              await Invoice.findOneAndUpdate(
                { transaction: transaction._id },
                { 
                  status: 'paid', 
                  paidAt: new Date(), 
                  stripeInvoiceId: session.invoice 
                }
              );
              console.log('Invoice updated to paid');
            }

            // Update user subscription status
            await User.findByIdAndUpdate(transaction.user, {
              subscription: {
                status: 'active',
                plan: session.metadata.plan || 'Premium',
                billingCycle: session.metadata.billingCycle || 'monthly',
                startedAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
              }
            });
            console.log('User subscription updated');
          } else {
            console.error('Transaction not found:', session.metadata.transactionId);
            res.json({ 
              status: false,
              message: 'Transaction not found'
            });

          }
        } catch (error) {
          console.error('Error processing checkout.session.completed:', error);
          res.json({ 
            status: false,
            message: 'Error processing checkout.session.completed'
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('Invoice payment succeeded:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Invoice payment failed:', invoice.id);
        
        // Update transaction status to failed
        if (invoice.metadata && invoice.metadata.transactionId) {
          await Transaction.findByIdAndUpdate(invoice.metadata.transactionId, {
            status: 'failed'
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription cancelled:', subscription.id);
        
        // Update user subscription status
        const user = await User.findOne({ stripeCustomerId: subscription.customer });
        if (user) {
          await User.findByIdAndUpdate(user._id, {
            subscription: {
              status: 'cancelled',
              cancelledAt: new Date()
            }
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
        res.json({ 
          status: false,
          message: 'Unhandled event type'
        });
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ 
      status: true,
      message: 'Webhook received'
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = {
  checkoutController,
  webhookController,
};
