const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());

app.get("/proxy", async (req, res) => {
  const { url } = req.query;

  try {
    // Pedir a Airtable correctamente con cabecera de autorización
    const response = await fetch(url, {
      headers: {
        Authorization: req.headers.authorization || "",
        "Content-Type": "application/json"
      }
    });

    // Obtener el contenido como texto
    const text = await response.text();

    // Si la respuesta es JSON válido, la enviamos así
    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch {
      // Si no es JSON (por ejemplo, error de Airtable), la devolvemos como texto
      console.error("⚠️ Respuesta de Airtable no es JSON:", text);
      res.status(response.status).send(text);
    }
  } catch (err) {
    console.error("❌ Error en el proxy:", err);
    res.status(500).send("Error al conectar con Airtable");
  }
});

app.listen(8080, () => {
  console.log("✅ Proxy local activo en http://localhost:8080");
});
