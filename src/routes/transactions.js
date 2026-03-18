const express = require('express');

module.exports = (transactions) => {
  const router = express.Router();

  // Add transaction
  router.post('/', (req, res) => {
    const { userId, amount } = req.body;

    if (!userId || amount == null) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const transaction = {
      id: transactions.length + 1,
      userId,
      amount,
      fraud: amount > 10000,
      timestamp: new Date(),
    };

    transactions.push(transaction);

    res.status(201).json({ success: true, data: transaction });
  });

  // Get all transactions
  router.get('/', (req, res) => {
    res.json({ success: true, data: transactions });
  });

  return router;
};