const { logger } = require('@librechat/data-schemas');
const { Subscription } = require('~/db/models');


const initialSubscriptions = [
  {
    title: 'Premium Plan',
    description: 'Access to all features',
    priceMonthly: 10,
    priceYearly: 120,
    feature: ['Feature 1', 'Feature 2', 'Feature 3'],
  },
];

/**
 * Retrieves the first subscription.
 * @returns {Promise<Object|null>} The subscription object or null if not found.
 */
const getSubscription = async () => {
  try {
    const subscription = await Subscription.findOne().lean();
    return subscription || null;
  } catch (error) {
    logger.error('[getSubscription] Error getting subscription', error);
    throw new Error('Error getting subscription');
  }
};

/**
 * Updates subscription data by id.
 * @param {string} id - Subscription id.
 * @param {Object} data - Data to update.
 * @returns {Promise<Object|null>} Updated subscription.
 */
const updateSubscription = async (id, data) => {
  return await Subscription.findByIdAndUpdate(
    id,
    { $set: data }, // ensure it explicitly sets the values
    { new: true, lean: true });
};

/**
 * Inserts initial subscription data if collection is empty.
 * @returns {Promise<void>}
 */
const insertInitialSubscription = async () => {
  const count = await Subscription.countDocuments();
  if (count === 0) {
    await Subscription.insertMany(initialSubscriptions);
  }
};

module.exports = {
  getSubscription,
  updateSubscription,
  insertInitialSubscription,
};