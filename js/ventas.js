import { API_TOKEN, BASE_ID } from "./environment.js";
import { TABLE_CCVENTAS, TABLE_CLIENTES } from "./config.js";

const urlVentas = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_CCVENTAS}`;
const urlClientes = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_CLIENTES}`;

const buscadorInput = document.querySelector("#q");

const campos = {
  nombre: document.querySelector(".cli-nombre"),
  cuit: document.querySelector(".cli-cuit"),
  iva: document.querySelector(".cli-iva"),
  domicilio: document.querySelector(".cli-dom"),
  telefono: document.querySelector(".cli-tel"),
  mail: document.querySelector(".cli-mail"),
};

const cuerpoCC = document.querySelector(".ccBody");

let clientes = [];
let ventas = [];

async function traerClientes() {
  const res = await fetch(urlClientes, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  clientes = data.records.map((r) => ({ id: r.id, ...r.fields }));
}

async function traerVentas() {
  const res = await fetch(`${urlVentas}?sort[0][field]=Fecha&sort[0][direction]=asc`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  ventas = data.records.map((r) => ({ id: r.id, ...r.fields }));
}

async function guardarVenta(data, id = null) {
  const metodo = id ? "PATCH" : "POST";
  const url = id ? `${urlVentas}/${id}` : urlVentas;
  await fetch(url, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: data }),
  });
}

async function eliminarVenta(id) {
  await fetch(`${urlVentas}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
}

function mostrarMensaje(texto, color = "green", tiempo = 2000) {
  const noti = document.getElementById("noti");
  if (!noti) return;
  noti.textContent = texto;
  noti.style.background = color;
  noti.classList.add("visible");
  setTimeout(() => noti.classList.remove("visible"), tiempo);
}

function buscarCliente(texto) {
  const t = texto.toLowerCase();
  return clientes.find((c) => (c.Nombre || "").toLowerCase().includes(t)) || null;
}

function ventasDeCliente(nombre) {
  return ventas.filter((v) => v.Cliente === nombre);
}

function filaEditableHTML(v = {}) {
  return `
    <tr data-id="${v.id || ""}">
      <td><input type="date" name="fec" value="${v.Fecha || ""}"></td>
      <td><input type="text" name="factura" value="${v.Factura || ""}"></td>
      <td>
        <select name="tpago">
          <option value="">Seleccione</option>
          <option value="efectivo" ${v.TipoPago === "efectivo" ? "selected" : ""}>Efectivo</option>
          <option value="debito" ${v.TipoPago === "debito" ? "selected" : ""}>Débito</option>
          <option value="credito" ${v.TipoPago === "credito" ? "selected" : ""}>Crédito</option>
          <option value="transferencia" ${v.TipoPago === "transferencia" ? "selected" : ""}>Transferencia</option>
        </select>
      </td>
      <td><input type="number" name="debe" value="${v.Ingreso || 0}"></td>
      <td><input type="number" name="pago" value="${v.Egreso || 0}"></td>
      <td>${v.Saldo ? v.Saldo.toFixed(2) : ""}</td>
      <td class="bot"><button class="bGua" type="button">Guardar</button></td>
    </tr>
  `;
}

function mostrarVentas(lista, editable = true) {
  cuerpoCC.innerHTML = "";
  let saldo = 0;
  if (!lista || lista.length === 0) {
    if (editable) cuerpoCC.innerHTML = filaEditableHTML();
    return;
  }
  lista.forEach((v) => {
    saldo += (Number(v.Ingreso) || 0) - (Number(v.Egreso) || 0);
    v.Saldo = saldo;
    cuerpoCC.insertAdjacentHTML(
      "beforeend",
      `
      <tr data-id="${v.id}">
        <td>${v.Fecha || ""}</td>
        <td>${v.Factura || ""}</td>
        <td>${v.TipoPago || ""}</td>
        <td>${v.Ingreso?.toFixed(2) || "0.00"}</td>
        <td>${v.Egreso?.toFixed(2) || "0.00"}</td>
        <td>${saldo.toFixed(2)}</td>
        <td class="bot">
          <button class="bMod" type="button">Modificar</button>
          <button class="bEli" type="button">Eliminar</button>
        </td>
      </tr>`
    );
  });
  if (editable) cuerpoCC.insertAdjacentHTML("beforeend", filaEditableHTML());
}

function mostrarCliente(cliente) {
  if (!cliente) {
    Object.values(campos).forEach((c) => (c.textContent = ""));
    mostrarVentas([], false);
    return;
  }
  campos.nombre.textContent = cliente.Nombre || "";
  campos.cuit.textContent = cliente.CUIT || "";
  campos.iva.textContent = cliente.CondicionIVA || "";
  campos.domicilio.textContent = cliente.Domicilio || "";
  campos.telefono.textContent = cliente.Telefono || "";
  campos.mail.textContent = cliente.Mail || "";
  const lista = ventasDeCliente(cliente.Nombre);
  mostrarVentas(lista, true);
}

buscadorInput.addEventListener("input", () => {
  const texto = buscadorInput.value.trim();
  if (texto.length > 2) {
    const cliente = buscarCliente(texto);
    mostrarCliente(cliente);
  } else {
    mostrarCliente(null);
  }
});

cuerpoCC.addEventListener("click", async (e) => {
  const fila = e.target.closest("tr");
  if (!fila) return;
  const id = fila.dataset.id;
  const nombreCliente = campos.nombre.textContent.trim() || buscadorInput.value.trim();

  if (e.target.classList.contains("bGua")) {
    const datos = {
      Fecha: fila.querySelector('[name="fec"]').value,
      Factura: fila.querySelector('[name="factura"]').value,
      TipoPago: fila.querySelector('[name="tpago"]').value,
      Ingreso: Number(fila.querySelector('[name="debe"]').value),
      Egreso: Number(fila.querySelector('[name="pago"]').value),
      Cliente: nombreCliente,
    };
    if (!datos.Fecha) return;
    await guardarVenta(datos, id || null);
    await traerVentas();
    mostrarVentas(ventasDeCliente(nombreCliente), true);
    mostrarMensaje("Venta guardada correctamente");
  }

  if (e.target.classList.contains("bMod")) {
    const v = ventas.find((x) => x.id === id);
    if (!v) return;
    fila.outerHTML = filaEditableHTML(v);
  }

  if (e.target.classList.contains("bEli")) {
    if (!confirm("¿Eliminar esta venta?")) return;
    await eliminarVenta(id);
    await traerVentas();
    mostrarVentas(ventasDeCliente(nombreCliente), true);
    mostrarMensaje("Venta eliminada correctamente");
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  await traerClientes();
  await traerVentas();
  mostrarVentas([], false);
});
