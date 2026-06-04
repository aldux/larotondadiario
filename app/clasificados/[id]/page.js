import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Link from 'next/link';
import { auth } from "@/auth";
import { marcarComoVendido } from "@/app/actions/clasificados";

export const revalidate = 60;

async function fetchClasificado(id) {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Clasificados'];
    if (!sheet) return null;
    
    const rows = await sheet.getRows();
    const item = rows.map(row => {
      const arr = row._rawData || [];
      return {
        id: arr[0],
        fecha: arr[1],
        titulo: arr[2],
        descripcion: arr[3],
        contacto: arr[4],
        imagen_url: arr[5],
        estado: arr[6],
        autorEmail: arr[7]
      };
    }).find(r => r.id === id);
    return item || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function ClasificadoDetail({ params }) {
  const resolvedParams = await params;
  const item = await fetchClasificado(resolvedParams.id);
  const session = await auth();

  if (!item) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Aviso no encontrado</h1>
        <p className="mb-6">El aviso que buscas no existe o fue eliminado.</p>
        <Link href="/clasificados" className="text-rotonda-gold underline">Volver a clasificados</Link>
      </main>
    );
  }

  const esElDueño = session?.user?.email && item.autorEmail === session.user.email;
  const estaVendido = item.estado === "VENDIDO" || item.estado === "Vendido";

  const cleanContact = item.contacto ? item.contacto.replace(/\D/g, '') : '';
  const waLink = cleanContact ? `https://wa.me/${cleanContact}?text=Hola, vi tu aviso en La Rotonda sobre: ${encodeURIComponent(item.titulo)}` : '#';

  const handleMarcarVendido = async () => {
    "use server"
    await marcarComoVendido(item.id);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/clasificados" className="text-sm text-rotonda-gold font-bold mb-6 inline-block">
        ← Volver a Clasificados
      </Link>
      <article className="relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-800">
        
        {estaVendido && (
          <div className="absolute top-4 right-4 z-10 bg-red-600 text-white font-black text-xl px-6 py-2 rounded-full shadow-lg transform rotate-12 border-4 border-white dark:border-slate-900">
            ¡VENDIDO!
          </div>
        )}

        {item.imagen_url && (
          <div className={`w-full h-80 bg-gray-100 dark:bg-gray-800 ${estaVendido ? 'opacity-60 grayscale' : ''}`}>
            <img src={item.imagen_url} alt={item.titulo} className="w-full h-full object-contain" />
          </div>
        )}
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-500 block">{item.fecha}</span>
            
            {esElDueño && !estaVendido && (
              <form action={handleMarcarVendido}>
                <button 
                  type="submit" 
                  className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-1.5 px-4 rounded-full text-sm border border-red-200 transition-colors shadow-sm"
                >
                  Marcar como Vendido
                </button>
              </form>
            )}
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
            {item.titulo}
          </h1>
          <div className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap mb-8">
            {item.descripcion}
          </div>
          
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <h3 className="font-bold mb-4">Contacto</h3>
            {estaVendido ? (
              <p className="text-red-600 font-bold bg-red-50 p-4 rounded-lg inline-block">
                🚫 Este artículo ya fue vendido.
              </p>
            ) : cleanContact ? (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5A] text-white font-medium py-3 px-6 rounded-lg transition-colors text-lg shadow-sm">
                Contactar por WhatsApp al {item.contacto}
              </a>
            ) : (
              <p className="text-gray-500">Sin información de contacto.</p>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
