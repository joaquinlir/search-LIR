// FirmCard.jsx
import React from "react";
import "./styles/FirmCard.css";
import { Link, useNavigate } from "react-router-dom";

const getRankInfo = (r) => {
  if (r === 1) {
    return { label: "Excelente", className: "rank-excellent" };
  }
  if (r === 2) {
    return { label: "Bueno", className: "rank-good" };
  }
  if (r === 3) {
    return { label: "Medio", className: "rank-medium" };
  }
  if (r >= 4) {
    return { label: "Bajo", className: "rank-low" };
  }
  return { label: "Sin ranking", className: "rank-unknown" };
};

const FirmCard = ({ firm, activeTags = [], highlightMatch }) => {
  const { firm: name, country, area, ranked, tags, relevance } = firm;

  const { label: rankLabel, className: rankClass } = getRankInfo(ranked);

  const navigate = useNavigate();

  function cleanFirmName(name) {
    if (!name) return "";
    let clean = name;
    clean = clean.replace(/\(.*?\)/g, "").trim();
    clean = clean.replace(/\b(\w+)\b\s+\1\b$/i, "$1");
    clean = clean.replace(/\s{2,}/g, " ").trim();
    return clean;
  }

  const slugify = (str) =>
    cleanFirmName(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")   // quitar acentos
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")       // reemplaza cualquier grupo de chars no válidos por UN "-"
      .replace(/-+/g, "-")               // <-- 🔥 colapsa "--" en "-"
      .replace(/^-|-$/g, "");            // quitar "-" al inicio o fin


  const handleRankingClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const countrySlug = slugify(country);
    const firmSlug = slugify(name);

    const url = `https://lm.thelegalindustry.com/market-firm/${countrySlug}/${firmSlug}`;

    window.open(url, "_blank"); // 🔥 abre en nueva pestaña
  };


  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

  }
  return (
    <Link to={`/firm/${firm.id || ""}`}> {/* ✅ SAFE */}
      <article className="firm-card">
        {highlightMatch && (
          <div className="firm-match-indicator">
            Esta firma habla de tu búsqueda
          </div>
        )}
        <header className="firm-card-header">
          <div className="firm-header-left">
            <h3 className="firm-name">{name || "Firma sin nombre"}</h3>
            <div className="firm-header-badges">
              <span className={`firm-rank ${rankClass}`}>{rankLabel}</span>
              {typeof relevance === "number" && (
                <span className="firm-relevance">
                  relevancia {relevance}%
                </span>
              )}
            </div>
          </div>

          {/* ⭐ Botón Ranking arriba derecha */}
          <div className="firm-header-right">
            <button
              type="button"
              className="firm-ranking-btn"
              onClick={handleRankingClick}
            >
              <span className="firm-ranking-star">⭐</span>
              Ver en LM
            </button>
          </div>
        </header>

        <div className="firm-meta">
          <span className="firm-country">{country || "País no especificado"}</span>
          {area && <span className="firm-area">{area}</span>}
        </div>

        {tags && tags.length > 0 && (
          <div className="firm-tags">
            {tags.slice(0, 8).map((t) => {
              const isActive = activeTags.includes(t.toLowerCase());
              return (
                <span
                  key={t}
                  className={`firm-tag ${isActive ? "firm-tag-active" : ""}`}
                >
                  {t}
                </span>
              );
            })}
          </div>
        )}

        {/* Botón Agregar abajo derecha */}
        <div className="firm-card-footer">
          <button
            type="button"
            className="firm-add-btn"
            onClick={handleAddClick}
          >
            Agregar +
          </button>
        </div>

      </article>
    </Link>
  );
};

export default FirmCard;
