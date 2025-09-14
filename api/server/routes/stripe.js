const express = require('express');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');

const {
  checkoutController,
  webhookController,
} = require('~/server/controllers/StripeController');

const router = express.Router();

// Webhook endpoint - no auth required (Stripe calls this)
// MUST use raw body for signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  webhookController
);

// Checkout endpoint - requires authentication and JSON parsing
router.post(
  '/checkout', 
  express.json(), // Add JSON parsing specifically for this route
  requireJwtAuth, 
  checkoutController
);

module.exports = router;
