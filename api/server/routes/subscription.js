const express = require('express');

const { getSubscription, updateSubscription } = require('~/models/Subscription');
const optionalJwtAuth = require('~/server/middleware/optionalJwtAuth');
const router = express.Router();

router.get('/', optionalJwtAuth, async (req, res) => {
  try {
    res.status(200).send(await getSubscription());
  } catch (error) {
    res.status(500).json({ message: 'Error getting banner' });
  }
});

router.put('/:subscription', async (req, res) => {
  try {
    const decodedSubscription = decodeURIComponent(req.params.subscription);
    const subscription = await updateSubscription(req.user.id, decodedSubscription, req.body);
    if (subscription) {
      res.status(200).json(subscription);
    } else {
      res.status(404).json({ error: 'Subscription not found' });
    }
  } catch (error) {
    logger.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router; 
