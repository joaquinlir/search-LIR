// src/pages/AppContent.jsx
import React from "react";
import SearchBar from "../../components/SearchBar/SearchBar.jsx";
import FirmCard from "../../components/FirmCard/FirmCard.jsx";
import TagChip from "../../components/TagChip/TagChip.jsx";
import "../../styles/app.css";

import useSearchInput, { normalize } from "../../hooks/useSearchInput.js";
import useQuickTags from "../../hooks/useQuickTags.js";
import useDynamicFilters from "../../hooks/useDynamicFilters.js";
import useSearchGroups from "../../hooks/useSearchGroups.js";
import useCombinedSearch from "../../hooks/useCombinedSearch.js";
import usePagination from "../../hooks/usePagination.js";

/**
 * Componente principal (refactorizado, modular y más claro).
 * - Hooks separados para responsabilidad única
 * - Mantiene exactamente la lógica funcional previa:
 *   * búsquedas normales vs tags rápidos
 *   * combinación/intersección de conceptos
 *   * paginación de tags rápidos
 */

const AppContent = () => {
  // ---------------------------
  // hooks / estado modular
  // ---------------------------
  const {
    quickTagsAll,
    quickTagsFiltered,
    setQuickTagsFiltered,
  } = useQuickTags(); // recibe selectedCountry/Region internamente desde hook

  // search input (manejador del input y filtrado de quickTags)
  const { query, setQuery, handleTyping } = useSearchInput(
    quickTagsAll,
    setQuickTagsFiltered
  );

  // filtros dinámicos (país / región / applyFilters)
  const {
    filterCountries,
    filterRegions,
    countriesForCurrentRegion,
    selectedCountry,
    selectedRegion,
    setSelectedCountry,
    setSelectedRegion,
    applyFilters,
  } = useDynamicFilters();

  // grupos de búsqueda + fetch (search / searchByTag)
  const {
    searchGroups,
    handleSearchSubmit: rawHandleSearchSubmit,
    handleQuickTagClick: rawHandleQuickTagClick,
    handleRemoveTag,
    handleActiveTagClick,
  } = useSearchGroups();

  // combinación/intersección de conceptos
  const combinedGroup = useCombinedSearch(searchGroups);

  // paginación para tags rápidos
  const TAGS_PER_PAGE = 6;
  const {
    visibleItems: visibleQuickTags,
    totalPages: totalQuickTagPages,
    currentPage: currentQuickTagsPage,
    next: quickTagsNext,
    prev: quickTagsPrev,
    reset: quickTagsReset,
    setPage: setQuickTagsPage,
  } = usePagination(quickTagsFiltered, TAGS_PER_PAGE);

  // mostrar más/menos para tags activos debajo del buscador
  const [showMoreTags, setShowMoreTags] = React.useState(false);
  const MAX_VISIBLE_TAGS = 6;
  const activeTags = searchGroups.map((g) => g.tag);
  const visibleActiveTags = showMoreTags
    ? activeTags
    : activeTags.slice(0, MAX_VISIBLE_TAGS);

  // ---------------------------
  // Wrappers para preservar comportamiento anterior
  // (reseteos, sincronización de quickTags, etc.)
  // ---------------------------
  const handleSearchSubmit = async (value) => {
    // Delegamos a hook y luego limpiamos input y paginación
    await rawHandleSearchSubmit(value);
    setQuery("");
    setQuickTagsFiltered(quickTagsAll);
    quickTagsReset();
  };

  const handleQuickTagClick = async (label) => {
    await rawHandleQuickTagClick(label);
    quickTagsReset();
  };

  // ---------------------------
  // Derived data for combined results & filters
  // ---------------------------
  const combinedFilteredResults = applyFilters(combinedGroup.results || []);
  const hasCombinedSearch =
    combinedGroup.tags && combinedGroup.tags.length >= 2;

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className="app-root">
      {/* HERO */}
      <header className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">
            Buscador <span> LIR</span>
          </h1>
          <p className="hero-subtitle">
            Realiza búsquedas inteligentes.
          </p>

          <SearchBar
            value={query}
            onSearch={handleSearchSubmit}
            onTyping={handleTyping}
          />

          {/* TAGS ACTIVOS */}
          <div className="active-tags-container">
            {visibleActiveTags.map((tag) => (
              <div key={tag} className="active-tag">
                <span onClick={() => handleActiveTagClick(tag)}>{tag}</span>
                <button
                  className="tag-remove"
                  onClick={() => handleRemoveTag(tag)}
                >
                  ✕
                </button>
              </div>
            ))}

            {activeTags.length > MAX_VISIBLE_TAGS && (
              <button
                className="show-more-btn"
                onClick={() => setShowMoreTags((s) => !s)}
              >
                {showMoreTags ? "Mostrar menos" : "Mostrar más"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="main-content">
        <div className="content-layout">
          {/* COLUMNA PRINCIPAL */}
          <div className="content-main-column">
            {/* FILTROS */}
            <section className="filters-section">
              <h3>Filtros</h3>
              <div className="filters-row">
                <select
                  aria-label="select-region"
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setSelectedCountry("");
                  }}
                >
                  <option value="">Todas las regiones</option>
                  {filterRegions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="select-country"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                >
                  <option value="">Todos los países</option>
                  {countriesForCurrentRegion.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* RESULTADOS QUE COINCIDEN CON TODOS LOS CONCEPTOS (COMBINADOS) */}
            {hasCombinedSearch && (
              <section className="results-section">
                <div className="results-header">
                  <h2>
                    Firmas que coinciden con todos los conceptos:{" "}
                    {combinedGroup.tags.join(" + ")}
                  </h2>
                  <span className="results-meta">
                    {combinedFilteredResults.length} resultado
                    {combinedFilteredResults.length === 1 ? "" : "s"}
                  </span>
                </div>

                {combinedFilteredResults.length === 0 ? (
                  <p className="no-results">
                    No hay ninguna firma que hable de los{" "}
                    {combinedGroup.tags.length} conceptos. Intenta con otros.
                  </p>
                ) : (
                  <div className="results-grid">
                    {combinedFilteredResults.map((firm, idx) => (
                      <FirmCard
                        key={`combined-${idx}-${firm.firm}-${firm.country}-${firm.area}`}
                        firm={firm}
                        activeTags={activeTags}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* RESULTADOS POR TAG (INDIVIDUALES) */}
            {searchGroups.map((group) => {
              const filteredResults = applyFilters(group.results || []);

              return (
                <section key={group.tag} className="results-section">
                  <div className="results-header">
                    <h2>Búsqueda para “{group.tag}”</h2>
                    <span className="results-meta">
                      {filteredResults.length} resultado
                      {filteredResults.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {filteredResults.length === 0 ? (
                    <p className="no-results">
                      No hay resultados para esta búsqueda con los filtros
                      actuales. Pero intenta cambiando pais/region
                    </p>
                  ) : (
                    <div className="results-grid">
                      {filteredResults.map((firm) => (
                        <FirmCard
                          key={`${group.tag}-${firm.id}`}
                          firm={firm}
                          activeTags={activeTags}
                          // solo destacar match en búsquedas normales (no quick tags)
                          highlightMatch={group.isQuickTag ? null : group.tag}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {/* SIDEBAR: TAGS RÁPIDOS */}
          <aside className="sidebar-column">
            <section className="quick-tags-section sidebar-card">
              <h3>Tags rápidos</h3>
              <p className="quick-tags-subtitle">
                Sugerencias basadas en los conceptos más frecuentes para los
                filtros actuales.
              </p>

              <div className="quick-tags-container">
                {visibleQuickTags.map((t) => (
                  <TagChip
                    key={t.tag}
                    label={t.tag}
                    count={t.count}
                    onClick={() => handleQuickTagClick(t.tag)}
                  />
                ))}

                {visibleQuickTags.length === 0 && (
                  <p className="quick-tags-empty">
                    No hay tags disponibles para esta combinación de filtros.
                  </p>
                )}
              </div>

              {/* PAGINACIÓN DE TAGS RÁPIDOS */}
              {totalQuickTagPages > 1 && (
                <div className="quick-tags-pagination">
                  <button
                    className="quick-tags-page-btn"
                    onClick={() => quickTagsPrev()}
                    disabled={currentQuickTagsPage === 0}
                  >
                    ‹
                  </button>

                  <span className="quick-tags-page-indicator">
                    {currentQuickTagsPage + 1} / {totalQuickTagPages}
                  </span>

                  <button
                    className="quick-tags-page-btn"
                    onClick={() => quickTagsNext()}
                    disabled={currentQuickTagsPage === totalQuickTagPages - 1}
                  >
                    ›
                  </button>
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default AppContent;
