const { pool } = require('../config/db');

// ─── CATEGORIES ───────────────────────────────────────

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY type, name',
      [req.user.id]
    );
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, type, color } = req.body;
    const [result] = await pool.query(
      'INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)',
      [req.user.id, name, type, color || '#6366f1']
    );
    res.status(201).json({
      success: true,
      message: 'Category created.',
      data: { id: result.insertId, name, type, color },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─── BUDGETS ──────────────────────────────────────────

// GET /api/budgets
const getBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const [budgets] = await pool.query(
      `SELECT b.*, c.name AS category_name, c.color, c.type AS category_type,
              COALESCE(SUM(t.amount), 0) AS spent
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON t.category_id = b.category_id
         AND MONTH(t.date) = b.month AND YEAR(t.date) = b.year AND t.type = 'expense'
       WHERE b.user_id = ? AND b.month = ? AND b.year = ?
       GROUP BY b.id`,
      [req.user.id, currentMonth, currentYear]
    );

    res.json({ success: true, data: budgets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/budgets
const setBudget = async (req, res) => {
  try {
    const { category_id, monthly_limit, month, year } = req.body;

    // Verify category belongs to user
    const [cat] = await pool.query(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?',
      [category_id, req.user.id]
    );
    if (cat.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid category.' });
    }

    // Upsert budget
    await pool.query(
      `INSERT INTO budgets (user_id, category_id, monthly_limit, month, year)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit)`,
      [req.user.id, category_id, monthly_limit, month, year]
    );

    res.status(201).json({ success: true, message: 'Budget set successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getCategories, createCategory, deleteCategory, getBudgets, setBudget };
