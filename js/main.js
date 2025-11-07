const botonMenu = document.querySelector(".meHam");
const menu = document.querySelector("nav ul");
botonMenu.addEventListener("click", () => menu.classList.toggle("abierto"));

const indicadorPagina = document.querySelectorAll("nav ul li a");
const paginaActual = window.location.pathname;
indicadorPagina.forEach((link) => {
  if (paginaActual.includes(link.getAttribute("href"))) link.classList.add("activo");
});

const panelBotones = document.querySelectorAll(".mPan a");
panelBotones.forEach((boton, i) => setTimeout(() => boton.classList.add("visible"), i * 200));

import { getTotalVentas, getTotalCompras, getSaldoActual } from "./api.js";

async function mostrarTotales() {
  const v = document.getElementById("total-ventas");
  const c = document.getElementById("total-compras");
  try {
    const totalV = await getTotalVentas();
    const totalC = await getTotalCompras();
    if (v) v.textContent = `$${totalV.toLocaleString("es-AR")}`;
    if (c) c.textContent = `$${totalC.toLocaleString("es-AR")}`;
  } catch {
    if (v) v.textContent = "$0";
    if (c) c.textContent = "$0";
  }
}

async function mostrarSaldoFooter() {
  const f = document.getElementById("saldo-footer");
  try {
    const s = await getSaldoActual();
    if (f) f.textContent = `$ ${s.toFixed(2)}`;
  } catch {
    if (f) f.textContent = "$ 0.00";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  mostrarTotales();
  mostrarSaldoFooter();
});

window.addEventListener("DOMContentLoaded", () => {
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const fecha = new Date();
  const diaTexto = dias[fecha.getDay()];
  const fechaTexto = fecha.toLocaleDateString("es-AR");

  let texto = localStorage.getItem("diaGuardado");

  if (!texto || texto !== `${diaTexto}, ${fechaTexto}`) {
    texto = `${diaTexto.charAt(0).toUpperCase() + diaTexto.slice(1)}, ${fechaTexto}`;
    localStorage.setItem("diaGuardado", texto);
  }

  const el = document.getElementById("dia-hoy");
  if (el) el.textContent = `Hoy es ${texto}`;
});

