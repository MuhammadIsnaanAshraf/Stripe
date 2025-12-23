const Subscription = require('../models/subscription.model'); 
const User = require('../models/user.model');
const Customer = require('../models/customer.model');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Price = require('../models/price.model');
const { toDateTime } = require('../utils/globalFunctions');
/**
 * Get all subscriptions with optional filtering and pagination
 */
const getAllSubscriptions = async (query = {}) => {
  try {
    const { page = 1, limit = 10, userId, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // Build filter object
    const filter = {};
    if (userId) {
      filter.userId = userId;
    }
    if (status) {
      filter.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const subscriptions = await Subscription.find(filter)
      .populate('userId', 'name email')
      .populate('planId', 'name pricing')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Subscription.countDocuments(filter);

    return {
      subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error('Failed to fetch subscriptions: ' + error.message);
  }
};

/**
 * Get subscription by ID
 */
const getSubscriptionById = async (id) => {
  try {
    const subscription = await Subscription.findById(id).populate('userId', 'name email').populate('planId', 'name pricing');

    if (!subscription) {
      throw new Error('Subscription not found');
    }
    return subscription;
  } catch (error) {
    throw new Error('Failed to fetch subscription: ' + error.message);
  }
};

/**
 * Create new subscription
 */
const createSubscription = async (subscriptionData) => {
  try {
    const subscription = new Subscription(subscriptionData);
    await subscription.save();

    // Populate references before returning
    await subscription.populate('userId', 'name email');
    await subscription.populate('planId', 'name pricing');

    return subscription;
  } catch (error) {
    throw new Error('Failed to create subscription: ' + error.message);
  }
};

/**
 * Update subscription by ID
 */
const updateSubscription = async (id, updateData) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('userId', 'name email')
      .populate('planId', 'name pricing');

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return subscription;
  } catch (error) {
    throw new Error('Failed to update subscription: ' + error.message);
  }
};

/**
 * Delete subscription by ID
 */
const deleteSubscription = async (id) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    return { message: 'Subscription deleted successfully' };
  } catch (error) {
    throw new Error('Failed to delete subscription: ' + error.message);
  }
};

/**
 * Get subscriptions by user ID
 */
const getSubscriptionsByUserId = async (userId) => {
  try {
    const subscriptions = await Subscription.find({ userId }).populate('planId', 'name pricing').sort({ createdAt: -1 });

    return subscriptions;
  } catch (error) {
    throw new Error('Failed to fetch user subscriptions: ' + error.message);
  }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (id, cancelData = {}) => {
  try {
    const { reason = 'user_requested', canceledBy, cancelAtPeriodEnd = true } = cancelData;

    const subscription = await Subscription.findByIdAndUpdate(
      id,
      {
        status: cancelAtPeriodEnd ? 'active' : 'canceled',
        'cancellation.reason': reason,
        'cancellation.canceledBy': canceledBy,
        'cancellation.canceledAt': new Date(),
        'cancellation.cancelAtPeriodEnd': cancelAtPeriodEnd,
        cancelAtPeriodEnd: cancelAtPeriodEnd,
      },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email')
      .populate('planId', 'name pricing');

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return subscription;
  } catch (error) {
    throw new Error('Failed to cancel subscription: ' + error.message);
  }
};
const createCustomerInStripe = async (email, userId) => {
  const customerData = { metadata: { userId }, email: email };
  const newCustomer = await stripe.customers.create(customerData);
  if (!newCustomer) throw new Error('Stripe customer creation failed.');

  return newCustomer.id;
};

const getOrCreateStripeCustomer = async (userId, email) => {
  let userDetails;
  let existingCustomer;
  try {
    userDetails = await User.findById(userId);
    if (!userDetails) {
      throw new Error('User not found');
    }
    if (userDetails?.stripe_id) {
      existingCustomer = await Customer.findById(userDetails?.stripe_id).exec();
    } else {
      existingCustomer = await Customer.findOne({ userId }).exec();
    }
    let stripeCustomerId;

    if (existingCustomer?.stripe_customer_id) {
      try {
        const stripeCustomer = await stripe.customers.retrieve(existingCustomer.stripe_customer_id);
        stripeCustomerId = stripeCustomer.id;
      } catch (error) {
        console.error(`Error retrieving Stripe customer: ${error.message}`);
      }
    }
    console.log("🚀 ~ getOrCreateStripeCustomer ~ stripeCustomerId:", stripeCustomerId)
    console.log("🚀 ~ getOrCreateStripeCustomer ~ existingCustomer:", existingCustomer)
    const stripeIdToInsert = stripeCustomerId ? stripeCustomerId : await createCustomerInStripe(email, userId);
    console.log("🚀 ~ getOrCreateStripeCustomer ~ stripeIdToInsert:", stripeIdToInsert)
    if (!stripeIdToInsert) throw new Error('Stripe customer creation failed.');
    if (!existingCustomer) {
      const newCustomer = new Customer({
        userId,
        // brandId: brandId || null, // Set brandId if provided, otherwise null for backward compatibility
        // agencyId: agencyId || null, // Set agencyId if provided, otherwise null for backward compatibility
        stripe_customer_id: stripeIdToInsert,
      });
      console.log("🚀 ~ getOrCreateStripeCustomer ~ newCustomer:", newCustomer)
      await newCustomer.save();
      if (!newCustomer) throw new Error('MongoDB customer record creation failed.');
      return { stripeId: stripeIdToInsert, customerId: newCustomer._id };
    }
    return { stripeId: stripeIdToInsert, customerId: existingCustomer._id };

  } catch (error) {
    throw new Error('Failed to get or create Stripe customer: ' + error.message);
  }
};

const getPriceById = async (id) => {
  try {
    console.log("🚀 ~ getPriceById ~ id:", id)
    const price = await Price.findById(id);
    return price;
  } catch (error) {
    throw new Error('Failed to fetch price by ID: ' + error.message);
  }
};
const getPriceByPriceId = async (priceId) => {
  try {
    console.log("🚀 ~ getPriceByPriceId ~ priceId:", priceId)
    const price = await Price.findOne({ priceId });
    return price;
  } catch (error) {
    throw new Error('Failed to fetch price by Price ID: ' + error.message);
  }
}

const upsertPriceRecord = async (price, retryCount = 0, maxRetries = 3) => {
  const priceData = {
    priceId: price.id,
    product_id: typeof price.product === 'string' ? price.product : '',
    active: price.active,
    currency: price.currency,
    type: price.type,
    unit_amount: price.unit_amount ?? null,
    interval: price.recurring ? price.recurring?.interval : price?.type || null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? 0,
    description: null,
    metadata: null,
  };
  let dbPrice = await Price.findOne({ priceId: price.id });
  if (dbPrice) {
    dbPrice = await Price.updateOne({ priceId: price.id }, priceData);
  } else {
    dbPrice = await Price.create(priceData);
  }
  return dbPrice;
};
const handleSubscriptionEvent = async (subscription, customerId, createAction = false, priceId) => {
  console.log("🚀 ~ handleSubscriptionEvent ~ priceId:", priceId)
  // const subscriptionData = await stripe.subscriptions.retrieve(subscription.id);
  console.log("🚀 ~ handleSubscriptionEvent ~ subscriptionData:", subscription)
  let customer;
  customer = await stripe.customers.retrieve(customerId);
  if (!customer) {
    customer = await Customer.findOne({ stripe_customer_id: customerId });
  } 
  console.log("🚀 ~ handleSubscriptionEvent ~ customer:", customer)
  if (!customer) {
    throw new Error('Customer not found for subscription event handling.');
  }
  const userId = customer?.metadata?.userId || customer?.userId;
  console.log("🚀 ~ handleSubscriptionEvent ~ userId:", userId)
  const upsertedSubscription = await upsertSubscriptionRecord(subscription, customer, userId, createAction, priceId);
  await upsertUserSubscriptionRecord(userId, subscription, customer);

  return upsertedSubscription;

}

const buildSubscriptionData = async (subscription, customer, createAction = false, priceId) => {
  console.log("🚀 ~ buildSubscriptionData ~ priceId:", priceId)
  // Helper function to safely convert timestamps
  const safeToISOString = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) return null;
    try {
      return toDateTime(timestamp).toISOString();
    } catch (error) {
      console.warn('Invalid timestamp:', timestamp, error.message);
      return null;
    }
  };
  const calculatedEndDate = (subscription) => {
    // current_period_end = subscription?.current_period_start + 

  }

  const finalData = {
    stripeSubscriptionId: subscription.id,
    userId: customer.metadata?.userId,
    metadata: subscription.metadata,
    status: subscription.status,
    stripePriceId: priceId || subscription.items.data[0].price.id,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: safeToISOString(subscription.cancel_at),
    canceled_at: safeToISOString(subscription.canceled_at),
    current_period_start: safeToISOString(subscription.current_period_start),
    current_period_end: safeToISOString(subscription.current_period_end),
    created: safeToISOString(subscription.created),
    ended_at: safeToISOString(subscription.ended_at),
    trial : {
      start: safeToISOString(subscription.trial_start),
      end: safeToISOString(subscription.trial_end), 
    },
    hasTrialed: !subscription.trial_start && !subscription.trial_end,
    defaultPaymentMethod: subscription.default_payment_method || null,
    latestInvoice: subscription.latest_invoice || null,
    "billing.interval": subscription?.plan?.interval,
    "billing.amount": subscription?.plan?.amount,
    "billing.currency": subscription?.plan?.currency,
    "billing.intervalCount": subscription?.plan?.interval_count,
  };
  console.log("🚀 ~ buildSubscriptionData ~ finalData:", finalData);
  return finalData;
};

const upsertSubscriptionRecord = async (subscription, customer, userId, createAction = false, priceId) => {
  console.log("🚀 ~ upsertSubscriptionRecord ~ priceId:", priceId)
  console.log("🚀 ~ upsertSubscriptionRecord ~ subscriptionData:", subscription)
  const subscriptionRecord = await Subscription.findOne({ userId: userId, status: { $ne: 'canceled' }, stripePriceId: priceId  })
  console.log("🚀 ~ upsertSubscriptionRecord ~ subscription:", subscriptionRecord)
  const subscriptionPayload = await buildSubscriptionData(subscription, customer, createAction, priceId);
  console.log("🚀 ~ upsertSubscriptionRecord ~ subscriptionPayload:", subscriptionPayload)
  if (!subscriptionRecord && createAction) {
    let subcriptionData = await Subscription.create(subscriptionPayload);
    console.log("🚀 ~ upsertSubscriptionRecord ~ subcriptionData:", subcriptionData)
    return subcriptionData;
  }
   const updatedSubscription = await Subscription.findByIdAndUpdate(subscriptionRecord._id, subscriptionPayload, { new: true });
   console.log("🚀 ~ upsertSubscriptionRecord ~ updatedSubscription:", updatedSubscription)
  return updatedSubscription;
  // Update existing subscription
}
const upsertUserSubscriptionRecord = async (userId, subscription, customer) => {
console.log("🚀 ~ upsertUserSubscriptionRecord ~ userId:", userId)
const user = await User.findById(userId);
if (!user) {
  throw new Error('User not found for upserting subscription record.');
}
user.subscriptionId = subscription.id; // heres a quesion what if a user  have more than one subscription?
user.subscription = {
  plan: subscription.metadata.plan,
   subscriptionStatus: subscription.status,
    startedAt: new Date(subscription.start_date * 1000),
    expiredAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
}
await user.save();
  return user;
}

// const buildSubscriptionData
module.exports = {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscriptionsByUserId,
  cancelSubscription,
  getOrCreateStripeCustomer,
  getPriceById,
  upsertPriceRecord,
  getPriceByPriceId,
  handleSubscriptionEvent,
  upsertSubscriptionRecord,
  upsertUserSubscriptionRecord,
  buildSubscriptionData,
};
