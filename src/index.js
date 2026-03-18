require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const transactionRoutes = require('./routes/transactions');

const app = express();

// ─── Middleware ─────────────────────────────
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api', limiter);

// ─── In-memory storage ──────────────────────
let transactions = [];

// ─── Routes ────────────────────────────────

// Root
app.get('/', (req, res) => {
  res.send('Finance Tracker API is running 🚀');
});

// Health
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API healthy' });
});

// Transactions
app.use('/api/transactions', transactionRoutes(transactions));

// Fraud route
app.get('/api/fraud', (req, res) => {
  const frauds = transactions.filter(t => t.fraud === true);
  res.json({ success: true, data: frauds });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Start Server ──────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});