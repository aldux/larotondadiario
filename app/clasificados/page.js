import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import ClassifiedCard from "@/components/ClassifiedCard";
import SubmitModalButton from "@/components/SubmitModalButton";

export const revalidate = 60; // Revalidate every 60 seconds

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
    }).filter(r => r.estado && r.estado.trim().toLowerCase() === 'aprobado');
  } catch (error) {
    console.error("Error fetching clasificados:", error);
    return [];
  }
}

export default async function ClasificadosPage() {
  const data = await fetchClasificados();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-rotonda-green-dark dark:text-rotonda-gold border-b-4 border-rotonda-gold inline-block pb-1">
          Clasificados Locales
        </h1>
        <SubmitModalButton seccion="Clasificados" label="Publicar un aviso" />
      </div>

      {data.length === 0 ? (
        <div className="w-full p-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Aún no hay avisos publicados o están pendientes de aprobación.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((item, index) => (
            <ClassifiedCard 
              key={item.id || index}
              id={item.id}
              title={item.titulo}
              price={item.descripcion} // Reusing the description for price/details in the card
              image={item.imagen_url}
              contact={item.contacto}
            />
          ))}
        </div>
      )}
    </main>
  );
}
