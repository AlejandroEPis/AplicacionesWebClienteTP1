/*Menu Hamburguesa*/
const botonMenu = document.querySelector(".meHam");
const menu = document.querySelector("nav ul");
botonMenu.addEventListener("click", () => menu.classList.toggle("abierto"));

/*Marca la página actual en el menú de navegación*/
const indicadorPagina = document.querySelectorAll("nav ul li a");
const paginaActual = window.location.pathname;
indicadorPagina.forEach((link) => {
  if (paginaActual.includes(link.getAttribute("href"))) link.classList.add("activo");
});

/*Muestra los botones del panel principal con animación*/
const panelBotones = document.querySelectorAll(".mPan a");
panelBotones.forEach((boton, i) => setTimeout(() => boton.classList.add("visible"), i * 200));

/*Importa las funciones para mostrar totales desde Airtable*/
import { getTotalVentas, getTotalCompras, getSaldoActual } from "./api.js";

/*Muestra el total de ventas y compras*/
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

/*Muestra el saldo actual en el pie de página*/
async function mostrarSaldoFooter() {
  const f = document.getElementById("saldo-footer");
  try {
    const s = await getSaldoActual();
    if (f) f.textContent = `$ ${s.toFixed(2)}`;
  } catch {
    if (f) f.textContent = "$ 0.00";
  }
}

/*Actualiza los totales y el saldo al cargar la página*/
window.addEventListener("DOMContentLoaded", () => {
  mostrarTotales();
  mostrarSaldoFooter();
});

/*Muestra el día actual y lo guarda en localStorage*/
window.addEventListener("DOMContentLoaded", () => {
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const fecha = new Date();
  const diaTexto = dias[fecha.getDay()];
  const fechaTexto = fecha.toLocaleDateString("es-AR");

  let texto = localStorage.getItem("diaGuardado");

  /*Guarda la fecha solo si cambió el día*/
  if (!texto || texto !== `${diaTexto}, ${fechaTexto}`) {
    texto = `${diaTexto.charAt(0).toUpperCase() + diaTexto.slice(1)}, ${fechaTexto}`;
    localStorage.setItem("diaGuardado", texto);
  }

 /*Muestra el texto del día en la pantalla*/
  const el = document.getElementById("dia-hoy");
  if (el) el.textContent = `Hoy es ${texto}`;
});

