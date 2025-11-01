/* Buscador de clientes y cuenta corriente */
import { BASE_ID, API_TOKEN } from "./environment.js";
import { TABLE_CLIENTES, TABLE_CCVENTAS } from "./config.js";

const proxy = "https://cors-anywhere.herokuapp.com/";
const urlClientes = `${proxy}https://api.airtable.com/v0/${BASE_ID}/${TABLE_CLIENTES}`;
const urlVentas = `${proxy}https://api.airtable.com/v0/${BASE_ID}/${TABLE_CCVENTAS}`;

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

/* ==================== BUSCAR CLIENTE ==================== */
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

/* ==================== TRAER MOVIMIENTOS ==================== */
async function getVentasPorCliente(nombreCliente) {
  const filtro = `FIND(LOWER("${nombreCliente}"), LOWER({Cliente}))`;
  const res = await fetch(
    `${urlVentas}?filterByFormula=${encodeURIComponent(filtro)}&view=Grid%20view`,
    {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    }
  );
  const data = await res.json();
  return data.records.map((r) => ({ id: r.id, ...r.fields }));
}

/* ==================== FILAS HTML ==================== */
function filaEditableHTML(v = {}) {
  return `
    <tr ${v.id ? `data-id="${v.id}"` : ""}>
      <td><input type="date" name="fec" value="${v.Fecha || ""}"></td>
      <td><input type="text" name="factura" value="${v.Factura || ""}"></td>
      <td>
        <select name="tpago">
          <option value="">Seleccione</option>
          <option value="efectivo">Efectivo</option>
          <option value="debito">Débito</option>
          <option value="credito">Crédito</option>
          <option value="transferencia">Transferencia</option>
        </select>
      </td>
      <td><input type="number" name="debe" value="${v.Ingreso || 0}"></td>
      <td><input type="number" name="pago" value="${v.Egreso || 0}"></td>
      <td><input type="number" name="saldo" value="${v.Saldo || 0}" readonly></td>
      <td class="bot">
        <button class="bGua" type="button">Guardar</button>
        <button class="bMod" type="button">Modificar</button>
        <button class="bEli" type="button">Eliminar</button>
      </td>
    </tr>
  `;
}

function filaConDatosHTML(v, saldoAcumulado) {
  return `
    <tr data-id="${v.id}">
      <td>${v.Fecha || ""}</td>
      <td>${v.Factura || ""}</td>
      <td>${v.TipoPago || ""}</td>
      <td>${v.Ingreso || 0}</td>
      <td>${v.Egreso || 0}</td>
      <td>${saldoAcumulado}</td>
      <td class="bot">
        <button class="bMod" type="button">Modificar</button>
        <button class="bEli" type="button">Eliminar</button>
      </td>
    </tr>
  `;
}

/* ==================== MOSTRAR MOVIMIENTOS ==================== */
function mostrarVentas(lista) {
  cuerpoCC.innerHTML = "";
  if (!lista || lista.length === 0) {
    cuerpoCC.innerHTML = filaEditableHTML();
    return;
  }

  let saldoAcumulado = 0;
  lista.forEach((v) => {
    const ingreso = Number(v.Ingreso) || 0;
    const egreso = Number(v.Egreso) || 0;
    saldoAcumulado += ingreso - egreso;
    cuerpoCC.insertAdjacentHTML("beforeend", filaConDatosHTML(v, saldoAcumulado));
  });

  cuerpoCC.insertAdjacentHTML("beforeend", filaEditableHTML());
}

/* ==================== MOSTRAR CLIENTE ==================== */
async function mostrarCliente(cliente) {
  if (!cliente) {
    Object.values(campos).forEach((c) => (c.textContent = ""));
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

/* ==================== BUSCADOR EN VIVO + LOCALSTORAGE ==================== */
async function manejarBusqueda() {
  const texto = buscadorInput.value.trim();

  if (!texto) {
    Object.values(campos).forEach((c) => (c.textContent = ""));
    cuerpoCC.innerHTML = filaEditableHTML();
    localStorage.removeItem("ultimoCliente");
    return;
  }

  // 🔹 Guardar el último cliente buscado
  localStorage.setItem("ultimoCliente", texto);

  const cliente = await buscarCliente(texto);
  await mostrarCliente(cliente);
}

// 🔹 Búsqueda automática mientras escribe (con delay)
let timeoutBusqueda;
buscadorInput.addEventListener("input", () => {
  clearTimeout(timeoutBusqueda);
  timeoutBusqueda = setTimeout(() => {
    const texto = buscadorInput.value.trim();
    if (texto.length > 2) manejarBusqueda();
  }, 500);
});

// 🔹 Al cargar la página, restaurar el último cliente buscado
window.addEventListener("DOMContentLoaded", async () => {
  const ultimo = localStorage.getItem("ultimoCliente");
  if (ultimo) {
    buscadorInput.value = ultimo;
    await manejarBusqueda();
  }
});

/* ==================== CRUD ==================== */
cuerpoCC.addEventListener("click", async (e) => {
  const fila = e.target.closest("tr");
  if (!fila) return;

  /* ✏️ MODIFICAR */
  if (e.target.classList.contains("bMod")) {
    const celdas = fila.querySelectorAll("td:not(.bot)");
    const valores = [...celdas].map((td) => td.textContent.trim());
    fila.innerHTML = `
      <td><input type="date" name="fec" value="${valores[0] || ""}"></td>
      <td><input type="text" name="factura" value="${valores[1] || ""}"></td>
      <td>
        <select name="tpago">
          <option value="">Seleccione</option>
          <option value="efectivo">Efectivo</option>
          <option value="debito">Débito</option>
          <option value="credito">Crédito</option>
          <option value="transferencia">Transferencia</option>
        </select>
      </td>
      <td><input type="number" name="debe" value="${valores[3] || 0}"></td>
      <td><input type="number" name="pago" value="${valores[4] || 0}"></td>
      <td><input type="number" name="saldo" value="${valores[5] || 0}" readonly></td>
      <td class="bot">
        <button class="bGua" type="button">Guardar</button>
        <button class="bEli" type="button">Eliminar</button>
      </td>
    `;
  }

  /* 💾 GUARDAR */
  if (e.target.classList.contains("bGua")) {
    const clienteNombre = campos.nombre.textContent.trim();
    if (!clienteNombre) {
      alert("⚠️ Debe seleccionar un cliente antes de cargar movimientos.");
      return;
    }

    const datos = {
      Fecha: fila.querySelector('[name="fec"]').value,
      Factura: fila.querySelector('[name="factura"]').value,
      TipoPago: fila.querySelector('[name="tpago"]').value || null,
      Ingreso: Number(fila.querySelector('[name="debe"]').value),
      Egreso: Number(fila.querySelector('[name="pago"]').value),
      Cliente: clienteNombre,
    };

    const id = fila.dataset.id;
    const url = id ? `${urlVentas}/${id}` : urlVentas;
    const method = id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: datos }),
    });

    if (res.ok) {
      const ventas = await getVentasPorCliente(clienteNombre);
      mostrarVentas(ventas);
    } else {
      alert("Error al guardar los datos.");
    }
  }

  /* ❌ ELIMINAR */
  if (e.target.classList.contains("bEli")) {
    if (confirm("¿Eliminar este registro?")) {
      const id = fila.dataset.id;
      if (id) {
        await fetch(`${urlVentas}/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        });
      }
      fila.remove();
    }
  }
});
