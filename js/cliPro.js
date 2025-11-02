import { BASE_ID, API_TOKEN } from "./environment.js";
import { TABLE_CLIENTES, TABLE_PROVEEDORES } from "./config.js";

const proxy = "http://localhost:8080/proxy?url=";
const urlClientes = `${proxy}${encodeURIComponent(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_CLIENTES}`)}`;
const urlProveedores = `${proxy}${encodeURIComponent(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_PROVEEDORES}`)}`;

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
let proveedores = JSON.parse(localStorage.getItem("proveedores")) || [];

function guardarLocal() {
  localStorage.setItem("clientes", JSON.stringify(clientes));
  localStorage.setItem("proveedores", JSON.stringify(proveedores));
}

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
        Nombre: r.fields.Nombre,
        CUIT: r.fields.CUIT,
        CondicionIVA: r.fields.CondicionIVA,
        Domicilio: r.fields.Domicilio,
        Telefono: r.fields.Telefono,
        Mail: r.fields.Mail,
      }));
    } else {
      proveedores = data.records.map((r) => ({
        id: r.id,
        RazonSocial: r.fields.RazonSocial,
        CUIT: r.fields.CUIT,
        CondicionIVA: r.fields.CondicionIVA,
        Domicilio: r.fields.Domicilio,
        Telefono: r.fields.Telefono,
        Mail: r.fields.Mail,
      }));
    }
    guardarLocal();
  } catch {}
}

const formCliente = document.querySelector(".taClPr");
formCliente.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nfan").value;
  const cuit = document.getElementById("cuit").value;
  const cIVA = document.getElementById("cIVA").value;
  const dcom = document.getElementById("dcom").value;
  const tel = document.getElementById("tel").value;
  const mail = document.getElementById("mail").value;
  const nuevoCliente = { Nombre: nombre, CUIT: cuit, CondicionIVA: cIVA, Domicilio: dcom, Telefono: tel, Mail: mail };
  const ok = await enviarAlBackend("Clientes", nuevoCliente);
  if (ok) await sincronizarDesdeBackend("Clientes");
  else {
    nuevoCliente.id = Date.now().toString();
    clientes.push(nuevoCliente);
    guardarLocal();
  }
  formCliente.reset();
});

const formProveedor = document.querySelector(".taClPro");
formProveedor.addEventListener("submit", async (e) => {
  e.preventDefault();
  const razonSocial = document.getElementById("rsoper").value;
  const cuit = document.querySelector(".taClPro #cuit").value;
  const cIVA = document.querySelector(".taClPro #cIVA").value;
  const dcom = document.querySelector(".taClPro #dcom").value;
  const tel = document.querySelector(".taClPro #tel").value;
  const mail = document.querySelector(".taClPro #mail").value;
  const nuevoProveedor = { RazonSocial: razonSocial, CUIT: cuit, CondicionIVA: cIVA, Domicilio: dcom, Telefono: tel, Mail: mail };
  const ok = await enviarAlBackend("Proveedores", nuevoProveedor);
  if (ok) await sincronizarDesdeBackend("Proveedores");
  else {
    nuevoProveedor.id = Date.now().toString();
    proveedores.push(nuevoProveedor);
    guardarLocal();
  }
  formProveedor.reset();
});

(async function init() {
  await sincronizarDesdeBackend("Clientes");
  await sincronizarDesdeBackend("Proveedores");
})();
