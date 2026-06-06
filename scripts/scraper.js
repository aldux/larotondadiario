require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. CONFIGURACIÓN DE IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// 2. CONFIGURACIÓN DE FUENTES CON SELECTORES QUIRÚRGICOS
const SOURCES = [
  // --- NOTICIAS LOCALES ---
  { 
    url: 'https://diariosanrafael.com.ar/categoria/locales/', 
    categoria: 'Local', usaIA: true,
    extract: ($) => {
      const items = [];
      $('a').each((i, el) => {
         const title = $(el).text().trim();
         const link = $(el).attr('href');
         if (title.length > 30 && link && link.includes('/')) {
             items.push({ title, link_original: link });
         }
      });
      return items;
    }
  },
  { 
    url: 'https://www.mediamendoza.com/', 
    categoria: 'Local', usaIA: true,
    extract: ($) => {
      const items = [];
      $('article, .article, .card, .nota').each((i, el) => {
         const title = $(el).find('h1, h2, h3').first().text().trim();
         const link = $(el).find('a').first().attr('href');
         const summary = $(el).find('p').first().text().trim() || '';
         const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
         if (title && link) items.push({ title, link_original: link, summary, image_url: img });
      });
      return items;
    }
  },
  { 
    url: 'https://www.sitioandino.com.ar/', 
    categoria: 'Local', usaIA: true,
    extract: ($) => {
      const items = [];
      $('h2').each((i, el) => {
         const title = $(el).text().trim();
         const link = $(el).closest('a').attr('href') || $(el).find('a').attr('href') || $(el).parent().attr('href') || $(el).parent().parent().attr('href');
         if (title && link) items.push({ title, link_original: link });
      });
      return items;
    }
  },
  { 
    url: 'https://diarioinfoya.com.ar/', 
    categoria: 'Local', usaIA: true,
    encoding: 'iso-8859-1', // Previene caracteres rotos
    extract: ($) => {
      const items = [];
      $('h2').each((i, el) => {
         const title = $(el).text().trim();
         const link = $(el).closest('a').attr('href') || $(el).find('a').attr('href') || $(el).parent().attr('href');
         if (title && link) items.push({ title, link_original: link });
      });
      return items;
    }
  },

  // --- NOTICIAS NACIONALES ---
  { 
    url: 'https://www.infobae.com/politica/', 
    categoria: 'Nacional', usaIA: false,
    extract: ($) => {
      const items = [];
      $('a:has(h2)').each((i, el) => {
         const title = $(el).find('h2').text().trim();
         const link = $(el).attr('href');
         if (title && link) items.push({ title, link_original: link });
      });
      return items;
    }
  },
  { 
    url: 'https://tn.com.ar/politica/', 
    categoria: 'Nacional', usaIA: false,
    extract: ($) => {
      const items = [];
      $('article, .card, h2').each((i, el) => {
         const title = $(el).find('h2').length ? $(el).find('h2').text().trim() : $(el).text().trim();
         const link = $(el).find('a').attr('href') || $(el).closest('a').attr('href');
         if (title && title.toLowerCase() !== 'minuto a minuto' && link && !link.includes('minuto-a-minuto')) {
            items.push({ title, link_original: link });
         }
      });
      return items;
    }
  }
];

// Configuración de Google Sheets
    // Reparación hiper-agresiva de la clave privada para GitHub Actions
    let formattedKey = process.env.GOOGLE_PRIVATE_KEY || '';
    
    // 1. Quitar cualquier comilla que envuelva al string
    formattedKey = formattedKey.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    
    // 2. Reemplazar los saltos de línea escapados (\n literal) por saltos reales
    formattedKey = formattedKey.split(String.raw`\n`).join('\n').replace(/\\n/g, '\n');
    
    // 3. Si por algún motivo el usuario pegó la clave todo en una sola línea con espacios:
    if (formattedKey.includes('-----BEGIN PRIVATE KEY-----') && !formattedKey.includes('\n')) {
      formattedKey = formattedKey.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
      formattedKey = formattedKey.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----\n');
      // Limpiamos los espacios en el medio (el payload base64)
      const parts = formattedKey.split('\n');
      if (parts.length >= 3) {
        parts[1] = parts[1].replace(/\s+/g, '');
        formattedKey = parts.join('\n');
      }
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

// Función para extraer texto puro del enlace de la noticia
async function extractBody(url, source) {
  try {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.8,en-US;q=0.5,en;q=0.3',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      } 
    });
    
    const htmlText = source && source.encoding 
        ? new TextDecoder(source.encoding).decode(response.data) 
        : response.data.toString('utf-8');
        
    const $ = cheerio.load(htmlText);
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
    const existingTitles = new Set(rows.map(row => row.get('titulo') ? row.get('titulo').trim().toLowerCase() : '')); 
    const existingSlugs = new Set(rows.map(row => row.get('id') ? row.get('id').trim() : ''));
    
    const scrapedMap = new Map();

    // PASO A: RECORRER TODAS LAS FUENTES CON SELECTORES ESPECÍFICOS
    for (const source of SOURCES) {
      console.log(`Buscando en ${source.url} (${source.categoria})...`);
      try {
        const response = await axios.get(source.url, { 
          responseType: 'arraybuffer', // Necesario para decodificar Latin1
          timeout: 15000,
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-AR,es;q=0.8,en-US;q=0.5,en;q=0.3',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1'
          } 
        });
        
        const htmlText = source.encoding 
            ? new TextDecoder(source.encoding).decode(response.data) 
            : response.data.toString('utf-8');
            
        const $ = cheerio.load(htmlText);
        
        // Ejecutar la lógica de extracción específica de este portal y tomar SOLO las 4 primeras (las más nuevas)
        const items = source.extract($).slice(0, 4);
        
        items.forEach((item) => {
          let { title, summary, image_url, link_original } = item;
          summary = summary || '';
          image_url = image_url || '';
          
          if (!title || !link_original) return;

          if (image_url && !image_url.startsWith('http')) {
             if (image_url.startsWith('//')) image_url = 'https:' + image_url;
             else image_url = new URL(image_url, source.url).href;
          }

          const full_link = link_original && !link_original.startsWith('http') 
            ? new URL(link_original, source.url).href 
            : link_original;

          const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          const normalizedTitle = title.trim().toLowerCase();

          // Guardamos en un mapa para evitar duplicados en el mismo sitio
          if (!existingTitles.has(normalizedTitle) && !existingSlugs.has(slug)) {
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
        console.error(`No se pudo leer la fuente ${source.url} - Error: ${e.message}`);
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
      
      // Buscamos a qué fuente pertenece la nota para pasar su encoding
      const matchedSource = SOURCES.find(s => news.link_original.includes(new URL(s.url).hostname)) || {};
      const { bodyText: originalBody, ogImage } = await extractBody(news.link_original, matchedSource);
      // og:image siempre tiene la mejor calidad y evita el lazy load de las miniaturas, sobreescribimos si existe
      if (ogImage) {
        news.imagen_url = ogImage;
      }
      
      if (originalBody.length > 100) {
        if (news.usaIA) {
          console.log(`   -> Generando contenido original con Gemini AI...`);
          const rewrittenBody = await rewriteNewsWithAI(originalBody);
          news.cuerpo_noticia = rewrittenBody;
          // Esperamos 15 segundos para evitar el límite gratuito de Gemini de 5 peticiones por minuto
          await new Promise(r => setTimeout(r, 15000));
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
      existingTitles.add(news.titulo.trim().toLowerCase()); // Prevenir duplicados si corremos de nuevo rápido
      existingSlugs.add(news.id);
    }

    // PASO C: GUARDAR EN GOOGLE SHEETS
    if (newsToInsert.length > 0) {
      // Invertimos el array antes de insertarlo para que las noticias más antiguas del lote se inserten primero,
      // y la noticia más nueva del lote quede al final de la planilla.
      // De esta forma, cuando la web hace un .reverse() de toda la planilla, la más nueva queda arriba de todo.
      const newsReversed = [...newsToInsert].reverse();
      
      // Nota: Asegúrate de tener una columna "categoria" en tu Google Sheet al lado de las otras
      await sheet.addRows(newsReversed);
      console.log(`¡${newsReversed.length} noticias originales generadas con IA guardadas exitosamente en Google Sheets!`);

      // PASO D: ENVIAR A MAKE.COM (WEBHOOK) PARA PUBLICAR EN FACEBOOK
      if (process.env.MAKE_WEBHOOK_URL) {
        console.log("Enviando nuevas noticias al Webhook de Make.com...");
        for (const news of newsToInsert) {
          try {
            await axios.post(process.env.MAKE_WEBHOOK_URL, {
              titulo: news.titulo,
              copete: news.copete,
              imagen: news.imagen_url,
              enlace_original: news.link_original,
              slug: news.id,
              categoria: news.categoria
            });
            // Pequeña pausa de 2 segundos para no saturar el webhook de Make
            await new Promise(r => setTimeout(r, 2000));
          } catch (err) {
            console.error(`Error enviando al webhook la noticia "${news.titulo}":`, err.message);
          }
        }
        console.log("¡Webhook enviado con éxito!");
      }
    }

  } catch (error) {
    console.error('Error general del scraper:', error.message);
  }
}

runScraper();
