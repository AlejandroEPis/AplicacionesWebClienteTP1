import { API_TOKEN, BASE_ID } from "./environment.js";
import {
  TABLE_CLIENTES,
  TABLE_PROVEEDORES,
  TABLE_CCVENTAS,
  TABLE_CCCOMPRAS,
  TABLE_CAJA,
} from "./config.js";

const proxy = "http://localhost:8080/proxy?url=";

async function airtableRequest(tabla, method = "GET", data = null, recordId = "") {
  const airtableUrl = `https://api.airtable.com/v0/${BASE_ID}/${tabla}${recordId ? "/" + recordId : ""}`;
  const url = `${proxy}${encodeURIComponent(airtableUrl)}`;
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  if (data) options.body = JSON.stringify({ fields: data });
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return await res.json();
}

export const getClientes = async () => airtableRequest(TABLE_CLIENTES);
export const addCliente = async (data) => airtableRequest(TABLE_CLIENTES, "POST", data);
export const getProveedores = async () => airtableRequest(TABLE_PROVEEDORES);
export const addProveedor = async (data) => airtableRequest(TABLE_PROVEEDORES, "POST", data);
export const getCCVentas = async () => airtableRequest(TABLE_CCVENTAS);
export const addCCVenta = async (data) => airtableRequest(TABLE_CCVENTAS, "POST", data);
export const getCCCompras = async () => airtableRequest(TABLE_CCCOMPRAS);
export const addCCCompra = async (data) => airtableRequest(TABLE_CCCOMPRAS, "POST", data);
export const getCaja = async () => airtableRequest(TABLE_CAJA);
export const addCaja = async (data) => airtableRequest(TABLE_CAJA, "POST", data);

export const getUltimoRegistro = async (tabla) => {
  const airtableUrl = `https://api.airtable.com/v0/${BASE_ID}/${tabla}?sort[0][field]=Fecha&sort[0][direction]=desc&maxRecords=1`;
  const url = `${proxy}${encodeURIComponent(airtableUrl)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  return data.records.length > 0 ? data.records[0].fields : null;
};

export const getSaldoActual = async () => {
  const airtableUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_CAJA}?sort[0][field]=Fecha&sort[0][direction]=asc`;
  const url = `${proxy}${encodeURIComponent(airtableUrl)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  let saldo = 0;
  data.records.forEach((r) => {
    const mov = r.fields;
    saldo += (Number(mov.Ingreso) || 0) - (Number(mov.Egreso) || 0);
  });
  return saldo;
};
