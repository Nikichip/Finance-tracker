const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All transaction routes require a valid JWT
router.use(authenticate);

// GET /transactions — fetch all for the logged-in user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, description, amount, category, date, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY date DESC, created_at DESC`,
      [req.userId]
    );
    res.json({ transactions: result.rows });
  } catch (err) {
    console.error('Fetch transactions error:', err);
    res.status(500).json({ error: 'Could not fetch transactions' });
  }
});

// POST /transactions — create a new transaction
router.post('/', async (req, res) => {
  const { type, description, amount, category, date } = req.body;

  if (!type || !description || !amount || !category || !date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be income or expense' });
  }

  if (isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, description, amount, category, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, type, description, amount, category, date, created_at`,
      [req.userId, type, description.trim(), Number(amount), category.trim(), date]
    );
    res.status(201).json({ transaction: result.rows[0] });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Could not create transaction' });
  }
});

// DELETE /transactions/:id — delete only if it belongs to the logged-in user
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ deleted: result.rows[0].id });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Could not delete transaction' });
  }
});

module.exports = router;
