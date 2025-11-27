// src/googleSheets.mjs
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "credentials.json"), "utf8")
);

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

// ⚠️ Reemplaza por tu ID real si cambia
const SPREADSHEET_ID = "1Slpn0UUmcr3pih1xuNdbKRhd7NYFY3UFR5qFzxsWQvE";

/**
 * Normaliza texto: minúsculas + sin tildes.
 */
export function normalize(str) {
    return String(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Parser robusto de TAGS:
 * - Soporta cadenas tipo: banking, finance, etc
 * - Soporta: ["banking","finance"]
 * - Soporta: ['banking','finance']
 */
function parseTags(tagsRaw) {
    const raw = String(tagsRaw || "").trim();
    if (!raw) return [];

    // Intento 1: JSON array ["tag1","tag2"] o ['tag1','tag2']
    if (raw.startsWith("[") && raw.endsWith("]")) {
        try {
            const jsonSafe = raw.replace(/'/g, '"');
            const parsed = JSON.parse(jsonSafe);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((t) => String(t))
                    .map((t) => t.replace(/^"+|"+$/g, "").trim())
                    .filter(Boolean);
            }
        } catch (e) {
            // fall back abajo
        }
    }

    // Intento 2: texto plano separado por coma / punto y coma
    const parts = raw
        .replace(/[\[\]]/g, "")
        .split(/[;,]/)
        .map((t) => t.replace(/^"+|"+$/g, "").trim())
        .filter(Boolean);

    return parts;
}

/**
 * Lee la hoja Results3 y devuelve un arreglo de objetos:
 * { country, area, firm, description, testimonials, keyClients, workHighlights, ranked, tags, region }
 */
export async function loadFirmsFromSheet() {
    const range = "Results3!A2:K"; // A:PAIS ... I:TAGS, J:REGION
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
    });

    const rows = res.data.values || [];

    const firms = rows.map((row, index) => {
        const [
            country = "",
            area = "",
            firm = "",
            description = "",
            testimonials = "",
            keyClients = "",
            workHighlights = "",
            rankedRaw = "",
            tagsRaw = "",
            regionRaw = "",
            idRaw = "", // J = REGION
        ] = row;

        const ranked = Number(rankedRaw) || 0;
        const tagsArr = parseTags(tagsRaw);

        return {
            id: idRaw ? String(idRaw).trim() : String(index),
            country,
            area,
            firm,
            description,
            testimonials,
            keyClients,
            workHighlights,
            ranked,
            tags: tagsArr,
            tagsText: tagsArr.join(" "),
            region: regionRaw || "",
        };
    });

    // Logs útiles para depurar
    console.log("✅ loadFirmsFromSheet: filas cargadas:", firms.length);
    if (firms.length > 0) {
        console.log("   Ejemplo de firma[0]:", {
            country: firms[0].country,
            region: firms[0].region,
            ranked: firms[0].ranked,
            tags: firms[0].tags,
        });
    }

    return firms;
}
