import { API_TOKEN, BASE_ID } from "./environment.js";
import {
  TABLE_CLIENTES,
  TABLE_PROVEEDORES,
  TABLE_CCVENTAS,
  TABLE_CCCOMPRAS,
  TABLE_CAJA
} from "./config.js";

async function airtableRequest(tabla, method = "GET", data = null, recordId = "") {
  const proxy = "https://cors-anywhere.herokuapp.com/"; // evita error CORS
  const url = `${proxy}https://api.airtable.com/v0/${BASE_ID}/${tabla}${recordId ? "/" + recordId : ""}`;

  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json"
    }
  };

  if (data) options.body = JSON.stringify({ fields: data });

  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return await res.json();
}

// Funciones específicas
const mapRecords = (data) => data.records.map(r => ({ id: r.id, ...r.fields }));

export const getClientes = async () => mapRecords(await airtableRequest(TABLE_CLIENTES));
export const addCliente = async (data) => airtableRequest(TABLE_CLIENTES, "POST", data);

export const getProveedores = async () => mapRecords(await airtableRequest(TABLE_PROVEEDORES));
export const addProveedor = async (data) => airtableRequest(TABLE_PROVEEDORES, "POST", data);

export const getCCVentas = async () => mapRecords(await airtableRequest(TABLE_CCVENTAS));
export const addCCVenta = async (data) => airtableRequest(TABLE_CCVENTAS, "POST", data);

export const getCCCompras = async () => mapRecords(await airtableRequest(TABLE_CCCOMPRAS));
export const addCCCompra = async (data) => airtableRequest(TABLE_CCCOMPRAS, "POST", data);

export const getCaja = async () => mapRecords(await airtableRequest(TABLE_CAJA));
export const addCaja = async (data) => airtableRequest(TABLE_CAJA, "POST", data);
