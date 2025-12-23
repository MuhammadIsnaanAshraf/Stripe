const express = require('express');
const router = express.Router();
const subscriptionController = require('../../controllers/subscription.controller');
const auth = require('../../middlewares/auth');
const roles = require('../../config/roles');
// GET /subscriptions - Get all subscriptions
router.get('/', subscriptionController.getAllSubscriptions);
router.post("/checkout-embedded", auth({}), subscriptionController.checkoutWithStripeEmbedded);

// GET /subscriptions/:id - Get subscription by ID
router.get('/:id', auth({}), subscriptionController.getSubscriptionById);

// POST /subscriptions - Create new subscription
router.post('/', auth(), subscriptionController.createSubscription);

// PUT /subscriptions/:id - Update subscription
router.put('/:id', auth(), subscriptionController.updateSubscription);

// DELETE /subscriptions/:id - Delete subscription
router.delete('/:id', auth(), subscriptionController.deleteSubscription);

// GET /subscriptions/user/:userId - Get subscriptions by user ID
router.get('/user/:userId', auth(), subscriptionController.getUserSubscriptions);

// PUT /subscriptions/:id/cancel - Cancel subscription
router.put('/:id/cancel', auth(), subscriptionController.cancelSubscription);

module.exports = router;
