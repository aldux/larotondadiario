const Papa = require("papaparse");
const NEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsmHuNFq21hZNK1d-lekS443MWeyGwGhdL68qUEU1B1j6Hndf905KEFlQAKvh9rR1LOoRbA3XxZzBq/pub?gid=0&single=true&output=csv";

async function run() {
  const res = await fetch(NEWS_CSV_URL);
  const text = await res.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  console.log(`Filas: ${parsed.data.length}`);
  parsed.data.forEach((row, i) => {
    console.log(`[${i}] Título: ${row.titulo?.substring(0,40)}... | Imagen: ${row.imagen_url?.substring(0, 60)}`);
  });
}
run();
