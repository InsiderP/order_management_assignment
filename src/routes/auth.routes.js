const express = require('express');
const { body } = require('express-validator');
const { register, login, refreshToken } = require('../controllers/auth.controller');
const { verifyRefreshToken } = require('../middleware/auth.middleware');

const router = express.Router();


const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];


router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', verifyRefreshToken, refreshToken);

module.exports = router; 