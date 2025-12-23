const mongoose = require('mongoose');
const { Schema } = mongoose;

// Enum for pricing type
const pricingTypeEnum = ['one_time', 'recurring'];

// Enum for pricing plan interval
const pricingPlanIntervalEnum = ['day', 'week', 'month', 'year','one_time'];

// Prices schema
const priceSchema = new Schema({
  // Price ID from Stripe, e.g., price_1234
  priceId: {
    type: String,
    required: true,
    unique: true,
  },
  // The ID of the product that this price belongs to
  product_id: {
    type: String,
    ref: 'Product', // Referencing the Product model
    required: true,
  },
  // Whether the price can be used for new purchases
  active: {
    type: Boolean,
    required: true,
  },
  // A brief description of the price
  description: {
    type: String,
  },
  // The unit amount as a positive integer in the smallest currency unit
  unit_amount: {
    type: Number, // Using Number instead of BigInt due to JavaScript limitations
    required: true,
  },
  // Three-letter ISO currency code, in lowercase
  currency: {
    type: String,
    required: true,
    validate: {
      validator(v) {
        return v.length === 3;
      },
      message: (props) => `${props.value} is not a valid currency code.`,
    },
  },
  // One of `one_time` or `recurring`
  type: {
    type: String,
    enum: pricingTypeEnum,
    required: true,
  },
  // The frequency at which a subscription is billed
  interval: {
    type: String,
    enum: pricingPlanIntervalEnum,
    required: true,
  },
  // The number of intervals between subscription billings
  interval_count: {
    type: Number,
    default: 1,
  },
  // Default number of trial days
  trial_period_days: {
    type: Number,
    default: 0,
  },
  // Set of key-value pairs to store additional information
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
  },
});

// Creating the Price model
const Price = mongoose.model('Price', priceSchema);

module.exports = Price;
