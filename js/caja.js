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

  // Normalizamos los 3 tipos al mismo formato
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

// ==================== MOSTRAR EN TABLA ====================
function mostrarMovimientos(lista) {
  tablaBody.innerHTML = "";
  let saldo = 0;

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
        <td>${saldo}</td>
        <td class="bot">
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
      <td><input type="date" name="Fecha"></td>
      <td><input type="text" name="Descripcion" placeholder="Descripción"></td>
      <td><input type="number" name="Ingreso" value="0"></td>
      <td><input type="number" name="Egreso" value="0"></td>
      <td>—</td>
      <td class="bot">
        <button class="bGua" type="button">Guardar</button>
      </td>
    </tr>
  `
  );
}

// ==================== FILTRO POR FECHA ====================
inputFecha.addEventListener("change", async () => {
  const todos = await getMovimientos();
  const seleccionada = inputFecha.value;
  if (!seleccionada) return mostrarMovimientos(todos);

  const filtrados = todos.filter((m) => m.Fecha?.startsWith(seleccionada));
  mostrarMovimientos(filtrados);
});

// ==================== CRUD MANUAL ====================
tablaBody.addEventListener("click", async (e) => {
  const fila = e.target.closest("tr");
  if (!fila) return;

  // 💾 GUARDAR NUEVO
  if (e.target.classList.contains("bGua")) {
    const datos = {
      Fecha: fila.querySelector('[name="Fecha"]').value,
      Descripcion: fila.querySelector('[name="Descripcion"]').value,
      Ingreso: Number(fila.querySelector('[name="Ingreso"]').value),
      Egreso: Number(fila.querySelector('[name="Egreso"]').value),
    };

    const res = await fetch(urlCaja, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: datos }),
    });

    if (res.ok) {
      alert("Movimiento agregado a Caja");
      const todos = await getMovimientos();
      mostrarMovimientos(todos);
    } else {
      alert("Error al guardar el movimiento");
    }
  }

  // ✏️ MODIFICAR
  if (e.target.classList.contains("bMod")) {
    const celdas = fila.querySelectorAll("td:not(.bot)");
    const valores = [...celdas].map((td) => td.textContent.trim());
    fila.innerHTML = `
      <td><input type="date" name="Fecha" value="${valores[0]}"></td>
      <td><input type="text" name="Descripcion" value="${valores[1]}"></td>
      <td><input type="number" name="Ingreso" value="${valores[2]}"></td>
      <td><input type="number" name="Egreso" value="${valores[3]}"></td>
      <td>${valores[4]}</td>
      <td class="bot">
        <button class="bGuaMod" type="button">Guardar</button>
        <button class="bEli" type="button">Eliminar</button>
      </td>
    `;
  }

  // 💾 GUARDAR MODIFICACIÓN
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
      alert("Movimiento actualizado");
      const todos = await getMovimientos();
      mostrarMovimientos(todos);
    } else {
      alert("Error al modificar el movimiento");
    }
  }

  // ❌ ELIMINAR
  if (e.target.classList.contains("bEli")) {
    if (confirm("¿Eliminar este registro?")) {
      const id = fila.dataset.id;
      if (id) {
        await fetch(`${urlCaja}/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        });
      }
      fila.remove();
    }
  }
});

// ==================== INICIO ====================
(async function init() {
  const movimientos = await getMovimientos();
  mostrarMovimientos(movimientos);
})();
