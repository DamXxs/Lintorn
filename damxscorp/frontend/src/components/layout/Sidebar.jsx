// /src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <aside className={`sidebar ${isExpanded ? 'sidebar--expanded' : 'sidebar--collapsed'}`}>
      
      {/* BOUTON TOGGLE */}
      <button 
        className="sidebar__toggle"
        onClick={toggleSidebar}
        aria-label={isExpanded ? "Réduire le menu" : "Agrandir le menu"}
      >
        {isExpanded ? '✕' : '☰'}
      </button>

      {/* HEADER (visible uniquement en mode étendu) */}
      <div className="sidebar__header">
        <h2 className="sidebar__title">🔧 DamXsCorp</h2>
        {isExpanded && <p className="sidebar__subtitle">Gestion Garage</p>}
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar__nav">
        <ul className="sidebar__menu">
          
          {/* PLANNING */}
          <li className="sidebar__menu-item">
            <NavLink 
              to="/planning" 
              className={({ isActive }) => 
                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
              }
              title="Planning"
            >
              <span className="sidebar__icon">📅</span>
              {isExpanded && <span className="sidebar__text">Planning</span>}
            </NavLink>
          </li>

          {/* CLIENTS */}
          <li className="sidebar__menu-item">
            <NavLink 
              to="/clients" 
              className={({ isActive }) => 
                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
              }
              title="Clients"
            >
              <span className="sidebar__icon">👥</span>
              {isExpanded && <span className="sidebar__text">Clients</span>}
            </NavLink>
          </li>

          {/* VÉHICULES */}
          <li className="sidebar__menu-item">
            <NavLink 
              to="/vehicles" 
              className={({ isActive }) => 
                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
              }
              title="Véhicules"
            >
              <span className="sidebar__icon">🚗</span>
              {isExpanded && <span className="sidebar__text">Véhicules</span>}
            </NavLink>
          </li>

          {/* STOCK */}
          <li className="sidebar__menu-item">
            <NavLink 
              to="/stock" 
              className={({ isActive }) => 
                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
              }
              title="Stock"
            >
              <span className="sidebar__icon">📦</span>
              {isExpanded && <span className="sidebar__text">Stock</span>}
            </NavLink>
          </li>

          {/* FOURNISSEURS */}
          <li className="sidebar__menu-item">
            <NavLink 
              to="/fournisseurs" 
              className={({ isActive }) => 
                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
              }
              title="Fournisseurs"
            >
              <span className="sidebar__icon">🏭</span>
              {isExpanded && <span className="sidebar__text">Fournisseurs</span>}
            </NavLink>
          </li>

          {/* FACTURES */}
          <li className="sidebar__menu-item">
            <NavLink 
              to="/factures" 
              className={({ isActive }) => 
                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
              }
              title="Factures"
            >
              <span className="sidebar__icon">💰</span>
              {isExpanded && <span className="sidebar__text">Factures</span>}
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
  );
};

export default Sidebar;