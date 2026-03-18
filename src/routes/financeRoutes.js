const express = require('express');
const { body } = require('express-validator');
const {
  getCategories, createCategory, deleteCategory,
  getBudgets, setBudget,
} = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

// Categories
router.get('/categories', getCategories);
router.post('/categories', [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  validate,
], createCategory);
router.delete('/categories/:id', deleteCategory);

// Budgets
router.get('/budgets', getBudgets);
router.post('/budgets', [
  body('category_id').isInt({ gt: 0 }).withMessage('Valid category ID is required'),
  body('monthly_limit').isFloat({ gt: 0 }).withMessage('Monthly limit must be a positive number'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020 }).withMessage('Valid year is required'),
  validate,
], setBudget);

module.exports = router;
