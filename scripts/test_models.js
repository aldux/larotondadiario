const key = process.env.GEMINI_API_KEY;
async function getModels() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await res.json();
  const validModels = data.models
    .map(m => m.name)
    .filter(name => name.includes("gemini") && !name.includes("embedding") && !name.includes("robotics") && !name.includes("veo") && !name.includes("imagen"));
  console.log("Valid Models:", validModels);
}
getModels();
