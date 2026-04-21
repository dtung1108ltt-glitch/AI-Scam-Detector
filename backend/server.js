const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();

const PORT = Number(process.env.PORT || 3001);
const DAA_BASE_URL = process.env.DAA_BASE_URL || "https://api.daathena.com/api/v2";
const DAA_API_KEY = process.env.DAA_API_KEY || "";

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "DAA proxy running", port: PORT });
});

app.get("/api/daa", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "DAA proxy route is available. Use POST /api/daa with path/params.",
  });
});

app.post("/api/daa", async (req, res) => {
  const { path = "", params = {}, apiKey = "" } = req.body || {};
  const safePath = typeof path === "string" ? path.trim() : "";
  const finalKey = apiKey || DAA_API_KEY;

  if (!safePath.startsWith("/")) {
    return res.status(400).json({ error: true, message: "Invalid path. Must start with '/'." });
  }
  if (!finalKey && !safePath.startsWith("/public/")) {
    return res.status(400).json({ error: true, message: "Missing DAA API key." });
  }

  try {
    const url = new URL(DAA_BASE_URL + safePath);
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    });
    const isPublicEndpoint = safePath.startsWith("/public/");
    const headers = {};
    if (!isPublicEndpoint) {
      headers.Authorization = finalKey.startsWith("Bearer ") ? finalKey : `Bearer ${finalKey}`;
      headers["x-api-token"] = finalKey;
      headers["x-api-key"] = finalKey;
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_e) {
      data = { raw: text };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: true,
        message:
          data?.message ||
          data?.error_message ||
          data?.error ||
          `DAA API HTTP ${response.status}`,
        error_code: data?.error_code || data?.code || null,
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: true,
      message: err.message || "Proxy server error",
    });
  }
});

app.listen(PORT, () => console.log(`DAA proxy running at http://localhost:${PORT}`));