// src/server.mjs
import express from "express";
import cors from "cors";
import { loadFirmsFromSheet, appendFormResponse } from "./googleSheets.mjs";
import {
    buildFuseIndex,
    semanticSearch,
    getQuickTags,
    searchByTag,
} from "./searchEngine.mjs";

const app = express();
app.use(cors());
app.use(express.json());

let FIRMS = [];
//let TAGS_CONCENTRADOS = [];   // ⬅️ NUEVO
let FUSE = null;

// Carga inicial del índice
async function init() {
    console.log("📄 Cargando datos desde Google Sheets...");

    // Cargar firmas
    FIRMS = await loadFirmsFromSheet();
    console.log(`   → ${FIRMS.length} filas cargadas.`);

    // Cargar tags concentrados
    // TAGS_CONCENTRADOS = await loadTagsConcentrados();   // ⬅️ NUEVO
    // console.log(`   → Tags concentrados cargados: ${TAGS_CONCENTRADOS.length}`);

    // Construir índice
    FUSE = buildFuseIndex(FIRMS);
    console.log("🔍 Índice Fuse.js construido.");

    const firmasConTags = FIRMS.filter((f) => (f.tags || []).length > 0);
    console.log(
        `   → Firmas con al menos 1 tag: ${firmasConTags.length}`
    );
}

// =============================== ENDPOINTS ===============================

// Obtener detalle de una firma por ID
app.get("/api/firm-details", (req, res) => {
    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ error: "Missing id" });

    const firm = FIRMS.find((f) => String(f.id) === id);
    if (!firm) return res.status(404).json({ error: "Firm not found" });

    return res.json(firm);
});

// =============================== NUEVO ENDPOINT ===============================
// ✔ Devuelve el contenido de la hoja “tags concentrados”
// app.get("/api/tags-concentrados", (req, res) => {
//     try {
//         res.json({
//             count: TAGS_CONCENTRADOS.length,
//             rows: TAGS_CONCENTRADOS,
//         });
//     } catch (error) {
//         console.error("❌ Error en /api/tags-concentrados", error);
//         res.status(500).json({ error: "Error interno" });
// }
// });

// ✔ Filtros dinámicos
app.get("/api/filters", (req, res) => {
    const countriesSet = new Set();
    const regionsSet = new Set();
    const mappingSet = new Set();

    FIRMS.forEach((f) => {
        const country = (f.country || "").trim();
        const region = (f.region || "").trim();

        if (country) countriesSet.add(country);
        if (region) regionsSet.add(region);

        if (country && region) {
            mappingSet.add(`${country}:::${region}`);
        }
    });

    const countries = Array.from(countriesSet).sort();
    const regions = Array.from(regionsSet).sort();

    const mapping = Array.from(mappingSet).map((str) => {
        const [country, region] = str.split(":::");
        return { country, region };
    });

    res.json({
        countries,
        regions,
        mapping,
    });
});

// ✔ Todas las firmas
app.get("/api/all-firms", (req, res) => {
    try {
        res.json(FIRMS);
    } catch (err) {
        console.error("Error en /api/all-firms:", err);
        res.status(500).json({ error: "Error interno al obtener firmas" });
    }
});

// ✔ Health
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", totalFirms: FIRMS.length });
});

// ✔ Búsqueda semántica
app.get("/api/search", (req, res) => {
    const q = req.query.q || "";
    const limit = req.query.limit ? Number(req.query.limit) : 30;

    if (!q.trim()) {
        return res.json({ query: q, results: [] });
    }

    if (!FUSE) {
        return res
            .status(500)
            .json({ error: "Índice de búsqueda no inicializado" });
    }

    const results = semanticSearch(FUSE, q, limit);
    res.json({
        query: q,
        count: results.length,
        results,
    });
});

// ✔ Tags rápidos
app.get("/api/tags", (req, res) => {
    const { country, region } = req.query;

    let firmsToUse = FIRMS;

    if (region && region.trim()) {
        firmsToUse = firmsToUse.filter(
            (f) => (f.region || "").trim() === region.trim()
        );
    }

    if (country && country.trim()) {
        firmsToUse = firmsToUse.filter(
            (f) => (f.country || "").trim() === country.trim()
        );
    }

    const quickTags = getQuickTags(firmsToUse, 40);

    res.json({
        count: quickTags.length,
        tags: quickTags,
    });
});

// ✔ Buscar por tag
app.get("/api/searchByTag", (req, res) => {
    const tag = req.query.tag || "";
    if (!tag.trim()) return res.json({ tag, results: [] });

    const results = searchByTag(FIRMS, tag);
    res.json({
        tag,
        count: results.length,
        results,
    });
});

// 🔹 Endpoint para recibir el formulario y guardar en Google Sheets
app.post("/api/form-submit", async (req, res) => {
    try {
        const payload = req.body || {};

        // Asegurarnos de que savedFirms sea siempre un arreglo
        const savedFirms = Array.isArray(payload.savedFirms)
            ? payload.savedFirms
            : [];

        const dataToSave = {
            ...payload,
            savedFirms,
        };

        await appendFormResponse(dataToSave);

        return res.json({ ok: true });
    } catch (err) {
        console.error("❌ Error en /api/form-submit:", err);
        return res
            .status(500)
            .json({ ok: false, error: "Error al guardar en Google Sheets" });
    }
});


// =============================== SERVIDOR ===============================
const PORT = process.env.PORT || 4000;

init()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Backend escuchando en http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ Error al inicializar backend:", err);
        process.exit(1);
    });
