// src/scripts/buildDictionary.mjs
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { loadFirmsFromSheet } from "../googleSheets.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 Ruta donde guardaremos el diccionario generado
const OUTPUT_PATH = path.join(__dirname, "..", "data", "firmDictionary.json");

// ⚠️ Asegúrate de tener OPENAI_API_KEY en tus variables de entorno
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Pequeña utilidad: asegurarnos que exista la carpeta /data
 */
function ensureDataDir() {
    const dataDir = path.join(__dirname, "..", "data");
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

/**
 * Prompt para que el modelo nos devuelva JSON estructurado con:
 * - keywords (conceptos importantes)
 * - synonyms (variantes en inglés/español)
 * - categories (etiquetas amplias)
 *
 * ⚠️ Solo usamos DESCRIPTION (D), KEY CLIENTS (F) y WORK HIGHLIGHTS (G)
 * como texto de entrada. PAÍS / FIRMA van solo como contexto.
 */
function buildPromptForFirm(firm) {
    const {
        firm: name,
        country,
        description,    // viene de columna D (Results3)
        keyClients,     // viene de columna F (Results3)
        workHighlights, // viene de columna G (Results3)
    } = firm;

    return `
Analiza el siguiente texto que describe el trabajo de una firma legal.

IMPORTANTE:
- Usa SOLO el contenido de "Descripción", "Key clients" y "Work highlights" para extraer información.
- No inventes información nueva: todo debe estar basado en ese texto.

Objetivo: generar metadatos estructurados para un buscador especializado.

Devuélvelo EXCLUSIVAMENTE como un JSON válido sin comentarios, sin texto adicional, con la siguiente estructura:

{
  "keywords": ["lista", "de", "frases", "clave"],
  "synonyms": ["variantes", "sinonimos", "traducciones"],
  "categories": ["categorías amplias como energía, minería, tecnología, banca, penal, etc."]
}

Instrucciones:
- "keywords": entre 8 y 20 palabras o frases cortas que representen conceptos importantes del trabajo de la firma
  (tipos de transacciones, áreas de práctica, industrias, tipos de clientes, etc.).
- "synonyms": entre 10 y 25 términos relacionados, incluyendo:
  - traducciones inglés/español
  - abreviaturas
  - formas alternativas de nombrar lo mismo
- "categories": 1 a 5 etiquetas amplias para agrupar el tipo de trabajo (ejemplos:
  "energía", "minería", "litigios", "banca", "corporativo", "tecnología",
  "medio ambiente", "penal", "tributario", etc.).

Contexto (no lo uses como texto para extraer keywords, solo como referencia):
- Nombre de la firma: ${name || "(sin nombre)"}
- País: ${country || "(sin país)"}

TEXTO A ANALIZAR
(usa SOLO lo siguiente para extraer keywords, sinónimos y categorías):

Descripción:
${description || "(sin descripción)"}

Work highlights:
${workHighlights || "(sin work highlights)"}

Key clients:
${keyClients || "(sin key clients)"}
`;
}

/**
 * Llama a OpenAI para una firma y devuelve un objeto:
 * { keywords: [...], synonyms: [...], categories: [...] }
 *
 * Si algo falla, devuelve estructuras vacías.
 */
async function generateMetadataForFirm(firm) {
    const prompt = buildPromptForFirm(firm);

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini", // puedes cambiar a un modelo más barato si quieres
            messages: [
                {
                    role: "system",
                    content:
                        "Eres un asistente especializado en análisis de texto legal y generación de metadatos estructurados para un buscador semántico.",
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.2,
        });

        const raw = response.choices[0]?.message?.content || "";

        // Intentamos parsear JSON
        let data;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            console.error(
                `❌ No se pudo parsear JSON para firma ${firm.firm} (${firm.country}):`,
                e.message
            );
            console.error("Respuesta bruta del modelo:\n", raw);
            return {
                keywords: [],
                synonyms: [],
                categories: [],
            };
        }

        const keywords = Array.isArray(data.keywords) ? data.keywords : [];
        const synonyms = Array.isArray(data.synonyms) ? data.synonyms : [];
        const categories = Array.isArray(data.categories) ? data.categories : [];

        return { keywords, synonyms, categories };
    } catch (err) {
        console.error(
            `❌ Error llamando a OpenAI para firma ${firm.firm} (${firm.country}):`,
            err.message
        );
        return {
            keywords: [],
            synonyms: [],
            categories: [],
        };
    }
}

/**
 * Script principal:
 * - Carga firmas desde Google Sheets (Results3, vía loadFirmsFromSheet)
 * - Llama a OpenAI para cada firma usando solo Description/KeyClients/WorkHighlights
 * - Guarda un JSON con la forma:
 *
 * {
 *   "chile::a/c/r legal": {
 *      "id": "...",
 *      "firm": "...",
 *      "country": "...",
 *      "keywords": [...],
 *      "synonyms": [...],
 *      "categories": [...]
 *   },
 *   ...
 * }
 */
async function main() {
    console.log("📄 Cargando firmas desde Google Sheets (Results3)...");
    const firms = await loadFirmsFromSheet();
    console.log(`   → ${firms.length} firmas cargadas.`);

    ensureDataDir();

    const dictionary = {};
    let processed = 0;

    for (const firm of firms) {
        processed += 1;
        console.log(
            `🔎 [${processed}/${firms.length}] Procesando: ${firm.firm} (${firm.country})`
        );

        const meta = await generateMetadataForFirm(firm);

        const countryNorm = (firm.country || "").toLowerCase().trim();
        const firmNorm = (firm.firm || "").toLowerCase().trim();
        const key = `${countryNorm}::${firmNorm}`;

        dictionary[key] = {
            id: firm.id,
            firm: firm.firm,
            country: firm.country,
            region: firm.region,
            keywords: meta.keywords,
            synonyms: meta.synonyms,
            categories: meta.categories,
        };

        // Pequeña pausa para no saturar la API (opcional)
        await new Promise((res) => setTimeout(res, 400));
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dictionary, null, 2), "utf8");
    console.log(`✅ Diccionario generado y guardado en: ${OUTPUT_PATH}`);
}

main().catch((err) => {
    console.error("❌ Error en buildDictionary.mjs:", err);
    process.exit(1);
});
