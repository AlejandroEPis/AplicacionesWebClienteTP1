/*Importaciones*/
import { API_TOKEN, BASE_ID } from "./environment.js";
import { TABLE_CCCOMPRAS, TABLE_PROVEEDORES } from "./config.js";

/*URL para acceder a la tabla de compras en Airtable*/
const urlCompras = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_CCCOMPRAS}`;
const urlProveedores = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_PROVEEDORES}`;

/*Elementos principales del DOM*/
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

/*Arrays donde se guardan los datos de Airtable*/
let proveedores = [];
let compras = [];

/*Carga los proveedores desde Airtable*/
async function traerProveedores() {
  const res = await fetch(urlProveedores, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  proveedores = data.records.map((r) => ({ id: r.id, ...r.fields }));
}

/*Carga los compras desde Airtable*/
async function traerCompras() {
  const res = await fetch(`${urlCompras}?sort[0][field]=Fecha&sort[0][direction]=asc`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  compras = data.records.map((r) => ({ id: r.id, ...r.fields }));
}

/*Guarda una compra nueva o modifica una existente*/
async function guardarCompra(data, id = null) {
  const metodo = id ? "PATCH" : "POST";
  const url = id ? `${urlCompras}/${id}` : urlCompras;
  await fetch(url, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: data }),
  });
}

/*Elimina una compra del servidor Airtable*/
async function eliminarCompra(id) {
  await fetch(`${urlCompras}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
}

/*Muestra un mensaje visual de confirmación*/
function mostrarMensaje(texto, color = "green", tiempo = 2000) {
  const noti = document.getElementById("noti");
  if (!noti) return;
  noti.textContent = texto;
  noti.style.background = color;
  noti.classList.add("visible");
  setTimeout(() => noti.classList.remove("visible"), tiempo);
}

/*Busca un proveedor por nombre*/
function buscarProveedor(texto) {
  const t = texto.toLowerCase();
  return proveedores.find((p) => (p.RazonSocial || "").toLowerCase().includes(t)) || null;
}

/*Filtra las compras del proveedor seleccionado*/
function comprasDeProveedor(nombre) {
  return compras.filter((c) => c.Proveedor === nombre);
}

/*Crea el HTML de una fila editable en la tabla*/
function filaEditableHTML(c = {}) {
  return `
    <tr data-id="${c.id || ""}">
      <td><input type="date" name="fec" value="${c.Fecha || ""}"></td>
      <td><input type="text" name="factura" value="${c.Factura || ""}"></td>
      <td>
        <select name="tpago">
          <option value="">Seleccione</option>
          <option value="efectivo" ${c.TipoPago === "efectivo" ? "selected" : ""}>Efectivo</option>
          <option value="debito" ${c.TipoPago === "debito" ? "selected" : ""}>Débito</option>
          <option value="credito" ${c.TipoPago === "credito" ? "selected" : ""}>Crédito</option>
          <option value="transferencia" ${c.TipoPago === "transferencia" ? "selected" : ""}>Transferencia</option>
        </select>
      </td>
      <td><input type="number" name="debe" value="${c.Ingreso || 0}"></td>
      <td><input type="number" name="pago" value="${c.Egreso || 0}"></td>
      <td>${c.Saldo ? c.Saldo.toFixed(2) : ""}</td>
      <td class="bot"><button class="bGua" type="button">Guardar</button></td>
    </tr>
  `;
}

/*Muestra todas las compras del provedor en la tabla*/
function mostrarCompras(lista, editable = true) {
  cuerpoCC.innerHTML = "";
  let saldo = 0;
  if (!lista || lista.length === 0) {
    if (editable) cuerpoCC.innerHTML = filaEditableHTML();
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
  if (editable) cuerpoCC.insertAdjacentHTML("beforeend", filaEditableHTML());
}

/*Muestra los datos del proveedor en pantalla*/
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

  const lista = comprasDeProveedor(proveedor.RazonSocial);
  mostrarCompras(lista, true);
}

/*Activa el buscador por nombre del proveedor*/
buscadorInput.addEventListener("input", () => {
  const texto = buscadorInput.value.trim();
  if (texto.length > 2) {
    const proveedor = buscarProveedor(texto);
    mostrarProveedor(proveedor);
  } else {
    mostrarProveedor(null);
  }
});

  /*Maneja las acciones de los botones dentro de la tabla*/
cuerpoCC.addEventListener("click", async (e) => {
  const fila = e.target.closest("tr");
  if (!fila) return;
  const id = fila.dataset.id;
  const nombreProveedor = campos.nombre.textContent.trim() || buscadorInput.value.trim();

/*Guardar compra nueva o editada*/
  if (e.target.classList.contains("bGua")) {
    const datos = {
      Fecha: fila.querySelector('[name="fec"]').value,
      Factura: fila.querySelector('[name="factura"]').value,
      TipoPago: fila.querySelector('[name="tpago"]').value,
      Ingreso: Number(fila.querySelector('[name="debe"]').value),
      Egreso: Number(fila.querySelector('[name="pago"]').value),
      Proveedor: nombreProveedor,
    };
    if (!datos.Fecha) return;
    await guardarCompra(datos, id || null);
    await traerCompras();
    mostrarCompras(comprasDeProveedor(nombreProveedor), true);
    mostrarMensaje("Compra guardada correctamente");
  }

  /*Modificar una compra existente*/
  if (e.target.classList.contains("bMod")) {
    const c = compras.find((x) => x.id === id);
    if (!c) return;
    fila.outerHTML = filaEditableHTML(c);
  }

  /*Eliminar una compra existente*/
  if (e.target.classList.contains("bEli")) {
    if (!confirm("¿Eliminar esta compra?")) return;
    await eliminarCompra(id);
    await traerCompras();
    mostrarCompras(comprasDeProveedor(nombreProveedor), true);
    mostrarMensaje("Compra eliminada correctamente");
  }
});

/*Carga inicial de datos al abrir la página*/
window.addEventListener("DOMContentLoaded", async () => {
  await traerProveedores();
  await traerCompras();
  mostrarCompras([], false);
});

/*Aplica animación de entrada a la tabla*/
document.querySelectorAll("table").forEach((tabla, i) => {
  tabla.style.opacity = "0";
  tabla.style.transform = "translateY(20px)";
  tabla.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  setTimeout(() => {
    tabla.style.opacity = "1";
    tabla.style.transform = "translateY(0)";
  }, 200 + i * 200);
});