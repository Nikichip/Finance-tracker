// api.js — drop this alongside your finance tracker HTML
// Replace all localStorage calls with these functions

const API_URL = 'https://your-backend.onrender.com'; // update after deploy

// ─── Auth helpers ────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('ft_token');
}

function saveToken(token) {
  localStorage.setItem('ft_token', token);
}

function clearToken() {
  localStorage.removeItem('ft_token');
  localStorage.removeItem('ft_user');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

async function signup(name, email, password) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  saveToken(data.token);
  localStorage.setItem('ft_user', JSON.stringify(data.user));
  return data.user;
}

async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  saveToken(data.token);
  localStorage.setItem('ft_user', JSON.stringify(data.user));
  return data.user;
}

function logout() {
  clearToken();
  window.location.reload();
}

function getCurrentUser() {
  const raw = localStorage.getItem('ft_user');
  return raw ? JSON.parse(raw) : null;
}

// ─── Transactions API ─────────────────────────────────────────────────────────

async function fetchTransactions() {
  const res = await fetch(`${API_URL}/transactions`, {
    headers: authHeaders(),
  });
  if (res.status === 401) { logout(); return []; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  // Normalize to match the shape your tracker already uses
  return data.transactions.map((t) => ({
    id: t.id,
    type: t.type,
    desc: t.description,
    amt: parseFloat(t.amount),
    cat: t.category,
    date: t.date.slice(0, 10),
  }));
}

async function addTransaction({ type, desc, amt, cat, date }) {
  const res = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ type, description: desc, amount: amt, category: cat, date }),
  });
  if (res.status === 401) { logout(); return null; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return {
    id: data.transaction.id,
    type: data.transaction.type,
    desc: data.transaction.description,
    amt: parseFloat(data.transaction.amount),
    cat: data.transaction.category,
    date: data.transaction.date.slice(0, 10),
  };
}

async function deleteTransaction(id) {
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (res.status === 401) { logout(); return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
}
