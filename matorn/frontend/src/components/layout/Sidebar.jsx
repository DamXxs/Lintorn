// /frontend/src/components/layout/Sidebar.jsx
// MODIFICATION : ajout du lien "Archives" avec l'icône PiArchiveFill

import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, CalendarClock, Wrench, Users, Car, Package, Factory, Receipt, Settings } from '../../utils/icons';
import { PiArchiveFill } from 'react-icons/pi';
import './Sidebar.css';

const Sidebar = ({ isExpanded, onToggle }) => {

  // Ferme la sidebar au clic dehors (mobile uniquement)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth <= 768 && isExpanded) {
        const sidebar = document.querySelector('.sidebar');
        const header = document.querySelector('.header');
        if (sidebar && !sidebar.contains(e.target) && !header.contains(e.target)) {
          onToggle();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isExpanded, onToggle]);

  // Bloque le scroll du body quand sidebar ouverte sur mobile
  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.style.overflow = isExpanded ? 'hidden' : '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isExpanded]);

  // Liens de navigation principaux
  const navLinks = [
    { to: '/planning',     icon: CalendarDays,  label: 'Planning' },
    { to: '/rdv',          icon: CalendarClock,  label: 'Rendez-vous' },
    { to: '/ordres-reparation', icon: Wrench,        label: 'Ordres de réparation' },
    { to: '/clients',      icon: Users,          label: 'Clients' },
    { to: '/vehicles',     icon: Car,            label: 'Véhicules' },
    { to: '/stock',        icon: Package,        label: 'Stock' },
    { to: '/fournisseurs', icon: Factory,        label: 'Fournisseurs' },
    { to: '/factures',     icon: Receipt,        label: 'Devis/Factures' },
  ];

  return (
    <>
      {/* Overlay mobile (fond sombre) */}
      {isExpanded && <div className="sidebar__overlay" onClick={onToggle} />}

      <aside
        className={`sidebar ${isExpanded ? 'sidebar--expanded' : 'sidebar--collapsed'}`}
      >
        {/* NAVIGATION */}
        <nav className="sidebar__nav">
          <ul className="sidebar__menu">

            {/* Liens principaux */}
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
                  <span className="sidebar__text">{label}</span>
                </NavLink>
              </li>
            ))}

            {/* 🆕 ARCHIVES & CORBEILLE — séparé visuellement */}
            <li className="sidebar__menu-item" style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
              <NavLink
                to="/archives"
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
                title="Archives & Corbeille"
                onClick={() => window.innerWidth <= 768 && onToggle()}
              >
                <span className="sidebar__icon">
                  <PiArchiveFill size={20} />
                </span>
                <span className="sidebar__text">Archives</span>
              </NavLink>
            </li>

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
                <span className="sidebar__text">Paramètres</span>
              </NavLink>
            </li>

          </ul>
        </nav>

        {/* FOOTER (visible seulement quand étendu ou hover) */}
        <div className="sidebar__footer">
          <p className="sidebar__footer-text">v0.0.90</p>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;