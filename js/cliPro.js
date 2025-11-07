import { BASE_ID, API_TOKEN } from "./environment.js";
import { TABLE_CLIENTES, TABLE_PROVEEDORES } from "./config.js";

const proxy = "http://localhost:8080/proxy?url=";
const urlClientes = `${proxy}${encodeURIComponent(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_CLIENTES}`)}`;
const urlProveedores = `${proxy}${encodeURIComponent(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_PROVEEDORES}`)}`;

let clientes = [];
let proveedores = [];

async function enviarAlBackend(tabla, data) {
  const url = tabla === "Clientes" ? urlClientes : urlProveedores;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sincronizarDesdeBackend(tabla) {
  const url = tabla === "Clientes" ? urlClientes : urlProveedores;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${API_TOKEN}` } });
    const data = await res.json();
    if (tabla === "Clientes") {
      clientes = data.records.map((r) => ({
        id: r.id,
        Nombre: r.fields.Nombre || "",
        CUIT: r.fields.CUIT || "",
        CondicionIVA: r.fields.CondicionIVA || "",
        Domicilio: r.fields.Domicilio || "",
        Telefono: r.fields.Telefono || "",
        Mail: r.fields.Mail || "",
      }));
    } else {
      proveedores = data.records.map((r) => ({
        id: r.id,
        RazonSocial: r.fields.RazonSocial || "",
        CUIT: r.fields.CUIT || "",
        CondicionIVA: r.fields.CondicionIVA || "",
        Domicilio: r.fields.Domicilio || "",
        Telefono: r.fields.Telefono || "",
        Mail: r.fields.Mail || "",
      }));
    }
  } catch {}
}

const formCliente = document.querySelector(".taClPr");
formCliente.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nuevoCliente = {
    Nombre: document.getElementById("nfan").value,
    CUIT: document.getElementById("cuit").value,
    CondicionIVA: document.getElementById("cIVA").value,
    Domicilio: document.getElementById("dcom").value,
    Telefono: document.getElementById("tel").value,
    Mail: document.getElementById("mail").value,
  };
  const ok = await enviarAlBackend("Clientes", nuevoCliente);
  if (ok) await sincronizarDesdeBackend("Clientes");
  formCliente.reset();
});

const formProveedor = document.querySelector(".taClPro");
formProveedor.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nuevoProveedor = {
    RazonSocial: document.getElementById("rsoper").value,
    CUIT: document.querySelector(".taClPro #cuit").value,
    CondicionIVA: document.querySelector(".taClPro #cIVA").value,
    Domicilio: document.querySelector(".taClPro #dcom").value,
    Telefono: document.querySelector(".taClPro #tel").value,
    Mail: document.querySelector(".taClPro #mail").value,
  };
  const ok = await enviarAlBackend("Proveedores", nuevoProveedor);
  if (ok) await sincronizarDesdeBackend("Proveedores");
  formProveedor.reset();
});

(async function init() {
  await sincronizarDesdeBackend("Clientes");
  await sincronizarDesdeBackend("Proveedores");
})();
