-- ─────────────────────────────────────────────────────────────────
-- Finance Tracker — PostgreSQL Schema
-- Run this file to set up the database from scratch.
--
-- Usage:
--   psql -d finance_tracker -f finance_tracker_schema.sql
--
-- Or paste the contents into any PostgreSQL client (TablePlus,
-- pgAdmin, Render's SQL console, Railway's query tab, etc.)
-- ─────────────────────────────────────────────────────────────────


-- ── USERS ────────────────────────────────────────────────────────
-- One row per registered user.
-- Password is stored as a bcrypt hash — never plain text.

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL        PRIMARY KEY,
  name        TEXT          NOT NULL,
  email       TEXT          NOT NULL UNIQUE,
  password    TEXT          NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ── TRANSACTIONS ─────────────────────────────────────────────────
-- Every income or expense entry belongs to exactly one user.
-- Deleting a user cascades and removes all their transactions.

CREATE TABLE IF NOT EXISTS transactions (
  id          SERIAL        PRIMARY KEY,
  user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT          NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT          NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category    TEXT          NOT NULL,
  date        DATE          NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index speeds up GET /transactions — filters by user_id on every request
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON transactions(user_id);

-- Index speeds up month-based filtering in the analytics view
CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON transactions(date);


-- ── OPTIONAL: SEED DATA ──────────────────────────────────────────
-- Uncomment the block below to insert a demo user + sample
-- transactions so you can test the app immediately after deploy.
--
-- Demo login:
--   Email:    demo@example.com
--   Password: password123
--
-- The password hash below is bcrypt(password123, rounds=12).
-- Generate a fresh one with: node -e "const b=require('bcryptjs');b.hash('yourpassword',12).then(console.log)"

/*
INSERT INTO users (name, email, password) VALUES (
  'Demo User',
  'demo@example.com',
  '$2a$12$KIx5XvbKmDnMoNK7Z2k./.q1D3s8nLo4Jz7WtRkOjqGzMJFoFp5wO'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO transactions (user_id, type, description, amount, category, date)
SELECT
  u.id,
  v.type,
  v.description,
  v.amount,
  v.category,
  v.date
FROM users u
CROSS JOIN (VALUES
  ('income',  'Monthly salary',       45000.00, 'Salary',         DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '0 days'),
  ('expense', 'Grocery shopping',      2800.00, 'Food',           DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 days'),
  ('expense', 'Metro pass',             500.00, 'Transport',      DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '3 days'),
  ('expense', 'OTT subscriptions',      799.00, 'Entertainment',  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '4 days'),
  ('expense', 'Electricity bill',      1200.00, 'Bills',          DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '5 days'),
  ('expense', 'Restaurant dinner',      950.00, 'Food',           DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '8 days'),
  ('income',  'Freelance project',    12000.00, 'Freelance',      DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '10 days'),
  ('expense', 'Gym membership',         800.00, 'Health',         DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '11 days'),
  ('expense', 'Clothing',              3200.00, 'Shopping',       DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '14 days'),
  ('expense', 'Auto rickshaw',          320.00, 'Transport',      DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '15 days')
) AS v(type, description, amount, category, date)
WHERE u.email = 'demo@example.com';
*/


-- ── HELPFUL QUERIES ──────────────────────────────────────────────
-- Uncomment and run these to inspect data during development.

-- All users:
-- SELECT id, name, email, created_at FROM users;

-- All transactions for a specific user (replace 1 with actual user id):
-- SELECT * FROM transactions WHERE user_id = 1 ORDER BY date DESC;

-- Monthly summary per user:
-- SELECT
--   u.name,
--   TO_CHAR(t.date, 'YYYY-MM')   AS month,
--   t.type,
--   SUM(t.amount)                AS total
-- FROM transactions t
-- JOIN users u ON u.id = t.user_id
-- GROUP BY u.name, month, t.type
-- ORDER BY u.name, month, t.type;

-- Top spending categories for a user:
-- SELECT category, SUM(amount) AS total
-- FROM transactions
-- WHERE user_id = 1 AND type = 'expense'
-- GROUP BY category
-- ORDER BY total DESC;
