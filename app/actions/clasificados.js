"use server"

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function marcarComoVendido(clasificadoId) {
  const session = await auth();
  
  if (!session?.user?.email) {
    throw new Error("No estás autenticado.");
  }

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle['Clasificados'];
  
  if (!sheet) throw new Error("No se encontró la pestaña Clasificados en Google Sheets.");

  const rows = await sheet.getRows();
  const rowToUpdate = rows.find(r => {
    const arr = r._rawData || [];
    return arr[0] === clasificadoId;
  });

  if (!rowToUpdate) {
    throw new Error("El clasificado no existe.");
  }

  const autorEmail = rowToUpdate._rawData[7] || '';

  if (autorEmail !== session.user.email) {
    throw new Error("No tienes permisos para modificar este clasificado.");
  }

  // Actualizamos el estado. Buscamos el header de la columna 6 o hacemos fallback al rawData.
  await sheet.loadHeaderRow();
  const headerEstado = sheet.headerValues[6];
  if (headerEstado) {
      rowToUpdate.assign({ [headerEstado]: "VENDIDO" });
      await rowToUpdate.save();
  } else {
      rowToUpdate._rawData[6] = "VENDIDO";
      await rowToUpdate.save();
  }

  // Revalidar para actualizar la vista inmediatamente
  revalidatePath(`/clasificados/${clasificadoId}`);
  revalidatePath("/clasificados");
  
  return { success: true };
}
