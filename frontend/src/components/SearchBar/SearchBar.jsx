// src/components/SearchBar.jsx
import React, { useState, useEffect } from "react";
import "./styles/SearchBar.css";

const SearchBar = ({ value, onSearch, onTyping }) => {
  const [localValue, setLocalValue] = useState(value || "");

  // Sincronizar si desde App algún día cambias value
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!localValue.trim()) return;
    onSearch(localValue);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    if (onTyping) onTyping(val);
  };

  return (
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
  );
};

export default SearchBar;
