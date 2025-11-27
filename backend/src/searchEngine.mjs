// src/searchEngine.mjs
import Fuse from "fuse.js";
import { normalize } from "./googleSheets.mjs";

/**
 * Diccionario simple de sinónimos / expansiones de consulta.
 */
const QUERY_SYNONYMS = [
    {
        match: ["ciclo integral de inversion de riesgo"],
        expand: [
            "venture capital",
            "private equity",
            "financiamiento",
            "early stage",
            "growth capital",
        ],
    },
    {
        match: ["tecnologia", "tecnología", "tech"],
        expand: [
            "technology",
            "it",
            "digital",
            "software",
            "data",
            "cybersecurity",
            "fintech",
        ],
    },
    {
        match: ["medio ambiente", "ambiental", "sostenible", "sustentable"],
        expand: ["environment", "environmental", "esg", "sustainability"],
    },
    {
        match: ["banca", "banco", "financiero"],
        expand: ["banking", "finance", "financial services"],
    },
    {
        match: ["extractivos", "mineria", "minería"],
        expand: ["mining", "natural resources", "project finance"],
    },
];

/**
 * Expande una consulta con sinónimos semánticos.
 */
function expandQuery(query) {
    const qNorm = normalize(query);
    let expanded = [qNorm];

    QUERY_SYNONYMS.forEach((rule) => {
        const matches = rule.match.map((m) => normalize(m));
        if (matches.some((m) => qNorm.includes(m))) {
            expanded = expanded.concat(rule.expand.map((e) => normalize(e)));
        }
    });

    return Array.from(new Set(expanded));
}

/**
 * Construye el índice Fuse.js.
 */
export function buildFuseIndex(firms) {
    const options = {
        includeScore: true,
        threshold: 0.4,
        distance: 200,
        minMatchCharLength: 2,
        useExtendedSearch: false,
        keys: [
            { name: "firm", weight: 0.5 },
            { name: "area", weight: 0.2 },
            { name: "description", weight: 0.3 },
            { name: "tagsText", weight: 0.8 },
        ],
    };

    return new Fuse(firms, options);
}

/**
 * 🔹 NUEVO: orden numérico de ranking (para ordenar resultados).
 * 1 = Excelente, 2 = Bueno, 3 = Medio, 4 = Bajo, 5 = Sin ranking.
 */
function getRankOrder(ranked) {
    if (ranked === 1) return 1;          // Excelente
    if (ranked === 2) return 2;          // Bueno
    if (ranked === 3) return 3;          // Medio
    if (ranked >= 4) return 4;           // Bajo
    return 5;                            // Sin ranking / undefined
}

/**
 * Ajusta el score de Fuse según el RANKED.
 */
function applyRankBoost(results) {
    return results.map((r) => {
        const ranked = r.item.ranked;
        const baseScore = r.score ?? 0.5;

        let rankFactor = 1;
        if (ranked === 1) rankFactor = 0.7;
        else if (ranked === 2 || ranked === 3) rankFactor = 0.9;
        else if (ranked >= 4) rankFactor = 1.1;

        const adjustedScore = baseScore * rankFactor;

        return {
            ...r,
            adjustedScore,
        };
    });
}

/**
 * Búsqueda semántica (query + sinónimos) sobre Fuse, ajustada por ranking.
 */
export function semanticSearch(fuse, query, limit = 30) {
    if (!query || !query.trim()) return [];

    const expanded = expandQuery(query);
    const searchText = expanded.join(" ");

    const fuseResults = fuse.search(searchText);
    const boosted = applyRankBoost(fuseResults);

    // 🔹 NUEVO: ordenar por ranking (mejor a peor) y luego por score
    const sorted = boosted
        .map((r) => ({
            ...r,
            rankOrder: getRankOrder(r.item.ranked),
        }))
        .sort((a, b) => {
            // primero: ranking (1 = Excelente, 2, 3, 4, 5 = Sin ranking)
            if (a.rankOrder !== b.rankOrder) {
                return a.rankOrder - b.rankOrder;
            }
            // segundo: adjustedScore (menor = mejor match en Fuse)
            return (a.adjustedScore ?? 1) - (b.adjustedScore ?? 1);
        })
        .slice(0, limit);

    return sorted.map((r) => {
        const score = r.adjustedScore ?? 0.7;
        const clamped = Math.max(0, Math.min(score, 1));
        const relevance = Math.round((1 - clamped) * 100);

        return {
            id: r.item.id,
            score,
            relevance,
            ...r.item,
        };
    });
}

/**
 * Tags rápidos: los más frecuentes en todas las firmas.
 */
export function getQuickTags(firms, maxTags = 30) {
    const freq = new Map();

    firms.forEach((f) => {
        (f.tags || []).forEach((t) => {
            const tag = t.trim();
            if (!tag) return;
            freq.set(tag, (freq.get(tag) || 0) + 1);
        });
    });

    const sorted = Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxTags)
        .map(([tag, count]) => ({ tag, count }));

    return sorted;
}

/**
 * Búsqueda por tag exacto (case-insensitive, normalizado).
 */
export function searchByTag(firms, tag) {
    const target = normalize(tag);

    const results = firms
        .filter((f) => (f.tags || []).some((t) => normalize(t) === target))
        .map((f) => ({
            id: f.id,
            ...f,
            relevance: 100,
        }));

    // 🔹 NUEVO: ordenar también aquí por ranking (Excelente → Sin ranking)
    results.sort((a, b) => getRankOrder(a.ranked) - getRankOrder(b.ranked));

    return results;
}
