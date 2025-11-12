/*Importaciones*/
import { BASE_ID, API_TOKEN } from "./environment.js";
import { TABLE_CAJA } from "./config.js";

/*URL para acceder a la tabla de Caja en Airtable*/
const urlCaja = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_CAJA}`;

/*Selecciona los elementos principales del DOM*/
const tablaBody = document.querySelector(".tCaja tbody");
const inputFecha = document.querySelector("#fecha");
const saldoFooter = document.getElementById("saldo-footer");
const buscadorInput = document.querySelector("#q");

/*Array donde se guardan todos los movimientos*/
let movimientos = [];

/*Carga todos los movimientos guardados en Airtable*/
async function traerDesdeAirtable() {
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
}

/*Envia o actuliza movimiento en Airtable*/
async function enviarAlBackend(movimiento, metodo = "POST") {
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
}

/*Elimina movimiento en Airtable*/
async function eliminarDelBackend(id) {
  const res = await fetch(`${urlCaja}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  return res.ok;
}

/*Confirmacion accion*/
function mostrarMensaje(texto, color = "green", tiempo = 2000) {
  const noti = document.getElementById("noti");
  if (!noti) return;
  noti.textContent = texto;
  noti.style.background = color;
  noti.classList.add("visible");
  setTimeout(() => noti.classList.remove("visible"), tiempo);
}

/*Filtra por fecha*/
function filtrarPorFecha(fecha) {
  return movimientos.filter((m) => m.Fecha === fecha);
}

/*Muestra los movimiento*/
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

  /*Agrega fila para cargar movimiento*/
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

/*Ordena por fecha*/
inputFecha.addEventListener("change", () => {
  const fechaSeleccionada = inputFecha.value;
  if (!fechaSeleccionada) return;
  mostrarMovimientos(fechaSeleccionada);
});

/*Permite agregar descripcion*/
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

/*Ventana para confirmar la acción del usuario*/
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

/*Escucha los botones*/
tablaBody.addEventListener("click", async (e) => {
  const fila = e.target.closest("tr");
  if (!fila) return;
  const idFila = fila.dataset.id;
  const fechaActual = inputFecha.value;

  /*Guarda lo nuevo o editado*/
  if (e.target.classList.contains("bGua")) {
    const datos = {
      Fecha: fila.querySelector('[name="Fecha"]').value || fechaActual,
      Descripcion: fila.querySelector('[name="Descripcion"]').value.trim(),
      Ingreso: Number(fila.querySelector('[name="Ingreso"]').value),
      Egreso: Number(fila.querySelector('[name="Egreso"]').value),
    };
    if (!datos.Fecha || !datos.Descripcion) return;
    const ok = idFila
      ? await enviarAlBackend({ ...datos, id: idFila }, "PATCH")
      : await enviarAlBackend(datos, "POST");
    if (ok) {
      await traerDesdeAirtable();
      mostrarMensaje("Movimiento guardado correctamente");
    }
  }

  /*Activa la edicion del movimiento*/
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
/*Elimina movimiento*/
  if (e.target.classList.contains("bEli")) {
    if (!(await confirmarAccion("¿Eliminar este movimiento?"))) return;
    const ok = await eliminarDelBackend(idFila);
    if (ok) {
      await traerDesdeAirtable();
      mostrarMensaje("Movimiento eliminado correctamente");
    }
  }
});

/*Inicia con la fecha de hoy*/
(async function init() {
  const hoy = new Date().toISOString().split("T")[0];
  inputFecha.value = hoy;
  await traerDesdeAirtable();
})();

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
