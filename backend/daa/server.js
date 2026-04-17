const fetch = require('node-fetch');
const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3001;

// Cho phép mọi origin gọi proxy (giới hạn lại khi deploy production)
app.use(cors({ origin: '*' }));
app.use(express.json());

const DAA_BASE = 'https://api.daathena.com/api/v2';

// ─── Health check ────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'DAA Proxy running', daa_base: DAA_BASE });
});

// ─── Proxy endpoint chính ────────────────────────────────────────────

app.post('/proxy', async (req, res) => {
  const { path, params = {}, apiKey } = req.body;

  if (!path) {
    return res.status(400).json({ error: true, message: 'Thiếu field "path"' });
  }

  // Build URL
  const url = new URL(DAA_BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  // Headers gửi đến DAA
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = apiKey;

  try {
    const response = await fetch(url.toString(), { headers });
    const data = await response.json();

    // Forward status code + body
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// ─── Proxy cho POST requests (create order, cancel order...) ─────────

app.post('/proxy-post', async (req, res) => {
  const { path, body = {}, apiKey } = req.body;

  if (!path) return res.status(400).json({ error: true, message: 'Thiếu field "path"' });

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = apiKey;

  try {
    const response = await fetch(DAA_BASE + path, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 DAA Proxy đang chạy tại http://localhost:${PORT}`);
  console.log(`   Test: curl http://localhost:${PORT}/`);
  console.log(`\n   Trong ScamShield, đổi DAA_BASE thành:`);
  console.log(`   const DAA_BASE = 'http://localhost:${PORT}/proxy';\n`);
});