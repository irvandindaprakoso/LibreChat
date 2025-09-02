const express = require('express');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');

const {
  checkoutController,
  webhookController,
} = require('~/server/controllers/StripeController');

const router = express.Router();

// Test webhook endpoint for local development
router.post('/test-webhook', (req, res) => {
  console.log('Test webhook called with body:', req.body);
  
  // Simulate a checkout.session.completed event
  const mockEvent = {
    id: 'evt_test_webhook',
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        object: 'checkout.session',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        metadata: req.body.metadata || {
          transactionId: req.body.transactionId || 'test_transaction_id',
          plan: req.body.plan || 'Premium Plan',
          billingCycle: req.body.billingCycle || 'monthly',
          userId: req.body.userId || 'test_user_id'
        }
      }
    }
  };

  // Create a mock request object for the webhook controller
  const mockReq = {
    body: JSON.stringify(mockEvent),
    headers: {
      'stripe-signature': 'test_signature'
    }
  };

  const mockRes = {
    status: (code) => ({
      json: (data) => {
        console.log(`Response ${code}:`, data);
        return res.status(code).json(data);
      }
    }),
    json: (data) => {
      console.log('Response:', data);
      return res.json(data);
    }
  };

  // Call the webhook controller
  webhookController(mockReq, mockRes);
});

// Webhook endpoint - no auth required (Stripe calls this)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  webhookController
);

// Checkout endpoint - requires authentication
router.post('/checkout', requireJwtAuth, checkoutController);

module.exports = router;
