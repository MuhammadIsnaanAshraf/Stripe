const mongoose = require('mongoose');
const { Schema } = mongoose;

// Customers schema
const customerSchema = new Schema({
  // UUID from auth.users
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'User',
  }, 
  // The user's customer ID in Stripe
  stripe_customer_id: {
    type: String,
    required: true,
    immutable: true, // This prevents the user from updating this field once it's set
  },
  payment_method_id: {
    type: String,
  },
  timeStamp: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure uniqueness for user-brand combination
customerSchema.index({ userId: 1}, { unique: true });

// Creating the Customer model
const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
