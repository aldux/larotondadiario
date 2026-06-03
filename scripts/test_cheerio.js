const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const url = 'https://diariosanrafael.com.ar/patricia-bullrich-tras-poner-su-renuncia-a-disposicion-de-milei-no-hay-riesgo-de-fractura/';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  
  // Heurística simple: agarrar todos los párrafos principales
  const ps = [];
  $('div p').each((i, el) => {
    const text = $(el).text().trim();
    if (text.length > 50) ps.push(text);
  });
  console.log("Párrafos encontrados:", ps.length);
  console.log("Muestra del texto:");
  console.log(ps.slice(0, 2).join('\n'));
}

test();
