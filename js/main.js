/* ==================== ANIMACIÓN MENÚ HAMBURGUESA ==================== */
const botonMenu = document.querySelector(".meHam");
const menu = document.querySelector("nav ul");
botonMenu.addEventListener("click", toggleMenu);

function toggleMenu() {
  menu.classList.toggle("abierto");
}

/* ==================== DETECTOR DE PÁGINA ACTIVA ==================== */
const indicadorPagina = document.querySelectorAll("nav ul li a");
const paginaActual = window.location.pathname;

indicadorPagina.forEach((link) => {
  if (paginaActual.includes(link.getAttribute("href"))) {
    link.classList.add("activo");
  }
});

/* ==================== ANIMACIÓN PANEL PRINCIPAL (INDEX) ==================== */
const panelBotones = document.querySelectorAll(".mPan a");
panelBotones.forEach((boton, index) => {
  setTimeout(() => {
    boton.classList.add("visible");
  }, index * 200);
});

/* ==================== DATOS DINÁMICOS: ASIDE Y FOOTER ==================== */
import { getUltimoRegistro, getSaldoActual } from "./api.js";
import { TABLE_CCVENTAS, TABLE_CCCOMPRAS } from "./config.js";

/* ==================== MOSTRAR ÚLTIMA VENTA Y COMPRA (ASIDE) ==================== */
async function mostrarUltimosMovimientos() {
  try {
    const ultimaVenta = await getUltimoRegistro(TABLE_CCVENTAS);
    const ultimaCompra = await getUltimoRegistro(TABLE_CCCOMPRAS);

    // 🔹 Venta
    const ventaNombre = document.querySelector("aside h3:nth-of-type(1) + p");
    const ventaImporte = document.querySelector("aside h3:nth-of-type(1) + p + p");

    if (ultimaVenta) {
      ventaNombre.textContent = ultimaVenta.Cliente || "—";
      ventaImporte.textContent = `$${ultimaVenta.Ingreso || 0}`;

      // ✅ Guardar en localStorage
      localStorage.setItem("ultimaVenta", JSON.stringify({
        cliente: ultimaVenta.Cliente || "—",
        importe: ultimaVenta.Ingreso || 0,
      }));
    }

    // 🔹 Compra
    const compraNombre = document.querySelector("aside h3:nth-of-type(2) + p");
    const compraImporte = document.querySelector("aside h3:nth-of-type(2) + p + p");

    if (ultimaCompra) {
      compraNombre.textContent = ultimaCompra.Proveedor || "—";
      compraImporte.textContent = `$${ultimaCompra.Egreso || 0}`;

      // ✅ Guardar en localStorage
      localStorage.setItem("ultimaCompra", JSON.stringify({
        proveedor: ultimaCompra.Proveedor || "—",
        importe: ultimaCompra.Egreso || 0,
      }));
    }
  } catch (error) {
    console.error("Error al cargar el aside:", error);

    // ⚙️ Si hay error, mostrar lo último guardado
    const ventaGuardada = JSON.parse(localStorage.getItem("ultimaVenta") || "{}");
    const compraGuardada = JSON.parse(localStorage.getItem("ultimaCompra") || "{}");

    const ventaNombre = document.querySelector("aside h3:nth-of-type(1) + p");
    const ventaImporte = document.querySelector("aside h3:nth-of-type(1) + p + p");
    const compraNombre = document.querySelector("aside h3:nth-of-type(2) + p");
    const compraImporte = document.querySelector("aside h3:nth-of-type(2) + p + p");

    if (ventaGuardada.cliente) {
      ventaNombre.textContent = ventaGuardada.cliente;
      ventaImporte.textContent = `$${ventaGuardada.importe}`;
    }
    if (compraGuardada.proveedor) {
      compraNombre.textContent = compraGuardada.proveedor;
      compraImporte.textContent = `$${compraGuardada.importe}`;
    }
  }
}

/* ==================== MOSTRAR SALDO ACTUAL EN FOOTER ==================== */
async function mostrarSaldoFooter() {
  const celdaFooter = document.getElementById("saldo-footer");
  try {
    const saldo = await getSaldoActual();
    if (celdaFooter) celdaFooter.textContent = `$ ${saldo.toFixed(2)}`;

    // ✅ Guardar saldo en localStorage
    localStorage.setItem("saldoActual", saldo.toFixed(2));
  } catch (err) {
    console.error("Error al obtener saldo:", err);

    // ⚙️ Mostrar último saldo guardado si hay
    const saldoGuardado = localStorage.getItem("saldoActual");
    if (saldoGuardado && celdaFooter) {
      celdaFooter.textContent = `$ ${parseFloat(saldoGuardado).toFixed(2)} (último valor)`;
    }
  }
}

/* ==================== INICIALIZAR ==================== */
window.addEventListener("DOMContentLoaded", () => {
  mostrarUltimosMovimientos();
  mostrarSaldoFooter();
});
