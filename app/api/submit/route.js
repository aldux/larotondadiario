import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function POST(request) {
  try {
    const data = await request.json();
    const { seccion, formValues } = data;

    if (!seccion || !formValues) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Autenticación con Google
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      console.error('Faltan credenciales de Google en las variables de entorno.');
      return NextResponse.json({ error: 'Faltan credenciales de Google en el servidor. Revisa Vercel.' }, { status: 500 });
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    // Seleccionar la pestaña correcta
    let sheet = doc.sheetsByTitle[seccion];

    if (!sheet) {
      return NextResponse.json({ error: `La pestaña '${seccion}' no existe en la planilla.` }, { status: 500 });
    }

    // Generar ID único y Fecha
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const fecha = new Date().toLocaleDateString('es-AR');

    let newRowArray = [];
    if (seccion === 'Clasificados') {
      // id, fecha, titulo, descripcion, contacto, imagen_url, estado
      newRowArray = [
        id,
        fecha,
        formValues.titulo || '',
        formValues.descripcion || '',
        formValues.contacto || '',
        formValues.imagen_url || '',
        'Pendiente'
      ];
    } else if (seccion === 'Comunidad') {
      // id, fecha, tipo, titulo, descripcion, imagen_url, estado
      newRowArray = [
        id,
        fecha,
        formValues.tipo || '',
        formValues.titulo || '',
        formValues.descripcion || '',
        formValues.imagen_url || '',
        'Pendiente'
      ];
    }

    await sheet.addRow(newRowArray);

    return NextResponse.json({ success: true, message: 'Datos guardados correctamente en pendiente' });
  } catch (error) {
    console.error('Error en la API de carga:', error);
    return NextResponse.json({ error: 'Error interno: ' + error.message }, { status: 500 });
  }
}
