/*Conexión con la base de datos Airtable*/
import { API_TOKEN, BASE_ID } from "./environment.js";
import { TABLE_CCVENTAS, TABLE_CLIENTES } from "./config.js";

/*URLs para acceder a las tablas de ventas y clientes*/
const urlVentas = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_CCVENTAS}`;
const urlClientes = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_CLIENTES}`;

/*Elementos del DOM*/
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

/*Arrays donde se guardan los datos de clientes y ventas*/
let clientes = [];
let ventas = [];

/*Carga todos los clientes desde Airtable*/
async function traerClientes() {
  const res = await fetch(urlClientes, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  clientes = data.records.map((r) => ({ id: r.id, ...r.fields }));
}

/*Carga todas las ventas desde Airtable*/
async function traerVentas() {
  const res = await fetch(`${urlVentas}?sort[0][field]=Fecha&sort[0][direction]=asc`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  ventas = data.records.map((r) => ({ id: r.id, ...r.fields }));
}

/*Guarda una nueva venta o actualiza una existente*/
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

/*Elimina una venta de Airtable*/
async function eliminarVenta(id) {
  await fetch(`${urlVentas}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
}

/*Muestra un mensaje visual en pantalla*/
function mostrarMensaje(texto, color = "green", tiempo = 2000) {
  const noti = document.getElementById("noti");
  if (!noti) return;
  noti.textContent = texto;
  noti.style.background = color;
  noti.classList.add("visible");
  setTimeout(() => noti.classList.remove("visible"), tiempo);
}

/*Busca un cliente por nombre*/
function buscarCliente(texto) {
  const t = texto.toLowerCase();
  return clientes.find((c) => (c.Nombre || "").toLowerCase().includes(t)) || null;
}

/*Filtra las ventas del cliente seleccionado*/
function ventasDeCliente(nombre) {
  return ventas.filter((v) => v.Cliente === nombre);
}

/*Crea una fila editable para cargar o modificar una venta*/
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

/*Muestra todas las ventas del cliente en la tabla*/
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

/*Muestra los datos del cliente y sus ventas*/
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

/*Activa el buscador de clientes*/
buscadorInput.addEventListener("input", () => {
  const texto = buscadorInput.value.trim();
  if (texto.length > 2) {
    const cliente = buscarCliente(texto);
    mostrarCliente(cliente);
  } else {
    mostrarCliente(null);
  }
});

/*Muestra un modal de confirmación y devuelve una promesa*/
function confirmarAccion(mensaje = "¿Seguro?") {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const text = document.getElementById("confirmText");
    const yes = document.getElementById("confirmYes");
    const no = document.getElementById("confirmNo");

    text.textContent = mensaje;
    modal.style.display = "flex";

    const cerrar = (respuesta) => {
      modal.style.display = "none";
      yes.removeEventListener("click", onYes);
      no.removeEventListener("click", onNo);
      resolve(respuesta);
    };

    const onYes = () => cerrar(true);
    const onNo = () => cerrar(false);

    yes.addEventListener("click", onYes);
    no.addEventListener("click", onNo);
  });
}

/*Maneja las acciones de los botones dentro de la tabla*/
cuerpoCC.addEventListener("click", async (e) => {
  const fila = e.target.closest("tr");
  if (!fila) return;
  const id = fila.dataset.id;
  const nombreCliente = campos.nombre.textContent.trim() || buscadorInput.value.trim();

  /*Guardar venta nueva o modificada*/
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

  /*Activa la edición de una venta existente*/
  if (e.target.classList.contains("bMod")) {
    const v = ventas.find((x) => x.id === id);
    if (!v) return;
    fila.outerHTML = filaEditableHTML(v);
  }


  /*Elimina una venta del registro*/
  if (e.target.classList.contains("bEli")) {
    if (!(await confirmarAccion("¿Eliminar esta venta?"))) return;
    await eliminarVenta(id);
    await traerVentas();
    mostrarVentas(ventasDeCliente(nombreCliente), true);
    mostrarMensaje("Venta eliminada correctamente");
  }
});

/*Carga inicial de datos al abrir la página*/
window.addEventListener("DOMContentLoaded", async () => {
  await traerClientes();
  await traerVentas();
  mostrarVentas([], false);
});
document.querySelectorAll("table").forEach((tabla, i) => {
  tabla.style.opacity = "0";
  tabla.style.transform = "translateY(20px)";
  tabla.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  setTimeout(() => {
    tabla.style.opacity = "1";
    tabla.style.transform = "translateY(0)";
  }, 200 + i * 200);
});