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

function buscarClienteLocal(texto) {
  const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
  const t = texto.toLowerCase();
  return (
    clientes.find(
      (c) =>
        c.Nombre.toLowerCase().includes(t) ||
        c.CUIT.toLowerCase().includes(t) ||
        c.Mail.toLowerCase().includes(t)
    ) || null
  );
}

function getVentasPorClienteLocal(nombreCliente) {
  const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
  return ventas.filter((v) => v.Cliente === nombreCliente);
}

function guardarVentaLocal(venta) {
  const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
  ventas.push(venta);
  localStorage.setItem("ventas", JSON.stringify(ventas));
}

function eliminarVentaLocal(id) {
  let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
  ventas = ventas.filter((v) => v.id !== id);
  localStorage.setItem("ventas", JSON.stringify(ventas));
}

function actualizarVentaLocal(id, nuevosDatos) {
  let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
  ventas = ventas.map((v) => (v.id === id ? { ...v, ...nuevosDatos } : v));
  localStorage.setItem("ventas", JSON.stringify(ventas));
}

function filaEditableHTML(v = {}) {
  return `
    <tr ${v.id ? `data-id="${v.id}"` : ""}>
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

  const ventas = getVentasPorClienteLocal(cliente.Nombre);
  mostrarVentas(ventas);
}

async function manejarBusqueda() {
  const texto = buscadorInput.value.trim();
  if (!texto) {
    Object.values(campos).forEach((c) => (c.textContent = ""));
    cuerpoCC.innerHTML = filaEditableHTML();
    localStorage.removeItem("ultimoCliente");
    return;
  }
  localStorage.setItem("ultimoCliente", texto);
  const cliente = buscarClienteLocal(texto);
  await mostrarCliente(cliente);
}

let timeoutBusqueda;
buscadorInput.addEventListener("input", () => {
  clearTimeout(timeoutBusqueda);
  timeoutBusqueda = setTimeout(() => {
    const texto = buscadorInput.value.trim();
    if (texto.length > 2) manejarBusqueda();
  }, 500);
});

window.addEventListener("DOMContentLoaded", async () => {
  const ultimo = localStorage.getItem("ultimoCliente");
  if (ultimo) {
    buscadorInput.value = ultimo;
    await manejarBusqueda();
  }
});

cuerpoCC.addEventListener("click", (e) => {
  const fila = e.target.closest("tr");
  if (!fila) return;

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

  if (e.target.classList.contains("bGua")) {
    const clienteNombre = campos.nombre.textContent.trim();
    if (!clienteNombre) {
      alert("⚠️ Debe seleccionar un cliente antes de guardar movimientos.");
      return;
    }

    const id = fila.dataset.id || crypto.randomUUID();
    const ventasPrevias = getVentasPorClienteLocal(clienteNombre);
    const ultimoSaldo = ventasPrevias.length
      ? Number(ventasPrevias[ventasPrevias.length - 1].Saldo)
      : 0;

    const ingreso = Number(fila.querySelector('[name="debe"]').value);
    const egreso = Number(fila.querySelector('[name="pago"]').value);
    const nuevoSaldo = ultimoSaldo + ingreso - egreso;

    const datos = {
      id,
      Fecha: fila.querySelector('[name="fec"]').value,
      Factura: fila.querySelector('[name="factura"]').value,
      TipoPago: fila.querySelector('[name="tpago"]').value || "",
      Ingreso: ingreso,
      Egreso: egreso,
      Saldo: nuevoSaldo,
      Cliente: clienteNombre,
    };

    if (fila.dataset.id) actualizarVentaLocal(id, datos);
    else guardarVentaLocal(datos);

    mostrarVentas(getVentasPorClienteLocal(clienteNombre));
  }

  if (e.target.classList.contains("bEli")) {
    if (confirm("¿Eliminar este registro?")) {
      const id = fila.dataset.id;
      eliminarVentaLocal(id);
      fila.remove();
      const clienteNombre = campos.nombre.textContent.trim();
      mostrarVentas(getVentasPorClienteLocal(clienteNombre));
    }
  }
});
