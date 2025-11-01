// ==================== CONEXIÓN GENERAL CON AIRTABLE ====================
import { API_TOKEN, BASE_ID } from "./environment.js";
import {
  TABLE_CLIENTES,
  TABLE_PROVEEDORES,
  TABLE_CCVENTAS,
  TABLE_CCCOMPRAS,
  TABLE_CAJA,
} from "./config.js";

const proxy = "https://cors-anywhere.herokuapp.com/"; // evita error CORS

// ==================== FUNCIÓN BASE ====================
async function airtableRequest(tabla, method = "GET", data = null, recordId = "") {
  const url = `${proxy}https://api.airtable.com/v0/${BASE_ID}/${tabla}${recordId ? "/" + recordId : ""}`;

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

// ==================== MAPEADOR ====================
const mapRecords = (data) => data.records.map((r) => ({ id: r.id, ...r.fields }));

// ==================== FUNCIONES ESPECÍFICAS ====================
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

// ==================== FUNCIONES PARA MAIN.JS (ASIDE Y FOOTER) ====================

// 🔹 Trae el último registro (venta o compra)
export const getUltimoRegistro = async (tabla) => {
  const url = `${proxy}https://api.airtable.com/v0/${BASE_ID}/${tabla}?sort[0][field]=Fecha&sort[0][direction]=desc&maxRecords=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const data = await res.json();
  return data.records.length > 0 ? data.records[0].fields : null;
};

// 🔹 Calcula el saldo total de la tabla Caja
export const getSaldoActual = async () => {
  const url = `${proxy}https://api.airtable.com/v0/${BASE_ID}/${TABLE_CAJA}?sort[0][field]=Fecha&sort[0][direction]=asc`;
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
