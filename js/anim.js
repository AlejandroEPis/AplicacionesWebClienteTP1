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