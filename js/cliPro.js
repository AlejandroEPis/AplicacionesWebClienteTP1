import { addCliente, addProveedor } from "./main.js";
import { TABLE_CLIENTES, TABLE_PROVEEDORES } from "./config.js";

/*Tabla cliente*/
const formCliente = document.querySelector(".taClPr");

formCliente.addEventListener("submit", async (e) => {
  e.preventDefault();

   const nombre = document.getElementById("nfan").value;
  const cuit = document.getElementById("cuit").value;
  const cIVA = document.getElementById("cIVA").value;
  const dcom = document.getElementById("dcom").value;
  const tel = document.getElementById("tel").value;
  const mail = document.getElementById("mail").value;


  const nuevoCliente = {
    Nombre: nombre,
    CUIT: cuit,
    CondicionIVA: cIVA,
    Domicilio: dcom,
    Telefono: tel,
    Mail: mail,
  };

  try {
    await addCliente(nuevoCliente);
    alert("Cliente agregado con éxito");
    formCliente.reset();
  } catch (err) {
    console.error(err);
    alert(" Error al guardar cliente");
  }
});
/*Tabla provedor*/
const formProveedor = document.querySelector(".taClPro");

formProveedor.addEventListener("submit", async (e) => {
  e.preventDefault();

  const razonSocial = document.getElementById("rsoper").value;
  const cuit = document.querySelector(".taClPro #cuit").value;
  const cIVA = document.querySelector(".taClPro #cIVA").value;
  const dcom = document.querySelector(".taClPro #dcom").value;
  const tel = document.querySelector(".taClPro #tel").value;
  const mail = document.querySelector(".taClPro #mail").value;

  const nuevoProveedor = {
    RazonSocial: razonSocial,
    CUIT: cuit,
    CondicionIVA: cIVA,
    Domicilio: dcom,
    Telefono: tel,
    Mail: mail,
  };

  try {
    await addProveedor(nuevoProveedor);
    alert("Proveedor agregado con éxito");
    formProveedor.reset();
  } catch (err) {
    console.error(err);
    alert("Error al guardar proveedor");
  }
});

