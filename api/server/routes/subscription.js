const express = require('express');
const { getSubscription, updateSubscription } = require('~/models/Subscription');
const optionalJwtAuth = require('~/server/middleware/optionalJwtAuth');
const router = express.Router();
// import Stripe from 'stripe';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
/**
 * GET /
 * Retrieves subscription.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
router.get('/', optionalJwtAuth, async (req, res) => {
  try {
    res.status(200).send(await getSubscription());
  } catch (error) {
    logger.error('Error getting subscription:', error);
    res.status(500).json({ message: 'Error getting subscription' });
  }
});

/**
 * PUT /:subscriptionId
 * Update subscription.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
router.put('/:subscriptionId', optionalJwtAuth, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { title, description, priceMonthly, priceYearly, feature } = req.body;
    
    // Pastikan user login
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // First, get the existing subscription to check for existing Stripe price IDs
    const existingSubscription = await getSubscription();
    
    let monthlyPriceId, yearlyPriceId;

    if (existingSubscription && existingSubscription.stripePriceIdMonthly) {
      // Update existing monthly price
      const monthlyPrice = await stripe.prices.update(existingSubscription.stripePriceIdMonthly, {
        unit_amount: priceMonthly * 100,
        currency: 'usd',
        recurring: { interval: 'month', interval_count: 1 },
        product_data: { name: `${title} Monthly` },
      });
      monthlyPriceId = monthlyPrice.id;
    } else {
      // Create new monthly price if subscription not found or no existing price ID
      const monthlyPrice = await stripe.prices.create({
        unit_amount: priceMonthly * 100,
        currency: 'usd',
        recurring: { interval: 'month', interval_count: 1 },
        product_data: { name: `${title} Monthly` },
      });
      monthlyPriceId = monthlyPrice.id;
    }

    if (existingSubscription && existingSubscription.stripePriceIdYearly) {
      // Update existing yearly price
      const yearlyPrice = await stripe.prices.update(existingSubscription.stripePriceIdYearly, {
        unit_amount: priceYearly * 100, 
        currency: 'usd',
        recurring: { interval: 'year', interval_count: 1 },
        product_data: { name: `${title} Yearly` },
      });
      yearlyPriceId = yearlyPrice.id;
    } else {
      // Create new yearly price if subscription not found or no existing price ID
      const yearlyPrice = await stripe.prices.create({
        unit_amount: priceYearly * 100, 
        currency: 'usd',
        recurring: { interval: 'year', interval_count: 1 },
        product_data: { name: `${title} Yearly` },
      });
      yearlyPriceId = yearlyPrice.id;
    }
    
    const updatedSubscription = await updateSubscription(
      subscriptionId,
      {
        title,
        description,
        priceMonthly,
        priceYearly,
        stripePriceIdMonthly: monthlyPriceId,
        stripePriceIdYearly: yearlyPriceId,
        feature,
      },
    );

    if (!updatedSubscription) {
      return res.status(404).json({ error: 'Subscription not found or not owned by user' });
    }

    res.status(200).json(updatedSubscription);
  } catch (error) {
    logger.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
