import { API_TOKEN, BASE_ID } from "./environment.js";
import { TABLE_CCVENTAS, TABLE_CCCOMPRAS, TABLE_CAJA } from "./config.js";

const proxy = "http://localhost:8080/proxy?url=";

async function airtableRequest(tabla) {
  const airtableUrl = `https://api.airtable.com/v0/${BASE_ID}/${tabla}`;
  const url = `${proxy}${encodeURIComponent(airtableUrl)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return await res.json();
}

export const getTotalVentas = async () => {
  const data = await airtableRequest(TABLE_CCVENTAS);
  return data.records.reduce((t, r) => t + (r.fields.Ingreso || 0), 0);
};

export const getTotalCompras = async () => {
  const data = await airtableRequest(TABLE_CCCOMPRAS);
  return data.records.reduce((t, r) => t + (r.fields.Egreso || 0), 0);
};

export const getSaldoActual = async () => {
  const airtableUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_CAJA}?sort[0][field]=Fecha&sort[0][direction]=desc&maxRecords=1`;
  const url = `${proxy}${encodeURIComponent(airtableUrl)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_TOKEN}` } });
  const data = await res.json();
  if (data.records.length === 0) return 0;
  const registro = data.records[0].fields;
  return Number(registro.Cálculo ?? registro.Saldo ?? 0);
};

