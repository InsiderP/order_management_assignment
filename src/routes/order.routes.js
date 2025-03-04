const express = require('express');
const { body } = require('express-validator');
const { createOrder, getOrder } = require('../controllers/order.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation middleware
const orderValidation = [
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required'),
  body('items.*.name').notEmpty().withMessage('Product name is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.zipCode').notEmpty().withMessage('ZIP code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required')
];

// Routes
router.post('/', verifyToken, orderValidation, createOrder);
router.get('/:id', verifyToken, getOrder);

module.exports = router; 