const express = require('express');
const router = express.Router();
const productController = require('../../controllers/product.controller');

// GET /products - Get all products
router.get('/', productController.getAllProducts);

// GET /products/:id - Get product by ID
router.get('/:id', productController.getProductById);

// POST /products - Create new product
router.post('/', productController.createProduct);

// PUT /products/:id - Update product
router.put('/:id', productController.updateProduct);

// DELETE /products/:id - Delete product
router.delete('/:id', productController.deleteProduct);

module.exports = router;
