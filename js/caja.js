import { BASE_ID, API_TOKEN } from "./environment.js";
import { TABLE_CAJA } from "./config.js";

const proxy = "http://localhost:8080/proxy?url=";
const airtableUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_CAJA}`;
const urlCaja = `${proxy}${encodeURIComponent(airtableUrl)}`;

const tablaBody = document.querySelector(".tCaja tbody");
const inputFecha = document.querySelector("#fecha");
const saldoFooter = document.getElementById("saldo-footer");

let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];

function guardarEnLocal() {
  localStorage.setItem("movimientos", JSON.stringify(movimientos));
}

function filtrarPorFecha(fecha) {
  return movimientos.filter((m) => m.Fecha === fecha);
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
    return res.ok;
  } catch (err) {
    console.error("Error al conectar con el backend:", err);
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
    console.error("Error al eliminar del backend:", err);
    return false;
  }
}

async function sincronizarDesdeBackend() {
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
    guardarEnLocal();
    mostrarMovimientos(inputFecha.value);
  } catch (err) {
    console.error("Error al traer datos del backend:", err);
  }
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
      </tr>
    `
    );
  });

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
    </tr>
  `
  );

  saldoFooter.textContent = "$ " + saldo.toFixed(2);
}

inputFecha.addEventListener("change", () => {
  const fechaSeleccionada = inputFecha.value;
  if (!fechaSeleccionada) return;
  mostrarMovimientos(fechaSeleccionada);
});

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
      const index = movimientos.findIndex((m) => m.id === idFila);
      if (index !== -1) movimientos[index] = { ...datos, id: idFila };
      await enviarAlBackend({ ...datos }, "PATCH");
    } else {
      const nuevo = { ...datos };
      const ok = await enviarAlBackend(nuevo, "POST");
      if (ok) await sincronizarDesdeBackend();
      else {
        nuevo.id = Date.now().toString();
        movimientos.push(nuevo);
      }
    }

    guardarEnLocal();
    mostrarMovimientos(fechaActual);
  }

  if (e.target.classList.contains("bMod")) {
    const mov = movimientos.find((m) => m.id === idFila);
    fila.innerHTML = `
      <td><input type="date" name="Fecha" value="${mov.Fecha}"></td>
      <td><input type="text" name="Descripcion" value="${mov.Descripcion}"></td>
      <td><input type="number" name="Ingreso" value="${mov.Ingreso}"></td>
      <td><input type="number" name="Egreso" value="${mov.Egreso}"></td>
      <td></td>
      <td class="bot">
        <button class="bGua" type="button">Guardar</button>
        <button class="bEli" type="button">Eliminar</button>
      </td>
    `;
    fila.dataset.id = mov.id;
  }

  if (e.target.classList.contains("bEli")) {
    if (confirm("¿Eliminar este movimiento?")) {
      movimientos = movimientos.filter((m) => m.id !== idFila);
      await eliminarDelBackend(idFila);
      guardarEnLocal();
      mostrarMovimientos(fechaActual);
    }
  }
});

(async function init() {
  const hoy = new Date().toISOString().split("T")[0];
  inputFecha.value = hoy;
  await sincronizarDesdeBackend();
})();

