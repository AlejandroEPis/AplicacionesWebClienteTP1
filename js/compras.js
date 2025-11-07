import { BASE_ID, API_TOKEN } from "./environment.js";
import { TABLE_CCCOMPRAS, TABLE_PROVEEDORES } from "./config.js";

const proxy = "http://127.0.0.1:8080/proxy?url=";
const urlCompras = `${proxy}${encodeURIComponent(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_CCCOMPRAS}`)}`;
const urlProveedores = `${proxy}${encodeURIComponent(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_PROVEEDORES}`)}`;

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

let proveedores = [];
let compras = [];

async function traerProveedores() {
  const res = await fetch(urlProveedores, { headers: { Authorization: `Bearer ${API_TOKEN}` } });
  const data = await res.json();
  proveedores = data.records.map((r) => ({ id: r.id, ...r.fields }));
}

async function traerCompras() {
  const res = await fetch(`${urlCompras}?sort[0][field]=Fecha&sort[0][direction]=asc`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  compras = data.records.map((r) => ({ id: r.id, ...r.fields }));
}

async function enviarCompraAlBackend(data, id = null) {
  const metodo = id ? "PATCH" : "POST";
  const url = id ? `${urlCompras}/${id}` : urlCompras;
  const res = await fetch(url, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: data }),
  });
  return res.ok;
}

async function eliminarCompraDelBackend(id) {
  const res = await fetch(`${urlCompras}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  return res.ok;
}

function buscarProveedor(texto) {
  const t = texto.toLowerCase();
  return proveedores.find((p) => (p.RazonSocial || "").toLowerCase().includes(t)) || null;
}

function getComprasPorProveedor(nombreProveedor) {
  return compras.filter((c) => c.Proveedor === nombreProveedor);
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
      <td class="bot">
        <button class="bGua" type="button">Guardar</button>
      </td>
    </tr>
  `;
}

function mostrarCompras(lista, habilitarEdicion = true) {
  cuerpoCC.innerHTML = "";
  let saldo = 0;
  if (!lista || lista.length === 0) {
    if (habilitarEdicion) {
      cuerpoCC.innerHTML = filaEditableHTML();
    }
    return;
  }
  lista.forEach((c) => {
    saldo += (Number(c.Ingreso) || 0) - (Number(c.Egreso) || 0);
    c.Saldo = saldo;
    cuerpoCC.insertAdjacentHTML(
      "beforeend",
      `
      <tr data-id="${c.id}">
        <td>${c.Fecha || ""}</td>
        <td>${c.Factura || ""}</td>
        <td>${c.TipoPago || ""}</td>
        <td>${c.Ingreso?.toFixed(2) || "0.00"}</td>
        <td>${c.Egreso?.toFixed(2) || "0.00"}</td>
        <td>${saldo.toFixed(2)}</td>
        <td class="bot">
          <button class="bMod" type="button">Modificar</button>
          <button class="bEli" type="button">Eliminar</button>
        </td>
      </tr>`
    );
  });
  if (habilitarEdicion) cuerpoCC.insertAdjacentHTML("beforeend", filaEditableHTML());
}

function mostrarProveedor(proveedor) {
  if (!proveedor) {
    Object.values(campos).forEach((c) => (c.textContent = ""));
    mostrarCompras([], false);
    return;
  }

  campos.nombre.textContent = proveedor.RazonSocial || "";
  campos.cuit.textContent = proveedor.CUIT || "";
  campos.iva.textContent = proveedor.CondicionIVA || "";
  campos.domicilio.textContent = proveedor.Domicilio || "";
  campos.telefono.textContent = proveedor.Telefono || "";
  campos.mail.textContent = proveedor.Mail || "";

  const comprasProveedor = getComprasPorProveedor(proveedor.RazonSocial);
  mostrarCompras(comprasProveedor, true);
}

buscadorInput.addEventListener("input", () => {
  const texto = buscadorInput.value.trim();
  if (texto.length > 2) {
    const proveedor = buscarProveedor(texto);
    mostrarProveedor(proveedor);
  } else {
    mostrarProveedor(null);
  }
});

cuerpoCC.addEventListener("click", async (e) => {
  const fila = e.target.closest("tr");
  if (!fila) return;
  const idFila = fila.dataset.id;
  const proveedorNombre = campos.nombre.textContent.trim() || buscadorInput.value.trim();

  if (e.target.classList.contains("bGua")) {
    if (!proveedorNombre) {
      alert("Primero debe seleccionar o buscar un proveedor antes de guardar.");
      return;
    }
    const datos = {
      Fecha: fila.querySelector('[name="fec"]').value,
      Factura: fila.querySelector('[name="factura"]').value,
      TipoPago: fila.querySelector('[name="tpago"]').value,
      Ingreso: Number(fila.querySelector('[name="debe"]').value),
      Egreso: Number(fila.querySelector('[name="pago"]').value),
      Proveedor: proveedorNombre,
    };
    if (!datos.Fecha) return;
    await enviarCompraAlBackend(datos, idFila || null);
    await traerCompras();
    mostrarCompras(getComprasPorProveedor(proveedorNombre), true);
  }

  if (e.target.classList.contains("bMod")) {
    const c = compras.find((x) => x.id === idFila);
    if (!c) return;
    fila.outerHTML = filaEditableHTML(c);
  }

  if (e.target.classList.contains("bEli")) {
    if (!confirm("¿Eliminar esta compra?")) return;
    await eliminarCompraDelBackend(idFila);
    await traerCompras();
    mostrarCompras(getComprasPorProveedor(proveedorNombre), true);
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  await traerProveedores();
  await traerCompras();
  mostrarCompras([], false);
});
