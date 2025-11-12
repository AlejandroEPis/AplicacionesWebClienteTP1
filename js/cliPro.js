/*Importaciones*/
import { BASE_ID, API_TOKEN } from "./environment.js";
import { TABLE_CLIENTES, TABLE_PROVEEDORES } from "./config.js";

/*URL para acceder a la tabla de Caja en Airtable*/
const urlClientes = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_CLIENTES}`;
const urlProveedores = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_PROVEEDORES}`;

/*Array donde se guardan todos los datos*/
let clientes = [];
let proveedores = [];

/*Envía los datos de un cliente o proveedor a Airtable*/
async function enviarAlBackend(tabla, data) {
  const url = tabla === "Clientes" ? urlClientes : urlProveedores;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: data }),
  });
  return res.ok;
}

/*Sincroniza los datos desde Airtable hacia la web*/
async function sincronizarDesdeBackend(tabla) {
  const url = tabla === "Clientes" ? urlClientes : urlProveedores;
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
}

/*Formulario nuevo cliente*/
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
  if (ok) {
    await sincronizarDesdeBackend("Clientes");
    mostrarMensaje("Cliente guardado correctamente", "green");
  }
  formCliente.reset();
});

/*Formulario nuevo provedor*/
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
  if (ok) {
    await sincronizarDesdeBackend("Proveedores");
    mostrarMensaje("Proveedor guardado correctamente", "green");
  }
  formProveedor.reset();
});

/*Confirmacion accion*/
function mostrarMensaje(texto, color = "green", tiempo = 2000) {
  const noti = document.getElementById("noti");
  if (!noti) return;
  noti.textContent = texto;
  noti.style.background = color;
  noti.classList.add("visible");
  setTimeout(() => noti.classList.remove("visible"), tiempo);
}

/*Animacion*/
document.querySelectorAll("table").forEach((tabla, i) => {
  tabla.style.opacity = "0";
  tabla.style.transform = "translateY(20px)";
  tabla.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  setTimeout(() => {
    tabla.style.opacity = "1";
    tabla.style.transform = "translateY(0)";
  }, 200 + i * 200);
});