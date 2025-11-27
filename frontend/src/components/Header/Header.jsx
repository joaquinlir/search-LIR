// src/components/Header.jsx
import React from "react";
import { NavLink, Link } from "react-router-dom";
import "./styles/Header.css";

const Header = () => {
  return (
    <header className="main-header">
      <div className="header-inner">
        {/* Logo / Marca */}
        <Link to="/" className="header-logo">
          <span className="logo-mark">LM</span>
          <span className="logo-text">
            Search <span>Engine</span> by LIR

          </span>
        </Link>

        {/* Navegación */}
        <nav className="header-nav">
          <NavLink
            to="/about-tool"
            className={({ isActive }) =>
              "header-link" + (isActive ? " header-link-active" : "")
            }
          >
            Sobre la herramienta
          </NavLink>
        </nav>

        {/* Botón Login (reemplaza BETA) */}
        <div className="header-actions">
          <Link to="/login" className="header-login-btn">
            Login
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
