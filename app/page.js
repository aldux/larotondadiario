import Link from "next/link";
import NewsCard from "@/components/NewsCard";
import ClassifiedCard from "@/components/ClassifiedCard";
import Papa from "papaparse";
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { auth } from "@/auth";
import GoogleLoginButton from "@/components/GoogleLoginButton";

async function fetchNoticias() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Noticias'] || doc.sheetsByIndex[0];
    if (!sheet) return [];
    
    // Obtenemos las filas. El límite por defecto es suficiente para las notas recientes
    const rows = await sheet.getRows({ offset: Math.max(0, sheet.rowCount - 200), limit: 200 }); 
    
    return rows.map(row => {
      return {
        id: row.get('id'),
        titulo: row.get('titulo'),
        copete: row.get('copete'),
        imagen_url: row.get('imagen_url'),
        link_original: row.get('link_original'),
        categoria: row.get('categoria'),
        cuerpo_noticia: row.get('cuerpo_noticia')
      };
    }).filter(n => n.id && n.titulo).reverse();
  } catch (error) {
    console.error("Error fetching noticias:", error);
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
    }).filter(r => r.estado && r.estado.trim().toLowerCase() === 'aprobado').reverse();
  } catch (error) {
    console.error("Error fetching clasificados:", error);
    return [];
  }
}

export default async function Home() {
  const [newsData, classifiedsData, session] = await Promise.all([
    fetchNoticias(),
    fetchClasificados(),
    auth()
  ]);

  return (
    <>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Feed de Noticias (70%) */}
          <div className="md:col-span-8 lg:col-span-8 flex flex-col">
            
            {/* Sección Locales */}
            <h1 id="locales" className="text-3xl font-extrabold mb-6 text-rotonda-green-dark dark:text-rotonda-gold border-b-4 border-rotonda-gold inline-block pb-1 scroll-mt-20">Noticias Locales</h1>
            
            {newsData.filter(n => n.categoria === 'Local' || !n.categoria).length === 0 ? (
              <div className="w-full p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 mb-10">
                <p className="text-gray-500 dark:text-gray-400 font-medium">No hay noticias locales recientes</p>
              </div>
            ) : (
              newsData.filter(n => n.categoria === 'Local' || !n.categoria).map((news, index) => {
                const showAd = index > 0 && index % 4 === 0;
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

            {/* Sección Nacionales */}
            <h1 id="nacionales" className="text-3xl font-extrabold mt-10 mb-6 text-rotonda-green-dark dark:text-rotonda-gold border-b-4 border-rotonda-gold inline-block pb-1 scroll-mt-20">Noticias Nacionales</h1>
            
            {newsData.filter(n => n.categoria === 'Nacional').length === 0 ? (
              <div className="w-full p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 font-medium">No hay noticias nacionales recientes</p>
              </div>
            ) : (
              newsData.filter(n => n.categoria === 'Nacional').map((news, index) => {
                const showAd = index > 0 && index % 4 === 0;
                return (
                  <div key={`nac-${news.id || index}`}>
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
              
              <div className="mt-6 p-6 bg-rotonda-green-dark dark:bg-slate-900 rounded-xl border border-rotonda-green text-center shadow-lg flex flex-col items-center">
                <h4 className="font-bold text-white mb-2">¿Querés vender algo?</h4>
                <p className="text-sm text-green-100 dark:text-gray-400 mb-4">Publicá tu artículo gratis y llegá a toda la ciudad hoy mismo.</p>
                {!session?.user ? (
                  <div className="w-full flex flex-col items-center gap-3 mt-2">
                    <span className="text-sm text-green-200 font-medium">Registrate con un click para vender:</span>
                    <GoogleLoginButton />
                  </div>
                ) : (
                  <Link href="/clasificados" className="block text-center w-full bg-rotonda-gold hover:bg-rotonda-gold-dark text-white font-bold py-2 rounded-lg transition-colors shadow-md">
                    Crear publicación
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
