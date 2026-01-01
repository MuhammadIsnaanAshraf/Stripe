const mongoose = require('mongoose');

const stripeProductSchema = new mongoose.Schema(
  {
    stripeProductId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ['service', 'good'],
      default: 'service',
    },
    images: {
      type: [String],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StripeProduct', stripeProductSchema);
