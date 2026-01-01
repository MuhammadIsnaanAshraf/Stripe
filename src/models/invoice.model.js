const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const invoiceSchema = new mongoose.Schema({
    invoiceId: { type: String, required: true, unique: true }, // Stripe invoice ID
    customerId: { type: String, required: true }, // Stripe customer ID
    subscriptionId: { type: String }, // If invoice belongs to a subscription
    billing_reason: { type: String }, // subscription_create, subscription_cycle, manual...

    amount_due: { type: Number }, // total before payment
    amount_paid: { type: Number }, // total actually paid
    currency: { type: String },

    status: { type: String }, // draft, open, paid, void, uncollectible
 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    created: { type: Date }, // invoice creation date
    period_start: { type: Date }, // subscription period start
    period_end: { type: Date },   // subscription period end
    total: { type: Number }, // total amount of the invoice
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;