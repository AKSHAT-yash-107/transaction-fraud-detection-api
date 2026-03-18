const { pool } = require('../config/db');

// GET /api/transactions
const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, category_id, start_date, end_date, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT t.*, c.name AS category_name, c.color AS category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (type) { query += ' AND t.type = ?'; params.push(type); }
    if (category_id) { query += ' AND t.category_id = ?'; params.push(category_id); }
    if (start_date) { query += ' AND t.date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND t.date <= ?'; params.push(end_date); }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [transactions] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM transactions t WHERE t.user_id = ?';
    const countParams = [userId];
    if (type) { countQuery += ' AND t.type = ?'; countParams.push(type); }
    if (category_id) { countQuery += ' AND t.category_id = ?'; countParams.push(category_id); }
    if (start_date) { countQuery += ' AND t.date >= ?'; countParams.push(start_date); }
    if (end_date) { countQuery += ' AND t.date <= ?'; countParams.push(end_date); }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/transactions
const createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, amount, type, category_id, date, note } = req.body;

    // Validate category belongs to user (if provided)
    if (category_id) {
      const [cat] = await pool.query(
        'SELECT id FROM categories WHERE id = ? AND user_id = ?',
        [category_id, userId]
      );
      if (cat.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid category.' });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO transactions (user_id, category_id, title, amount, type, date, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, category_id || null, title, amount, type, date, note || null]
    );

    const [[transaction]] = await pool.query(
      `SELECT t.*, c.name AS category_name, c.color AS category_color
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, message: 'Transaction created.', data: transaction });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PUT /api/transactions/:id
const updateTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, amount, type, category_id, date, note } = req.body;

    const [existing] = await pool.query(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    await pool.query(
      'UPDATE transactions SET title=?, amount=?, type=?, category_id=?, date=?, note=? WHERE id=?',
      [title, amount, type, category_id || null, date, note || null, id]
    );

    const [[transaction]] = await pool.query(
      `SELECT t.*, c.name AS category_name, c.color AS category_color
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [id]
    );

    res.json({ success: true, message: 'Transaction updated.', data: transaction });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    await pool.query('DELETE FROM transactions WHERE id = ?', [id]);
    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/transactions/summary
const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    // Total income and expenses for the month
    const [[totals]] = await pool.query(
      `SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
        COUNT(*) AS total_transactions
       FROM transactions
       WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?`,
      [userId, currentMonth, currentYear]
    );

    // Category-wise breakdown
    const [categoryBreakdown] = await pool.query(
      `SELECT c.name, c.color, t.type,
              SUM(t.amount) AS total,
              COUNT(*) AS count
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND MONTH(t.date) = ? AND YEAR(t.date) = ?
       GROUP BY t.category_id, t.type
       ORDER BY total DESC`,
      [userId, currentMonth, currentYear]
    );

    // Budget alerts — categories where spending exceeds limit
    const [budgetAlerts] = await pool.query(
      `SELECT b.monthly_limit, c.name AS category_name, c.color,
              SUM(t.amount) AS spent,
              (SUM(t.amount) - b.monthly_limit) AS overspend
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON t.category_id = b.category_id
         AND MONTH(t.date) = b.month AND YEAR(t.date) = b.year
         AND t.type = 'expense'
       WHERE b.user_id = ? AND b.month = ? AND b.year = ?
       GROUP BY b.id
       HAVING spent > b.monthly_limit`,
      [userId, currentMonth, currentYear]
    );

    res.json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        total_income: totals.total_income || 0,
        total_expenses: totals.total_expenses || 0,
        net_savings: (totals.total_income || 0) - (totals.total_expenses || 0),
        total_transactions: totals.total_transactions,
        category_breakdown: categoryBreakdown,
        budget_alerts: budgetAlerts,
      },
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction, getSummary };
