const Product = require('../models/product.model');

class ProductService {
  
  /**
   * Get all products with optional filtering and pagination
   */
  async getAllProducts(query = {}) {
    try {
      const { page = 1, limit = 10, category, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
      
      // Build filter object
      const filter = {};
      if (category) {
        filter.category = category;
      }
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const products = await Product.find(filter)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Product.countDocuments(filter);

      return {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error('Failed to fetch products: ' + error.message);
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id) {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      throw new Error('Failed to fetch product: ' + error.message);
    }
  }

  /**
   * Create new product
   */
  async createProduct(productData) {
    console.log('Creating product:', productData);
    try {
      const product = new Product(productData);
      await product.save();
      return product;
    } catch (error) {
      throw new Error('Failed to create product: ' + error.message);
    }
  }

  /**
   * Update product by ID
   */
  async updateProduct(id, updateData) {
    try {
      const product = await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      return product;
    } catch (error) {
      throw new Error('Failed to update product: ' + error.message);
    }
  }

  /**
   * Delete product by ID
   */
  async deleteProduct(id) {
    try {
      const product = await Product.findByIdAndDelete(id);
      if (!product) {
        throw new Error('Product not found');
      }
      return { message: 'Product deleted successfully' };
    } catch (error) {
      throw new Error('Failed to delete product: ' + error.message);
    }
  }
}

module.exports = new ProductService();
