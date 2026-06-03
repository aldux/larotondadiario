require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. CONFIGURACIÓN DE IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// 2. CONFIGURACIÓN DE FUENTES
const SOURCES = [
  // --- NOTICIAS LOCALES (San Rafael y Sur de Mendoza) ---
  { url: 'https://diariosanrafael.com.ar/categoria/locales/', categoria: 'Local', usaIA: true },
  { url: 'https://www.mediamendoza.com/seccion/san-rafael', categoria: 'Local', usaIA: true },
  { url: 'https://www.sitioandino.com.ar/seccion/san-rafael/', categoria: 'Local', usaIA: true },
  { url: 'https://infoya.com.ar/seccion/san-rafael/', categoria: 'Local', usaIA: true },

  // --- NOTICIAS NACIONALES (Argentina) ---
  { url: 'https://www.infobae.com/politica/', categoria: 'Nacional', usaIA: false },
  { url: 'https://tn.com.ar/politica/', categoria: 'Nacional', usaIA: false }
];

// Configuración de Google Sheets
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : '', 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

// Función para extraer texto puro del enlace de la noticia
async function extractBody(url) {
  try {
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    const ps = [];
    $('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 50) ps.push(text);
    });
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    return { bodyText: ps.join('\n\n'), ogImage };
  } catch (error) {
    console.error(`Error extrayendo cuerpo de ${url}: ${error.message}`);
    return { bodyText: '', ogImage: '' };
  }
}

// Función para usar Gemini AI y reescribir la nota
async function rewriteNewsWithAI(originalText) {
  if (!originalText || originalText.length < 100) return originalText;
  
  try {
    const prompt = `Actúa como un periodista experto. Reescribe la siguiente noticia de forma neutral, original y sin alterar los datos factuales. Redacta entre 3 y 4 párrafos usando un lenguaje profesional. No incluyas comentarios extra, solo devuelve el texto reescrito.
Noticia original:
${originalText.substring(0, 5000)}
`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error en Gemini AI:", error.message);
    return originalText; // Si falla la IA, nos aseguramos de guardar la nota original
  }
}

// Lógica principal
async function runScraper() {
  try {
    console.log('Conectando a Google Sheets...');
    await doc.loadInfo(); 
    const sheet = doc.sheetsByTitle['Noticias'] || doc.sheetsByIndex[0];
    
    console.log('Obteniendo filas para evitar duplicados históricos...');
    const rows = await sheet.getRows();
    const existingTitles = new Set(rows.map(row => row.get('titulo'))); 
    
    const scrapedMap = new Map();

    // PASO A: RECORRER TODAS LAS FUENTES
    for (const source of SOURCES) {
      console.log(`Buscando en ${source.url} (${source.categoria})...`);
      try {
        const { data: html } = await axios.get(source.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(html);
        
        // Selectores amplios para atrapar artículos en diferentes maquetaciones de medios
        $('article, .article, .card, .nota').each((index, element) => {
          const title = $(element).find('h1, h2, h3').first().text().trim();
          const summary = $(element).find('p').first().text().trim() || '';
          let image_url = $(element).find('img').attr('src') || $(element).find('img').attr('data-src') || $(element).find('img').attr('data-lazy-src') || '';
          if (image_url.startsWith('data:image')) {
            image_url = $(element).find('img').attr('data-src') || $(element).find('img').attr('data-lazy-src') || '';
          }
          if (image_url && !image_url.startsWith('http')) {
             if (image_url.startsWith('//')) image_url = 'https:' + image_url;
             else image_url = new URL(image_url, source.url).href;
          }
          const link_original = $(element).find('a').first().attr('href');
          
          if (!title || !link_original) return;

          const full_link = link_original && !link_original.startsWith('http') 
            ? new URL(link_original, source.url).href 
            : link_original;

          const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

          // Guardamos en un mapa para evitar duplicados en el mismo sitio
          if (!existingTitles.has(title)) {
            if (scrapedMap.has(title)) {
              const existing = scrapedMap.get(title);
              if (!existing.imagen_url && image_url) {
                scrapedMap.set(title, { id: slug, titulo: title, copete: summary, imagen_url: image_url, link_original: full_link, categoria: source.categoria, usaIA: source.usaIA });
              }
            } else {
              scrapedMap.set(title, { id: slug, titulo: title, copete: summary, imagen_url: image_url, link_original: full_link, categoria: source.categoria, usaIA: source.usaIA });
            }
          }
        });
      } catch (e) {
        console.error(`No se pudo leer la fuente ${source.url}`);
      }
    }

    const scrapedNews = Array.from(scrapedMap.values());
    console.log(`Se encontraron ${scrapedNews.length} noticias nuevas en total (ignorando las que ya están en Sheets).`);

    if (scrapedNews.length === 0) {
      console.log('No hay noticias nuevas para procesar.');
      return;
    }

    // PASO B: EXTRACCIÓN PROFUNDA Y REESCRITURA CON IA
    const newsToInsert = [];
    
    // Para evitar agotar los límites gratuitos de Gemini y demorar mucho, limitamos a 10 notas nuevas por corrida.
    // Si corre cada hora, irá llenando el portal paulatinamente.
    const limit = Math.min(scrapedNews.length, 10); 
    
    for (let i = 0; i < limit; i++) {
      const news = scrapedNews[i];
      console.log(`[${i+1}/${limit}] Procesando: ${news.titulo}`);
      
      const { bodyText: originalBody, ogImage } = await extractBody(news.link_original);
      // og:image siempre tiene la mejor calidad y evita el lazy load de las miniaturas, sobreescribimos si existe
      if (ogImage) {
        news.imagen_url = ogImage;
      }
      
      if (originalBody.length > 100) {
        if (news.usaIA) {
          console.log(`   -> Generando contenido original con Gemini AI...`);
          const rewrittenBody = await rewriteNewsWithAI(originalBody);
          news.cuerpo_noticia = rewrittenBody;
        } else {
          console.log(`   -> Saltando IA (fuente con usaIA: false). Guardando texto original.`);
          news.cuerpo_noticia = originalBody;
        }
      } else {
        console.log(`   -> Texto original muy corto, se guardará el copete.`);
        news.cuerpo_noticia = news.copete;
      }
      
      delete news.usaIA; // Limpiamos esta propiedad para que no intente insertarla en Sheets como columna
      
      newsToInsert.push(news);
      existingTitles.add(news.titulo); // Prevenir duplicados si corremos de nuevo rápido
    }

    // PASO C: GUARDAR EN GOOGLE SHEETS
    if (newsToInsert.length > 0) {
      // Nota: Asegúrate de tener una columna "categoria" en tu Google Sheet al lado de las otras
      await sheet.addRows(newsToInsert);
      console.log(`¡${newsToInsert.length} noticias originales generadas con IA guardadas exitosamente en Google Sheets!`);
    }

  } catch (error) {
    console.error('Error general del scraper:', error.message);
  }
}

runScraper();
