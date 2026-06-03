import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Papa from 'papaparse';

const NEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsmHuNFq21hZNK1d-lekS443MWeyGwGhdL68qUEU1B1j6Hndf905KEFlQAKvh9rR1LOoRbA3XxZzBq/pub?gid=0&single=true&output=csv";

export default async function sitemap() {
  // Configura aquí tu dominio final si compras un .com
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://larotondadiario.vercel.app'; 

  const sitemapEntries = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/clasificados`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/comunidad`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    }
  ];

  // 1. Mapeo de Noticias (CSV)
  try {
    const res = await fetch(NEWS_CSV_URL, { next: { revalidate: 3600 } });
    if (res.ok) {
      const text = await res.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      parsed.data.forEach(news => {
        if (news.id) {
          sitemapEntries.push({
            url: `${baseUrl}/noticias/${news.id}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
          });
        }
      });
    }
  } catch (error) {
    console.error("Error fetching news for sitemap:", error);
  }

  // 2. Mapeo de Clasificados y Comunidad aprobados (Google Sheets API)
  try {
    if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
      await doc.loadInfo();

      // Clasificados
      const sheetClasificados = doc.sheetsByTitle['Clasificados'];
      if (sheetClasificados) {
        const rows = await sheetClasificados.getRows();
        rows.map(row => {
          const arr = row._rawData || [];
          return { id: arr[0], estado: arr[6] };
        }).filter(r => r.estado === 'Aprobado' && r.id).forEach(item => {
          sitemapEntries.push({
            url: `${baseUrl}/clasificados/${item.id}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.6,
          });
        });
      }

      // Comunidad
      const sheetComunidad = doc.sheetsByTitle['Comunidad'];
      if (sheetComunidad) {
        const rows = await sheetComunidad.getRows();
        rows.map(row => {
          const arr = row._rawData || [];
          return { id: arr[0], estado: arr[6] };
        }).filter(r => r.estado === 'Aprobado' && r.id).forEach(item => {
          sitemapEntries.push({
            url: `${baseUrl}/comunidad/${item.id}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.6,
          });
        });
      }
    }
  } catch (error) {
    console.error("Error fetching sheets for sitemap:", error);
  }

  return sitemapEntries;
}
