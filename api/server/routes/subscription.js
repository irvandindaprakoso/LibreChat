const express = require('express');

const { getSubscription, updateSubscription } = require('~/models/Subscription');
const optionalJwtAuth = require('~/server/middleware/optionalJwtAuth');
const router = express.Router();

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

    // Pastikan user login
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updatedSubscription = await updateSubscription(
      subscriptionId,
      req.body
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
