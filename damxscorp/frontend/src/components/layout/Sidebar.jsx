// /frontend/src/components/layout/Sidebar.jsx
import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, Users, Car, Package,Factory, Receipt, Settings, Menu, X } from '../../utils/icons';
import './Sidebar.css';

const Sidebar = ({ isExpanded, onToggle }) => {

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth <= 768 && isExpanded) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.contains(e.target)) onToggle();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isExpanded, onToggle]);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.style.overflow = isExpanded ? 'hidden' : '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isExpanded]);

  // Liens de navigation
  const navLinks = [
    { to: '/planning',    icon: CalendarDays, label: 'Planning' },
    { to: '/clients',     icon: Users,        label: 'Clients' },
    { to: '/vehicles',    icon: Car,          label: 'Véhicules' },
    { to: '/stock',       icon: Package,      label: 'Stock' },
    { to: '/fournisseurs',icon: Factory,      label: 'Fournisseurs' },
    { to: '/factures',    icon: Receipt,      label: 'Factures' },
  ];

  return (
    <>
      {isExpanded && <div className="sidebar__overlay" onClick={onToggle} />}

      <aside className={`sidebar ${isExpanded ? 'sidebar--expanded' : 'sidebar--collapsed'}`}>

        {/* BOUTON TOGGLE */}
        <button
          className="sidebar__toggle"
          onClick={onToggle}
          aria-label={isExpanded ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {isExpanded ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* HEADER */}
        {isExpanded && (
          <div className="sidebar__header">
            <h2 className="sidebar__title">MATORN</h2>
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="sidebar__nav">
          <ul className="sidebar__menu">

            {navLinks.map(({ to, icon: Icon, label }) => (
              <li key={to} className="sidebar__menu-item">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                  }
                  title={label}
                  onClick={() => window.innerWidth <= 768 && onToggle()}
                >
                  <span className="sidebar__icon"><Icon size={20} /></span>
                  {isExpanded && <span className="sidebar__text">{label}</span>}
                </NavLink>
              </li>
            ))}

            {/* PARAMÈTRES — collé en bas */}
            <li className="sidebar__menu-item sidebar__menu-item--bottom">
              <NavLink
                to="/parametres"
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
                title="Paramètres"
                onClick={() => window.innerWidth <= 768 && onToggle()}
              >
                <span className="sidebar__icon"><Settings size={20} /></span>
                {isExpanded && <span className="sidebar__text">Paramètres</span>}
              </NavLink>
            </li>

          </ul>
        </nav>

        {/* FOOTER */}
        {isExpanded && (
          <div className="sidebar__footer">
            <p className="sidebar__footer-text">v14.1.0</p>
          </div>
        )}

      </aside>
    </>
  );
};

export default Sidebar;