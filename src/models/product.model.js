const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  category: {
    type: String,
    required: true,
    trim: true
  },
  
  image: {
    type: String,
    // required: true
  },
  
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  
  reviews: {
    type: Number,
    default: 0,
    min: 0
  },
  
  inStock: {
    type: Boolean,
    default: true
  },
  
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
