import { BASE_ID, API_TOKEN } from "./environment.js";
import { TABLE_CAJA } from "./config.js";

const proxy = "http://127.0.0.1:8080/proxy?url=";
const airtableUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_CAJA}`;
const urlCaja = `${proxy}${encodeURIComponent(airtableUrl)}`;

const tablaBody = document.querySelector(".tCaja tbody");
const inputFecha = document.querySelector("#fecha");
const saldoFooter = document.getElementById("saldo-footer");
const buscadorInput = document.querySelector("#q"); // puede no existir (por eso lo controlamos)

let movimientos = [];

async function traerDesdeAirtable() {
  try {
    const res = await fetch(urlCaja, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const data = await res.json();
    movimientos = data.records.map((r) => ({
      id: r.id,
      Fecha: r.fields.Fecha,
      Descripcion: r.fields.Descripcion,
      Ingreso: r.fields.Ingreso || 0,
      Egreso: r.fields.Egreso || 0,
    }));
    mostrarMovimientos(inputFecha.value);
  } catch (err) {
    console.error("⚡ Error al traer datos desde Airtable:", err);
  }
}

async function enviarAlBackend(movimiento, metodo = "POST") {
  try {
    const res = await fetch(
      metodo === "POST" ? urlCaja : `${urlCaja}/${movimiento.id}`,
      {
        method: metodo,
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: movimiento }),
      }
    );

    const result = await res.json().catch(() => null);
    console.log("📨 Respuesta Airtable:", result);
    return res.ok;
  } catch (err) {
    console.error("⚡ Error al conectar con el backend:", err);
    return false;
  }
}

async function eliminarDelBackend(id) {
  try {
    const res = await fetch(`${urlCaja}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    return res.ok;
  } catch (err) {
    console.error("⚡ Error al eliminar del backend:", err);
    return false;
  }
}

function filtrarPorFecha(fecha) {
  return movimientos.filter((m) => m.Fecha === fecha);
}

function mostrarMovimientos(fecha) {
  const lista = filtrarPorFecha(fecha);
  tablaBody.innerHTML = "";
  let saldo = 0;

  lista.forEach((mov) => {
    saldo += mov.Ingreso - mov.Egreso;
    tablaBody.insertAdjacentHTML(
      "beforeend",
      `
      <tr data-id="${mov.id}">
        <td>${mov.Fecha}</td>
        <td>${mov.Descripcion}</td>
        <td>${mov.Ingreso.toFixed(2)}</td>
        <td>${mov.Egreso.toFixed(2)}</td>
        <td>${saldo.toFixed(2)}</td>
        <td class="bot">
          <button class="bMod" type="button">Modificar</button>
          <button class="bEli" type="button">Eliminar</button>
        </td>
      </tr>`
    );
  });

  // Fila editable
  tablaBody.insertAdjacentHTML(
    "beforeend",
    `
    <tr>
      <td><input type="date" name="Fecha" value="${fecha || ""}"></td>
      <td><input type="text" name="Descripcion" placeholder="Descripción"></td>
      <td><input type="number" name="Ingreso" value="0"></td>
      <td><input type="number" name="Egreso" value="0"></td>
      <td></td>
      <td class="bot">
        <button class="bGua" type="button">Guardar</button>
      </td>
    </tr>`
  );

  saldoFooter.textContent = "$ " + saldo.toFixed(2);
}

inputFecha.addEventListener("change", () => {
  const fechaSeleccionada = inputFecha.value;
  if (!fechaSeleccionada) return;
  mostrarMovimientos(fechaSeleccionada);
});

if (buscadorInput) {
  buscadorInput.addEventListener("input", () => {
    const texto = buscadorInput.value.trim().toLowerCase();
    if (texto.length > 1) {
      const filtrado = movimientos.filter((m) =>
        (m.Descripcion || "").toLowerCase().includes(texto)
      );
      tablaBody.innerHTML = "";
      let saldo = 0;
      filtrado.forEach((mov) => {
        saldo += mov.Ingreso - mov.Egreso;
        tablaBody.insertAdjacentHTML(
          "beforeend",
          `
          <tr data-id="${mov.id}">
            <td>${mov.Fecha}</td>
            <td>${mov.Descripcion}</td>
            <td>${mov.Ingreso.toFixed(2)}</td>
            <td>${mov.Egreso.toFixed(2)}</td>
            <td>${saldo.toFixed(2)}</td>
            <td class="bot">
              <button class="bMod" type="button">Modificar</button>
              <button class="bEli" type="button">Eliminar</button>
            </td>
          </tr>`
        );
      });
    } else {
      mostrarMovimientos(inputFecha.value);
    }
  });
}

tablaBody.addEventListener("click", async (e) => {
  const fila = e.target.closest("tr");
  if (!fila) return;
  const idFila = fila.dataset.id;
  const fechaActual = inputFecha.value;

  if (e.target.classList.contains("bGua")) {
    const datos = {
      Fecha: fila.querySelector('[name="Fecha"]').value || fechaActual,
      Descripcion: fila.querySelector('[name="Descripcion"]').value.trim(),
      Ingreso: Number(fila.querySelector('[name="Ingreso"]').value),
      Egreso: Number(fila.querySelector('[name="Egreso"]').value),
    };

    if (!datos.Fecha || !datos.Descripcion) {
      alert("Completá la fecha y la descripción.");
      return;
    }

    if (idFila) {
      const ok = await enviarAlBackend({ ...datos, id: idFila }, "PATCH");
      if (ok) await traerDesdeAirtable();
    } else {
      const ok = await enviarAlBackend(datos, "POST");
      if (ok) await traerDesdeAirtable();
    }
  }

  if (e.target.classList.contains("bMod")) {
    const mov = movimientos.find((m) => m.id === idFila);
    if (!mov) return;
    fila.innerHTML = `
      <td><input type="date" name="Fecha" value="${mov.Fecha}"></td>
      <td><input type="text" name="Descripcion" value="${mov.Descripcion}"></td>
      <td><input type="number" name="Ingreso" value="${mov.Ingreso}"></td>
      <td><input type="number" name="Egreso" value="${mov.Egreso}"></td>
      <td></td>
      <td class="bot">
        <button class="bGua" type="button">Guardar</button>
        <button class="bEli" type="button">Eliminar</button>
      </td>`;
    fila.dataset.id = mov.id;
  }

  if (e.target.classList.contains("bEli")) {
    if (confirm("¿Eliminar este movimiento?")) {
      const ok = await eliminarDelBackend(idFila);
      if (ok) await traerDesdeAirtable();
    }
  }
});

(async function init() {
  const hoy = new Date().toISOString().split("T")[0];
  inputFecha.value = hoy;
  await traerDesdeAirtable();
})();
document.addEventListener("DOMContentLoaded", () => {
  const filas = document.querySelectorAll("table tr");
  filas.forEach((fila, i) => {
    setTimeout(() => fila.classList.add("visible"), i * 50);
  });
});