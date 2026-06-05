import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function getNewsById(id) {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Noticias'] || doc.sheetsByIndex[0];
    if (!sheet) return null;
    
    // Obtenemos solo las ultimas 300 para no hacer lenta la busqueda, el id suele estar entre las recientes
    const rows = await sheet.getRows({ offset: Math.max(0, sheet.rowCount - 300), limit: 300 }); 
    const targetRow = rows.find(row => row.get('id') === id);
    
    if (!targetRow) return null;
    
    return {
      id: targetRow.get('id'),
      titulo: targetRow.get('titulo'),
      copete: targetRow.get('copete'),
      imagen_url: targetRow.get('imagen_url'),
      link_original: targetRow.get('link_original'),
      categoria: targetRow.get('categoria'),
      cuerpo_noticia: targetRow.get('cuerpo_noticia')
    };
  } catch (error) {
    console.error("Error en getNewsById:", error);
    return null;
  }
}

// Next.js 15: params es una Promesa
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const news = await getNewsById(resolvedParams.id);

  if (!news) {
    return {
      title: 'Noticia no encontrada | La Rotonda',
    };
  }

  return {
    title: `${news.titulo} | La Rotonda`,
    description: news.copete || "Lee la noticia completa en La Rotonda, el diario digital de San Rafael.",
    openGraph: {
      title: `${news.titulo} | La Rotonda`,
      description: news.copete || "Lee la noticia completa en La Rotonda.",
      images: news.imagen_url ? [{ url: news.imagen_url }] : [],
    },
  };
}

export default async function NewsArticle({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const news = await getNewsById(id);

  if (!news) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Noticia no encontrada</h1>
        <Link href="/" className="text-orange-500 hover:text-orange-600 font-medium underline transition-colors">Volver a la portada</Link>
      </div>
    );
  }

  const titulo = news.titulo || "Sin título";
  const imagen = news.imagen_url || "";
  // Si no completaste el cuerpo en la planilla, usamos el copete para rellenar
  const contenido = news.cuerpo_noticia || news.copete || "";

  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0a0a] pb-16">
      <div className="mx-auto max-w-3xl px-4 py-8">
        
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-500 font-medium mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Volver a la portada
        </Link>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-8">
          {titulo}
        </h1>

        {/* AdSense Top */}
        <div className="w-full min-h-[100px] bg-gray-100 dark:bg-gray-800 rounded-xl mb-8 flex items-center justify-center border border-gray-200 dark:border-gray-700">
          <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">
            Espacio Publicitario (AdSense In-Article)
          </span>
        </div>

        {imagen && (
          <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden mb-8 bg-gray-200 dark:bg-gray-800">
            <img src={imagen} alt={titulo} className="w-full h-full object-cover" />
          </div>
        )}

        <article className="prose prose-lg dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed">
          {contenido.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-6">{paragraph}</p>
          ))}
        </article>

        {/* AdSense Bottom */}
        <div className="w-full min-h-[100px] bg-gray-100 dark:bg-gray-800 rounded-xl mt-12 flex items-center justify-center border border-gray-200 dark:border-gray-700">
          <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">
            Espacio Publicitario (AdSense In-Article)
          </span>
        </div>

      </div>
    </main>
  );
}
