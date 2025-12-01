// src/components/SearchBar.jsx
import React, { useState, useEffect } from "react";
import "./styles/SearchBar.css";

const SearchBar = ({ value, onSearch, onTyping }) => {
  const [localValue, setLocalValue] = useState(value || "");
  const [error, setError] = useState(""); // ⬅ NUEVO: estado de error

  // Sincronizar si desde App cambian value
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!localValue.trim()) {
      setError("Por favor escribe una palabra antes de buscar");

      // borrar error automático después de 2.2s
      setTimeout(() => setError(""), 3500);
      return;
    }

    onSearch(localValue);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    if (onTyping) onTyping(val);
  };

  return (
    <>
      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          className="search-input"
          type="text"
          placeholder="Busca conceptos como 'energía', 'tecnología', 'ESG'..."
          value={localValue}
          onChange={handleChange}
        />

        <button className="search-button" type="submit">
          Buscar
        </button>
      </form>

      {/* ⬅ NUEVO: Mensaje de error elegante */}
      {error && <p className="search-error">{error}</p>}
    </>
  );
};

export default SearchBar;
