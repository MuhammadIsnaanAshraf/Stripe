const subscriptionService = require('../services/subscription.service');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { calculateTrialEndUnixTimestamp } = require('../utils/globalFunctions');
/**
 * Get all subscriptions
 */
const relevantWebhookEvents = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'checkout.session.completed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'invoice.paid'
];
const TRIAL_PERIOD_DAYS = parseInt(process.env.TRIAL_PERIOD_DAYS) || 7;
console.log("🚀 ~ TRIAL_PERIOD_DAYS:", TRIAL_PERIOD_DAYS)
const subscriptionWebhook = async (req, res) => {
  console.log("Reached subscription webhook");
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  console.log("🚀 ~ subscriptionWebhook ~ sig:", sig);
  console.log("🚀 ~ subscriptionWebhook ~ webhookSecret:", webhookSecret);
  console.log("🚀 ~ subscriptionWebhook ~ req.body:", req.body);
  try {
  if(!sig || !webhookSecret) {
    throw new Error('Missing signature or webhook secret');
  }
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  console.log("🚀 ~ subscriptionWebhook ~ event:", event);
  const payment = await webHookHandler(event);
  console.log("🚀 ~ subscriptionWebhook ~ payment:", payment)
   if (!payment) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }
    res.send(payment);
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

}

const webHookHandler = async (event) => {
  console.log("🚀 ~ webHookHandler ~ event:", event.type)
  if(relevantWebhookEvents.includes(event.type)) {
    switch(event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':   
      const subscription = event.data.object;
        console.log("🚀 ~ webHookHandler ~ subscription:", subscription)
        return await subscriptionService.handleSubscriptionEvent(
          subscription,
          subscription.customer,
          event.type === 'customer.subscription.created',
          subscription.priceId,
        );
      case 'product.created':
      case 'product.updated':
          return await subscriptionService.handleProductEvent(event);
      case 'price.created':
      case 'price.updated':
          return await subscriptionService.handlePriceEvent(event);
      case "price.deleted":
              return await subscriptionService.deletePriceRecord(event);
      case "product.deleted":
                return await subscriptionService.deleteProductRecord(event);
      case 'checkout.session.completed':
        return await subscriptionService.handleCheckoutSessionCompleted(event);
      case 'invoice.paid':
        return await subscriptionService.handleInvoicePaid(event);
      case 'payment_intent.succeeded':
        return await subscriptionService.handlePaymentIntentSucceeded(event);
      case 'payment_intent.payment_failed':
        return await subscriptionService.handlePaymentIntentFailed(event);
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return null;
    }
  }
}

const getAllSubscriptions = async (req, res) => {
  try {
    const result = await subscriptionService.getAllSubscriptions(req.query);

    res.status(200).json({
      success: true,
      data: result.subscriptions,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get subscription by ID
 */
const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.getSubscriptionById(id);

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create new subscription
 */
const createSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.createSubscription(req.body);

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Subscription created successfully',
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update subscription
 */
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.updateSubscription(id, req.body);

    res.status(200).json({
      success: true,
      data: subscription,
      message: 'Subscription updated successfully',
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete subscription
 */
const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await subscriptionService.deleteSubscription(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get subscriptions by user ID
 */
const getUserSubscriptions = async (req, res) => {
  try {
    const { userId } = req.params;
    const subscriptions = await subscriptionService.getSubscriptionsByUserId(userId);

    res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.cancelSubscription(id, req.body);

    res.status(200).json({
      success: true,
      data: subscription,
      message: 'Subscription canceled successfully',
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};
const checkoutWithStripeEmbedded = async (req, res) => {
  let { redirectPath = '/', plan = null, useTrial  } = req.body;
  console.log("🚀 ~ checkoutWithStripeEmbedded ~ useTrial:", useTrial)
  console.log("🚀 ~ checkoutWithStripeEmbedded ~ plan:", plan)
  const { user } = req;
  console.log('🚀 ~ checkoutWithStripeEmbedded ~ user:', user);

  const customer = await subscriptionService.getOrCreateStripeCustomer(user?.id, user?.email);
  console.log('🚀 ~ checkoutWithStripeEmbedded ~ customer:', customer);

  let price;
  if (plan) {
    price = await subscriptionService.getPriceByPriceId(
      plan === process.env.STRIPE_PRO_PRODUCT_NAME
        ? process.env.STRIPE_PRO_PRODUCT_PRICE_ID
        : plan === process.env.STRIPE_BUSINESS_PRODUCT_NAME
        ? process.env.STRIPE_BUSINESS_PRODUCT_PRICE_ID
        : plan === process.env.STRIPE_RENEWED_PRODUCT_NAME
        ? process.env.STRIPE_RENEWED_PRODUCT_PRICE_ID
        : process.env.STRIPE_ENTERPRISE_PRODUCT_PRICE_ID
    );
  }
  console.log('🚀 ~ checkoutWithStripeEmbedded ~ price:', price);

  if (!price) {
    const stripePrice = await stripe.prices.retrieve(
      plan === process.env.STRIPE_PRO_PRODUCT_NAME
        ? process.env.STRIPE_PRO_PRODUCT_PRICE_ID
        : plan === process.env.STRIPE_BUSINESS_PRODUCT_NAME
        ? process.env.STRIPE_BUSINESS_PRODUCT_PRICE_ID
        : plan === process.env.STRIPE_RENEWED_PRODUCT_NAME
        ? process.env.STRIPE_RENEWED_PRODUCT_PRICE_ID
        : process.env.STRIPE_ENTERPRISE_PRODUCT_PRICE_ID
    );
    price = await subscriptionService.upsertPriceRecord(stripePrice);
  }
  console.log("🚀 ~ checkoutWithStripeEmbedded ~ price after fetch:", price)
  const params = {
    ui_mode: 'embedded',
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer: customer?.stripeId, // Use the customer ID instead of an object
    customer_update: {
      address: 'auto',
    },
    line_items: [
      {
        price: price.priceId,
        quantity: 1,
      },
    ],
    return_url: `${
      process.env.REACT_APP_URL
    }?session_id={CHECKOUT_SESSION_ID}`,
    mode: 'subscription',
    subscription_data: {
      trial_end: useTrial ? calculateTrialEndUnixTimestamp(TRIAL_PERIOD_DAYS) : undefined,
      metadata: {
        role: user?.role, // Adding the user's role to metadata
        priceId: price?.id || price?._id,
        plan,
        customerId: customer?.customerId.toString(),
      },
    },
  };


   const session = await stripe.checkout.sessions.create(params);

  if (!session) {
    throw new Error('Failed to create session.');
  }

  res.send({ clientSecret: session.client_secret });

};

module.exports = {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getUserSubscriptions,
  cancelSubscription,
  checkoutWithStripeEmbedded,
  subscriptionWebhook,
};
