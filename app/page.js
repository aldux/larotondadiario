import Link from "next/link";
import NewsCard from "@/components/NewsCard";
import ClassifiedCard from "@/components/ClassifiedCard";
import Papa from "papaparse";
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const NEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsmHuNFq21hZNK1d-lekS443MWeyGwGhdL68qUEU1B1j6Hndf905KEFlQAKvh9rR1LOoRbA3XxZzBq/pub?gid=0&single=true&output=csv";

async function fetchCSVData(url) {
  try {
    // Para ver los cambios al instante durante el desarrollo, lo ponemos en 0. 
    // Para producción, se recomienda volver a poner 600 (10 minutos).
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      throw new Error(`Error al traer datos: ${res.statusText}`);
    }
    const csvText = await res.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    return parsed.data;
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}
async function fetchClasificados() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Clasificados'];
    if (!sheet) return [];
    const rows = await sheet.getRows();
    return rows.map(row => {
      const arr = row._rawData || [];
      return {
        id: arr[0],
        fecha: arr[1],
        titulo: arr[2],
        descripcion: arr[3],
        contacto: arr[4],
        imagen_url: arr[5],
        estado: arr[6]
      };
    }).filter(r => r.estado === 'Aprobado');
  } catch (error) {
    console.error("Error fetching clasificados:", error);
    return [];
  }
}

export default async function Home() {
  const [newsData, classifiedsData] = await Promise.all([
    fetchCSVData(NEWS_CSV_URL),
    fetchClasificados()
  ]);

  return (
    <>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Feed de Noticias (70%) */}
          <div className="md:col-span-8 lg:col-span-8 flex flex-col">
            <h1 className="text-3xl font-extrabold mb-6 text-rotonda-green-dark dark:text-rotonda-gold border-b-4 border-rotonda-gold inline-block pb-1">Últimas Noticias</h1>
            
            {newsData.length === 0 ? (
              <div className="w-full p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 font-medium">No hay publicaciones recientes</p>
              </div>
            ) : (
              newsData.map((news, index) => {
                const showAd = index > 0 && index % 3 === 0;
                return (
                  <div key={news.id || index}>
                    {showAd && (
                      <div className="w-full min-h-[120px] bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                        <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">
                          Espacio Publicitario (AdSense In-Feed)
                        </span>
                      </div>
                    )}
                    <NewsCard 
                      title={news.titulo || news.title || "Sin título"}
                      summary={news.copete || news.summary}
                      image={news.imagen_url || news.image}
                      link={news.id ? `/noticias/${news.id}` : (news.link_original || news.link)}
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Clasificados (30%) */}
          <aside className="md:col-span-4 lg:col-span-4">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-rotonda-green-dark dark:text-rotonda-gold">Clasificados</h2>
                <Link href="/clasificados" className="text-sm font-bold text-rotonda-gold hover:text-rotonda-gold-dark cursor-pointer transition-colors">Ver todos</Link>
              </div>
              
              <div className="flex flex-col gap-1">
                {classifiedsData.length === 0 ? (
                  <div className="w-full p-6 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No hay publicaciones recientes</p>
                  </div>
                ) : (
                  classifiedsData.map((item, index) => (
                    <ClassifiedCard 
                      key={item.id || index}
                      id={item.id}
                      title={item.titulo}
                      price={item.descripcion}
                      contact={item.contacto}
                      image={item.imagen_url}
                    />
                  ))
                )}
              </div>
              
              <div className="mt-6 p-6 bg-rotonda-green-dark dark:bg-slate-900 rounded-xl border border-rotonda-green text-center shadow-lg">
                <h4 className="font-bold text-white mb-2">¿Querés vender algo?</h4>
                <p className="text-sm text-green-100 dark:text-gray-400 mb-4">Publicá tu artículo gratis y llegá a toda la ciudad hoy mismo.</p>
                <Link href="/clasificados" className="block text-center w-full bg-rotonda-gold hover:bg-rotonda-gold-dark text-white font-bold py-2 rounded-lg transition-colors shadow-md">
                  Crear publicación
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
