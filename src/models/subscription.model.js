const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    // Stripe subscription ID
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Customer reference
    // customerId: {
    //   type: String, // Stripe customer ID
    //   required: true,
    //   index: true,
    // },

    // Plan details
    // planId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Plan',
    //   // required: true,
    // },

    // Stripe price ID
    stripePriceId: {
      type: String,
      required: true,
    },

    // Subscription status from Stripe
    status: {
      type: String,
      enum: ['incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'],
      required: true,
      default: 'incomplete',
    },

    // Billing details
    billing: {
      interval: {
        type: String,
        enum: ['day', 'week', 'month', 'year'],
        required: true,
      },
      intervalCount: {
        type: Number,
        default: 1,
        min: 1,
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        required: true,
        default: 'usd',
        lowercase: true,
      },
    },

    // Trial information
    trial: {
      start: {
        type: Date,
      },
      end: {
        type: Date,
      },
      hasTrialed: {
        type: Boolean,
        default: false,
      },
    },

    // Important dates
    created: {
      type: Date,
      required: true,
    },
    current_period_start: {
      type: Date,
      required: true,
    },
    current_period_end: {
      type: Date,
      required: true,
    },
    canceled_at: {
      type: Date,
    },
    cancel_at: {
      type: Date,
    },
    ended_at: {
      type: Date,
    },
    cancel_at_period_end: {
      type: Boolean,
      default: false,
    },

    // Payment method
    defaultPaymentMethod: {
      type: String, // Stripe payment method ID
    },

    // Latest invoice
    latestInvoice: {
      type: String, // Stripe invoice ID
    },

    // Discount information
    discount: {
      couponId: {
        type: String, // Stripe coupon ID
      },
      promotionCodeId: {
        type: String, // Stripe promotion code ID
      },
      start: {
        type: Date,
      },
      end: {
        type: Date,
      },
    },

    // Metadata from Stripe
    metadata: {
      type: Map,
      of: String,
      default: {},
    },

    // Cancellation details
    cancellation: {
      reason: {
        type: String,
        enum: ['user_requested', 'payment_failed', 'invoice_payment_failed', 'plan_changed', 'admin_canceled', 'other'],
      },
      canceledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      canceledAt: {
        type: Date,
      },
      cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ customerId: 1 });
subscriptionSchema.index({ 'dates.currentPeriodEnd': 1 });
subscriptionSchema.index({ createdAt: -1 });
subscriptionSchema.index({ status: 1, 'dates.currentPeriodEnd': 1 });

// Export the model
module.exports = mongoose.model('Subscription', subscriptionSchema);
