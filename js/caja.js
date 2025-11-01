import { BASE_ID, API_TOKEN } from "./environment.js";
import { TABLE_CCVENTAS, TABLE_CCCOMPRAS, TABLE_CAJA } from "./config.js";

const proxy = "https://cors-anywhere.herokuapp.com/";
const urlVentas = `${proxy}https://api.airtable.com/v0/${BASE_ID}/${TABLE_CCVENTAS}`;
const urlCompras = `${proxy}https://api.airtable.com/v0/${BASE_ID}/${TABLE_CCCOMPRAS}`;
const urlCaja = `${proxy}https://api.airtable.com/v0/${BASE_ID}/${TABLE_CAJA}`;

const tablaBody = document.querySelector(".tCaja tbody");
const inputFecha = document.querySelector("#fecha");

// ==================== TRAER DATOS DEL BACK ====================
async function fetchAirtable(url) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  return data.records.map((r) => ({ id: r.id, ...r.fields }));
}

async function getMovimientos() {
  const [ventas, compras, caja] = await Promise.all([
    fetchAirtable(urlVentas),
    fetchAirtable(urlCompras),
    fetchAirtable(urlCaja),
  ]);

  const mapVenta = ventas.map((v) => ({
    id: v.id,
    Fecha: v.Fecha,
    Descripcion: `Venta a ${v.Cliente || ""}`,
    Ingreso: v.Ingreso || 0,
    Egreso: 0,
  }));

  const mapCompra = compras.map((c) => ({
    id: c.id,
    Fecha: c.Fecha,
    Descripcion: `Compra a ${c.Proveedor || ""}`,
    Ingreso: 0,
    Egreso: c.Egreso || 0,
  }));

  const mapCaja = caja.map((m) => ({
    id: m.id,
    Fecha: m.Fecha,
    Descripcion: m.Descripcion || "Movimiento manual",
    Ingreso: m.Ingreso || 0,
    Egreso: m.Egreso || 0,
  }));

  const todos = [...mapVenta, ...mapCompra, ...mapCaja];
  todos.sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));
  return todos;
}

// ==================== MOSTRAR MOVIMIENTOS ====================
function mostrarMovimientosConSaldoInicial(lista, saldoAnterior, fechaSeleccionada) {
  tablaBody.innerHTML = "";
  let saldo = saldoAnterior;

  // Fila de saldo inicial
  if (fechaSeleccionada && !isNaN(saldoAnterior)) {
    const esPositivo = saldoAnterior >= 0;
    const ingreso = esPositivo ? saldoAnterior.toFixed(2) : 0;
    const egreso = esPositivo ? 0 : Math.abs(saldoAnterior).toFixed(2);
    tablaBody.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${fechaSeleccionada}</td>
        <td>Saldo inicial</td>
        <td>${ingreso}</td>
        <td>${egreso}</td>
        <td>${saldoAnterior.toFixed(2)}</td>
        <td></td>
      </tr>
      `
    );
  }

  // Filas de movimientos del día
  lista.forEach((mov) => {
    saldo += (Number(mov.Ingreso) || 0) - (Number(mov.Egreso) || 0);
    tablaBody.insertAdjacentHTML(
      "beforeend",
      `
      <tr data-id="${mov.id}">
        <td>${mov.Fecha || ""}</td>
        <td>${mov.Descripcion || ""}</td>
        <td>${mov.Ingreso || 0}</td>
        <td>${mov.Egreso || 0}</td>
        <td>${saldo.toFixed(2)}</td>
        <td>
          <button class="bMod" type="button">Modificar</button>
          <button class="bEli" type="button">Eliminar</button>
        </td>
      </tr>
    `
    );
  });

  // Fila vacía para cargar manualmente
  tablaBody.insertAdjacentHTML(
    "beforeend",
    `
    <tr>
      <td><input type="date" name="Fecha" value="${fechaSeleccionada || ""}"></td>
      <td><input type="text" name="Descripcion"></td>
      <td><input type="number" name="Ingreso" value="0"></td>
      <td><input type="number" name="Egreso" value="0"></td>
      <td></td>
      <td>
        <button class="bGua" type="button">Guardar</button>
      </td>
    </tr>
  `
  );

  // Actualizar saldo final y footer
  const saldoFinal = saldo.toFixed(2);
  const celdaFinal = document.getElementById("saldo-final");
  const celdaFooter = document.getElementById("saldo-footer");
  if (celdaFinal) celdaFinal.textContent = saldoFinal;
  if (celdaFooter) celdaFooter.textContent = `$ ${saldoFinal}`;
}

// ==================== EVENTO: CAMBIO DE FECHA ====================
inputFecha.addEventListener("change", async () => {
  const todos = await getMovimientos();
  const fechaSeleccionada = inputFecha.value;

  if (!fechaSeleccionada) return;

  const anteriores = todos.filter((m) => new Date(m.Fecha) < new Date(fechaSeleccionada));
  const saldoAnterior = anteriores.reduce(
    (acc, m) => acc + (Number(m.Ingreso) || 0) - (Number(m.Egreso) || 0),
    0
  );

  const movimientosDelDia = todos.filter((m) => m.Fecha === fechaSeleccionada);

  mostrarMovimientosConSaldoInicial(movimientosDelDia, saldoAnterior, fechaSeleccionada);
});

// ==================== CRUD MANUAL ====================
tablaBody.addEventListener("click", async (e) => {
  const fila = e.target.closest("tr");
  if (!fila) return;

  // Guardar nuevo
  if (e.target.classList.contains("bGua")) {
    const datos = {
      Fecha: fila.querySelector('[name="Fecha"]').value,
      Descripcion: fila.querySelector('[name="Descripcion"]').value,
      Ingreso: Number(fila.querySelector('[name="Ingreso"]').value),
      Egreso: Number(fila.querySelector('[name="Egreso"]').value),
    };

    if (!datos.Fecha || !datos.Descripcion.trim()) {
      alert("Completá la fecha y la descripción.");
      return;
    }

    const res = await fetch(urlCaja, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: datos }),
    });

    if (res.ok) {
      inputFecha.dispatchEvent(new Event("change"));
    } else {
      alert("Error al guardar el movimiento.");
    }
  }

  // Modificar
  if (e.target.classList.contains("bMod")) {
    const celdas = fila.querySelectorAll("td:not(:last-child)");
    const valores = [...celdas].map((td) => td.textContent.trim());
    fila.innerHTML = `
      <td><input type="date" name="Fecha" value="${valores[0]}"></td>
      <td><input type="text" name="Descripcion" value="${valores[1]}"></td>
      <td><input type="number" name="Ingreso" value="${valores[2]}"></td>
      <td><input type="number" name="Egreso" value="${valores[3]}"></td>
      <td>${valores[4]}</td>
      <td>
        <button class="bGuaMod" type="button">Guardar</button>
        <button class="bEli" type="button">Eliminar</button>
      </td>
    `;
  }

  // Guardar modificación
  if (e.target.classList.contains("bGuaMod")) {
    const id = fila.dataset.id;
    const datos = {
      Fecha: fila.querySelector('[name="Fecha"]').value,
      Descripcion: fila.querySelector('[name="Descripcion"]').value,
      Ingreso: Number(fila.querySelector('[name="Ingreso"]').value),
      Egreso: Number(fila.querySelector('[name="Egreso"]').value),
    };

    const res = await fetch(`${urlCaja}/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: datos }),
    });

    if (res.ok) {
      inputFecha.dispatchEvent(new Event("change"));
    } else {
      alert("Error al modificar el movimiento.");
    }
  }

  // Eliminar
  if (e.target.classList.contains("bEli")) {
    if (confirm("¿Eliminar este registro?")) {
      const id = fila.dataset.id;
      if (id) {
        await fetch(`${urlCaja}/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        });
      }
      inputFecha.dispatchEvent(new Event("change"));
    }
  }
});

// ==================== INICIO ====================
// Arranca vacío hasta que se seleccione una fecha
(function init() {
  tablaBody.innerHTML = "";
})();
