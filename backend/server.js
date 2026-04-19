const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/api/daa", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.daathena.com/api/v2/public/wallet/currencies?page=1&per_page=100",
      {
        headers: {
          "x-api-key": "YOUR_API_KEY",
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("Server chạy 3001"));