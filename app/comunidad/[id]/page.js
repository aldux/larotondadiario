import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Link from 'next/link';

export const revalidate = 60;

async function fetchComunidadItem(id) {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Comunidad'];
    if (!sheet) return null;
    
    const rows = await sheet.getRows();
    const item = rows.map(row => {
      const arr = row._rawData || [];
      return {
        id: arr[0],
        fecha: arr[1],
        tipo: arr[2],
        titulo: arr[3],
        descripcion: arr[4],
        imagen_url: arr[5],
        estado: arr[6]
      };
    }).find(r => r.id === id);
    return item || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function ComunidadDetail({ params }) {
  const resolvedParams = await params;
  const item = await fetchComunidadItem(resolvedParams.id);

  if (!item) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Publicación no encontrada</h1>
        <p className="mb-6">El reporte o noticia que buscas no existe o fue eliminado.</p>
        <Link href="/comunidad" className="text-rotonda-gold underline">Volver a la comunidad</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/comunidad" className="text-sm text-rotonda-gold font-bold mb-6 inline-block">
        ← Volver a Comunidad
      </Link>
      <article className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-800">
        {item.imagen_url && (
          <div className="w-full h-80 bg-gray-100 dark:bg-gray-800">
            <img src={item.imagen_url} alt={item.titulo} className="w-full h-full object-contain" />
          </div>
        )}
        <div className="p-8">
          <span className="text-sm font-bold uppercase tracking-wider text-rotonda-gold mb-2 block">
            {item.tipo} • {item.fecha}
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
            {item.titulo}
          </h1>
          <div className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
            {item.descripcion}
          </div>
        </div>
      </article>
    </main>
  );
}
