const Papa = require("papaparse");
const NEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsmHuNFq21hZNK1d-lekS443MWeyGwGhdL68qUEU1B1j6Hndf905KEFlQAKvh9rR1LOoRbA3XxZzBq/pub?gid=0&single=true&output=csv";

async function run() {
  try {
    const res = await fetch(NEWS_CSV_URL);
    const text = await res.text();
    console.log("Texto devuelto por Google Sheets (primeros 300 caracteres):");
    console.log(text.substring(0, 300));
    
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    console.log("Cantidad de filas detectadas:", parsed.data.length);
    console.log("Ejemplo de primera fila parseada:", parsed.data[0]);
  } catch(e) {
    console.error(e);
  }
}
run();
