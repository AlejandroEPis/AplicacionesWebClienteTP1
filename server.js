const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

app.all("/proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("Falta el parámetro 'url'");

  try {
    const options = {
      method: req.method,
      headers: {
        Authorization: req.headers.authorization || "",
        "Content-Type": "application/json",
      },
    };


    if (req.method !== "GET" && req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const text = await response.text();

    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.listen(8080, () => {
  console.log("✅ Proxy local activo en http://localhost:8080");
});
