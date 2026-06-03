import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';

const NEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsmHuNFq21hZNK1d-lekS443MWeyGwGhdL68qUEU1B1j6Hndf905KEFlQAKvh9rR1LOoRbA3XxZzBq/pub?gid=0&single=true&output=csv";

async function getNewsById(id) {
  try {
    // Usamos revalidate: 0 temporalmente para desarrollo. En producción cambiar a 600
    const res = await fetch(NEWS_CSV_URL, { next: { revalidate: 0 } }); 
    if (!res.ok) throw new Error("Error en el fetch");
    const text = await res.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    
    // Buscar la fila de la planilla cuyo "id" (el slug que generó el scraper) coincida con la URL
    return parsed.data.find(news => news.id === id) || null;
  } catch (error) {
    console.error(error);
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
