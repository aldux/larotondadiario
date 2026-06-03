import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Link from 'next/link';
import SubmitModalButton from "@/components/SubmitModalButton";

export const revalidate = 60; // Revalidate every 60 seconds

async function fetchComunidad() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Comunidad'];
    if (!sheet) return [];
    
    const rows = await sheet.getRows();
    return rows.map(row => {
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
    }).filter(r => r.estado === 'Aprobado');
  } catch (error) {
    console.error("Error fetching comunidad:", error);
    return [];
  }
}

export default async function ComunidadPage() {
  const data = await fetchComunidad();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-rotonda-green-dark dark:text-rotonda-gold border-b-4 border-rotonda-gold inline-block pb-1">
          Comunidad San Rafael
        </h1>
        <SubmitModalButton seccion="Comunidad" label="Subir un reporte" />
      </div>

      <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
        El espacio de periodismo ciudadano y ayuda vecinal. Publicá noticias locales, objetos perdidos, reclamos o eventos de tu barrio.
      </p>

      {data.length === 0 ? (
        <div className="w-full p-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Sé el primero en compartir algo con la comunidad.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {data.map((item, index) => (
            <article key={item.id || index} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-800 transition-all">
              <Link href={item.id ? `/comunidad/${item.id}` : '#'} className="p-6 flex flex-col md:flex-row gap-6 w-full h-full cursor-pointer">
              {item.imagen_url && (
                <div className="w-full md:w-1/3 aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden shrink-0">
                  <img src={item.imagen_url} alt={item.titulo} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex flex-col flex-grow justify-center">
                <span className="text-xs font-bold uppercase tracking-wider text-rotonda-gold mb-2">
                  {item.tipo} • {item.fecha}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                  {item.titulo}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                  {item.descripcion}
                </p>
              </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
