// /frontend/src/components/layout/Sidebar.jsx
import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isExpanded, onToggle }) => {

  // Ferme la sidebar si on clique en dehors (mobile uniquement)
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Vérifie si on est sur mobile ET si la sidebar est ouverte
      if (window.innerWidth <= 768 && isExpanded) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.contains(e.target)) {
          onToggle(); // Ferme la sidebar
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside); // Support tactile

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isExpanded, onToggle]);

  // Bloque le scroll du body quand la sidebar est ouverte sur mobile
  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.style.overflow = isExpanded ? 'hidden' : '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isExpanded]);

  return (
    <>
      {/* OVERLAY : fond sombre derrière la sidebar sur mobile */}
      {isExpanded && (
        <div className="sidebar__overlay" onClick={onToggle} />
      )}

      <aside className={`sidebar ${isExpanded ? 'sidebar--expanded' : 'sidebar--collapsed'}`}>

        {/* BOUTON TOGGLE */}
        <button
          className="sidebar__toggle"
          onClick={onToggle}
          aria-label={isExpanded ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {isExpanded ? '✕' : '☰'}
        </button>

        {/* HEADER — visible uniquement en mode étendu */}
        {isExpanded && (
          <div className="sidebar__header">
            <h2 className="sidebar__title">DAMXSCORP</h2>
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="sidebar__nav">
          <ul className="sidebar__menu">

            <li className="sidebar__menu-item">
              <NavLink
                to="/planning"
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
                title="Planning"
                onClick={() => window.innerWidth <= 768 && onToggle()}
              >
                <span className="sidebar__icon">📅</span>
                {isExpanded && <span className="sidebar__text">Planning</span>}
              </NavLink>
            </li>

            <li className="sidebar__menu-item">
              <NavLink
                to="/clients"
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
                title="Clients"
                onClick={() => window.innerWidth <= 768 && onToggle()}
              >
                <span className="sidebar__icon">👥</span>
                {isExpanded && <span className="sidebar__text">Clients</span>}
              </NavLink>
            </li>

            <li className="sidebar__menu-item">
              <NavLink
                to="/vehicles"
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
                title="Véhicules"
                onClick={() => window.innerWidth <= 768 && onToggle()}
              >
                <span className="sidebar__icon">🚗</span>
                {isExpanded && <span className="sidebar__text">Véhicules</span>}
              </NavLink>
            </li>

            <li className="sidebar__menu-item">
              <NavLink
                to="/stock"
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
                title="Stock"
                onClick={() => window.innerWidth <= 768 && onToggle()}
              >
                <span className="sidebar__icon">📦</span>
                {isExpanded && <span className="sidebar__text">Stock</span>}
              </NavLink>
            </li>

            <li className="sidebar__menu-item">
              <NavLink
                to="/fournisseurs"
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
                title="Fournisseurs"
                onClick={() => window.innerWidth <= 768 && onToggle()}
              >
                <span className="sidebar__icon">🏭</span>
                {isExpanded && <span className="sidebar__text">Fournisseurs</span>}
              </NavLink>
            </li>

            <li className="sidebar__menu-item">
              <NavLink
                to="/factures"
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
                title="Factures"
                onClick={() => window.innerWidth <= 768 && onToggle()}
              >
                <span className="sidebar__icon">💰</span>
                {isExpanded && <span className="sidebar__text">Factures</span>}
              </NavLink>
            </li>

            {/* 🔧 PARAMÈTRES — terrain préparé pour plus tard */}
            <li className="sidebar__menu-item sidebar__menu-item--bottom">
              <NavLink
                to="/parametres"
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
                title="Paramètres"
                onClick={() => window.innerWidth <= 768 && onToggle()}
              >
                <span className="sidebar__icon">⚙️</span>
                {isExpanded && <span className="sidebar__text">Paramètres</span>}
              </NavLink>
            </li>

          </ul>
        </nav>

        {/* FOOTER */}
        {isExpanded && (
          <div className="sidebar__footer">
            <p className="sidebar__footer-text">v1.0.0</p>
          </div>
        )}

      </aside>
    </>
  );
};

export default Sidebar;