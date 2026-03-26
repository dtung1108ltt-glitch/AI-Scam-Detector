const express = require("express");
const path = require("path");

const app = express();

// serve file tĩnh (HTML)
app.use(express.static(__dirname));

app.listen(3000, () => {
  console.log("Frontend running at http://localhost:3000");
});