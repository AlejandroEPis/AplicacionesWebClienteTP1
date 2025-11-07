import { getCaja, addCaja } from "./api.js";

const btnCargar = document.getElementById("btn-cargar");
const btnAgregar = document.getElementById("btn-agregar");
const tablaBody = document.getElementById("tabla-body");

btnCargar.addEventListener("click", async () => {
  tablaBody.innerHTML = "<tr><td colspan='3'>Cargando...</td></tr>";

  try {
    const data = await getCaja();
    tablaBody.innerHTML = "";

    data.records.forEach((r) => {
      const mov = r.fields;
      const fila = `
        <tr>
          <td>${mov.Fecha || ""}</td>
          <td>${mov.Ingreso || 0}</td>
          <td>${mov.Egreso || 0}</td>
        </tr>`;
      tablaBody.insertAdjacentHTML("beforeend", fila);
    });
  } catch (err) {
    tablaBody.innerHTML = `<tr><td colspan='3' style="color:red">Error: ${err.message}</td></tr>`;
  }
});

btnAgregar.addEventListener("click", async () => {
  const nuevo = {
    Fecha: new Date().toISOString().split("T")[0],
    Ingreso: Math.floor(Math.random() * 1000),
    Egreso: 0,
  };

  try {
    await addCaja(nuevo);
    alert("✅ Registro agregado con éxito");
    btnCargar.click(); // recarga la tabla
  } catch (err) {
    alert("❌ Error al agregar: " + err.message);
  }
});
