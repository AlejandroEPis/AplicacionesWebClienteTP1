const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

app.get("/proxy", async (req, res) => {
  const { url } = req.query;
  const response = await fetch(url, {
    headers: {
      Authorization: req.headers.authorization || "",
      "Content-Type": "application/json",
    },
  });
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    res.json(data);
  } catch {
    res.status(response.status).send(text);
  }
});

app.post("/proxy", async (req, res) => {
  const { url } = req.query;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: req.headers.authorization || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    res.json(data);
  } catch {
    res.status(response.status).send(text);
  }
});

app.listen(8080, () => {
  console.log("✅ Proxy local activo en http://localhost:8080");
});
