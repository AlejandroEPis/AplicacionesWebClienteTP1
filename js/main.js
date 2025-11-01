/*Animacion Menu Hamburgesa */
const botonMenu = document.querySelector(".meHam");
const menu = document.querySelector("nav ul");
botonMenu.addEventListener("click", toggleMenu)

function toggleMenu(){
    menu.classList.toggle("abierto")
}
botonMenu.addEventListener("click", toggleMenu);

/*Detector de pagina activa */
const indicadorPagina = document.querySelectorAll("nav ul li a");
const paginaActual =window.location.pathname;

indicadorPagina.forEach(link=> {
    if (paginaActual.includes(link.getAttribute("href"))){
        link.classList.add("activo")
    }
});

/*Panel animacion*/
const panelBotones = document.querySelectorAll(".mPan a")

panelBotones.forEach((boton, index) => {
  setTimeout(() => {
    boton.classList.add("visible");
  }, index * 200);
});

/*Muestra aside*/
import { BASE_ID, API_TOKEN } from "./environment.js";
import { TABLE_CCVENTAS, TABLE_CCCOMPRAS } from "./config.js";

const proxy = "https://cors-anywhere.herokuapp.com/";


async function getUltimoRegistro(tabla) {
  const url = `${proxy}https://api.airtable.com/v0/${BASE_ID}/${tabla}?sort[0][field]=Fecha&sort[0][direction]=desc&maxRecords=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.records.length > 0 ? data.records[0].fields : null;
}

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
    } else {
      ventaNombre.textContent = "Sin ventas registradas";
      ventaImporte.textContent = "";
    }

    // 🔹 Compra
    const compraNombre = document.querySelector("aside h3:nth-of-type(2) + p");
    const compraImporte = document.querySelector("aside h3:nth-of-type(2) + p + p");

    if (ultimaCompra) {
      compraNombre.textContent = ultimaCompra.Proveedor || "—";
      compraImporte.textContent = `$${ultimaCompra.Egreso || 0}`;
    } else {
      compraNombre.textContent = "Sin compras registradas";
      compraImporte.textContent = "";
    }

  } catch (error) {
    console.error("Error al cargar el aside:", error);
  }
}

mostrarUltimosMovimientos();

/*Saldo en footer*/
import { BASE_ID, API_TOKEN } from "./environment.js";
import { TABLE_CAJA } from "./config.js";

async function getSaldoActual() {
  const proxy = "https://cors-anywhere.herokuapp.com/";
  const url = `${proxy}https://api.airtable.com/v0/${BASE_ID}/${TABLE_CAJA}?sort[0][field]=Fecha&sort[0][direction]=asc`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data = await res.json();

    let saldo = 0;
    data.records.forEach((r) => {
      const mov = r.fields;
      saldo += (Number(mov.Ingreso) || 0) - (Number(mov.Egreso) || 0);
    });

    const celdaFooter = document.getElementById("saldo-footer");
    if (celdaFooter) celdaFooter.textContent = `$ ${saldo.toFixed(2)}`;
  } catch (err) {
    console.error("Error al obtener saldo:", err);
  }
}

getSaldoActual();