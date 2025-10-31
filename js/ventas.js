/*Buscado de clientes y cuenta corriente*/
import { BASE_ID, API_TOKEN } from "./environment.js";
import { TABLE_CLIENTES, TABLE_CCVENTAS } from "./config.js";

const proxy = "https://cors-anywhere.herokuapp.com/";
const urlClientes = `${proxy}https://api.airtable.com/v0/${BASE_ID}/${TABLE_CLIENTES}`;
const urlVentas = `${proxy}https://api.airtable.com/v0/${BASE_ID}/${TABLE_CCVENTAS}`;

const buscadorInput = document.querySelector("#q");
const botonBuscar = document.querySelector(".lupa");

const campos = {
  nombre: document.querySelector(".cli-nombre"),
  cuit: document.querySelector(".cli-cuit"),
  iva: document.querySelector(".cli-iva"),
  domicilio: document.querySelector(".cli-dom"),
  telefono: document.querySelector(".cli-tel"),
  mail: document.querySelector(".cli-mail"),
};

const cuerpoCC = document.querySelector(".ccBody");

async function buscarCliente(texto) {
  const filtro = `OR(
    FIND(LOWER("${texto}"), LOWER({Nombre})),
    FIND(LOWER("${texto}"), LOWER({CUIT})),
    FIND(LOWER("${texto}"), LOWER({Mail}))
  )`;
  const res = await fetch(`${urlClientes}?filterByFormula=${encodeURIComponent(filtro)}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  return data.records.length > 0 ? data.records[0].fields : null;
}

async function getVentasPorCliente(nombreCliente) {
  const filtro = `FIND(LOWER("${nombreCliente}"), LOWER({Cliente}))`;
  const res = await fetch(`${urlVentas}?filterByFormula=${encodeURIComponent(filtro)}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  return data.records.map((r) => r.fields);
}

function filaEditableHTML() {
  return `
    <tr>
      <td><input type="date" name="fec"></td>
      <td><input type="text" name="factura"></td>
      <td>
        <select name="tpago">
          <option value="">Seleccione</option>
          <option value="efectivo">Efectivo</option>
          <option value="debito">Débito</option>
          <option value="credito">Crédito</option>
          <option value="transferencia">Transferencia</option>
        </select>
      </td>
      <td><input type="number" name="debe"></td>
      <td><input type="number" name="pago"></td>
      <td><input type="number" name="saldo"></td>
      <td class="bot">
        <button class="bGua" type="submit">Guardar</button>
        <button class="bMod" type="submit">Modificar</button>
        <button class="bEli" type="submit">Eliminar</button>
      </td>
    </tr>
  `;
}

function filaConDatosHTML(v, saldo) {
  return `
    <tr>
      <td>${v.Fecha || ""}</td>
      <td>${v.Factura || ""}</td>
      <td>${v.TipoPago || ""}</td>
      <td>${v.Debe || 0}</td>
      <td>${v.Pago || 0}</td>
      <td>${saldo}</td>
      <td class="bot">
        <button class="bMod" type="button">Modificar</button>
        <button class="bEli" type="button">Eliminar</button>
      </td>
    </tr>
  `;
}

function mostrarVentas(lista) {
  cuerpoCC.innerHTML = "";
  if (!lista || lista.length === 0) {
    cuerpoCC.innerHTML = filaEditableHTML();
    return;
  }
  let saldoAcumulado = 0;
  lista.forEach((v) => {
    const debe = Number(v.Debe) || 0;
    const pago = Number(v.Pago) || 0;
    saldoAcumulado += debe - pago;
    cuerpoCC.insertAdjacentHTML("beforeend", filaConDatosHTML(v, saldoAcumulado));
  });
  cuerpoCC.insertAdjacentHTML("beforeend", filaEditableHTML());
}

async function mostrarCliente(cliente) {
  if (!cliente) {
    Object.values(campos).forEach((c) => (c.textContent = ""));
    alert("No se encontró ningún cliente con ese dato.");
    cuerpoCC.innerHTML = filaEditableHTML();
    return;
  }
  campos.nombre.textContent = cliente.Nombre || "";
  campos.cuit.textContent = cliente.CUIT || "";
  campos.iva.textContent = cliente.CondicionIVA || "";
  campos.domicilio.textContent = cliente.Domicilio || "";
  campos.telefono.textContent = cliente.Telefono || "";
  campos.mail.textContent = cliente.Mail || "";
  const ventas = await getVentasPorCliente(cliente.Nombre);
  mostrarVentas(ventas);
}

async function manejarBusqueda() {
  const texto = buscadorInput.value.trim();
  if (!texto) return alert("Ingresá un nombre, CUIT o mail para buscar.");
  const cliente = await buscarCliente(texto);
  await mostrarCliente(cliente);
}

botonBuscar.addEventListener("click", manejarBusqueda);
buscadorInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    manejarBusqueda();
  }
});
