import { getUltimaVenta, getUltimaCompra, getSaldoActual } from "./api.js";

async function mostrarUltimosMovimientos() {
  try {
    const ultimaVenta = await getUltimaVenta();
    const ultimaCompra = await getUltimaCompra();

    const ventaNombre = document.querySelector("aside h3:nth-of-type(1) + p");
    const ventaImporte = document.querySelector("aside h3:nth-of-type(1) + p + p");
    const compraNombre = document.querySelector("aside h3:nth-of-type(2) + p");
    const compraImporte = document.querySelector("aside h3:nth-of-type(2) + p + p");

    if (ultimaVenta) {
      ventaNombre.textContent = ultimaVenta.Cliente || "—";
      ventaImporte.textContent = `$${(ultimaVenta.Ingreso || 0).toFixed(2)}`;
    } else {
      ventaNombre.textContent = "—";
      ventaImporte.textContent = "$0.00";
    }

    if (ultimaCompra) {
      compraNombre.textContent = ultimaCompra.Proveedor || "—";
      compraImporte.textContent = `$${(ultimaCompra.Egreso || 0).toFixed(2)}`;
    } else {
      compraNombre.textContent = "—";
      compraImporte.textContent = "$0.00";
    }
  } catch (error) {
    console.error("Error al cargar los últimos movimientos:", error);
  }
}

async function mostrarSaldoFooter() {
  const celdaFooter = document.getElementById("saldo-footer");
  try {
    const saldo = await getSaldoActual();
    if (celdaFooter) celdaFooter.textContent = `$ ${saldo.toFixed(2)}`;
  } catch (err) {
    console.error("Error al obtener saldo:", err);
    if (celdaFooter) celdaFooter.textContent = "$ 0.00";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  mostrarUltimosMovimientos();
  mostrarSaldoFooter();
});
