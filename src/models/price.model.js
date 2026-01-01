const mongoose = require('mongoose');
const { Schema } = mongoose;

const pricingTypeEnum = ['one_time', 'recurring'];

const pricingPlanIntervalEnum = ['day', 'week', 'month', 'year','one_time'];

 const priceSchema = new Schema({
  priceId: {
    type: String,
    required: true,
    unique: true,
  },
  product_id: {
    type: String,
    ref: 'StripeProduct',
  },
  active: {
    type: Boolean,
    required: true,
  },
  description: {
    type: String,
  },
   unit_amount: {
    type: Number,  
    required: true,
  },
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
  type: {
    type: String,
    enum: pricingTypeEnum,
    required: true,
  },
  interval: {
    type: String,
    enum: pricingPlanIntervalEnum,
    required: true,
  },
  interval_count: {
    type: Number,
    default: 1,
  },
  trial_period_days: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
  },
});

// Creating the Price model
const Price = mongoose.model('Price', priceSchema);

module.exports = Price;
