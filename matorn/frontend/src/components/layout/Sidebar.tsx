// /frontend/src/components/layout/Sidebar.tsx
import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, CalendarClock, Wrench, Users, Car, Package, Factory, Receipt, Settings, Archive } from '../../utils/icons';
import './Sidebar.css';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarProps {
  isExpanded: boolean;
  onToggle:   () => void;
}

interface NavItem {
  to:    string;
  icon:  React.ComponentType<{ size?: number }>;
  label: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LIENS DE NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────

const navLinks: NavItem[] = [
  { to: '/planning',            icon: CalendarDays,                                          label: 'Planning'              },
  { to: '/rdv',                 icon: CalendarClock,                                         label: 'Rendez-vous'           },
  { to: '/ordres-reparation',   icon: Wrench,                                                label: 'Ordres de réparation'  },
  { to: '/clients',             icon: Users,                                                 label: 'Clients'               },
  { to: '/vehicles',            icon: Car,                                                   label: 'Véhicules'             },
  { to: '/stock',               icon: Package,                                               label: 'Stock'                 },
  { to: '/fournisseurs',        icon: Factory,                                               label: 'Fournisseurs'          },
  { to: '/factures',            icon: Receipt,                                               label: 'Devis/Factures'        },
  { to: '/archives',            icon: Archive,                                               label: 'Archives'              },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onToggle }) => {

  // Ferme la sidebar au clic dehors (mobile uniquement)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (window.innerWidth <= 768 && isExpanded) {
        const sidebar = document.querySelector('.sidebar');
        const header  = document.querySelector('.header');
        if (
          sidebar && !sidebar.contains(e.target as Node) &&
          header  && !header.contains(e.target as Node)
        ) {
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

  const closeMobile = () => { if (window.innerWidth <= 768) onToggle(); };

  return (
    <>
      {/* Overlay mobile */}
      {isExpanded && <div className="sidebar__overlay" onClick={onToggle} />}

      <aside className={`sidebar ${isExpanded ? 'sidebar--expanded' : 'sidebar--collapsed'}`}>

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
                  onClick={closeMobile}
                >
                  <span className="sidebar__icon"><Icon size={20} /></span>
                  <span className="sidebar__text">{label}</span>
                </NavLink>
              </li>
            ))}

            {/* PARAMÈTRES — séparateur + collé en bas */}
            <li className="sidebar__menu-item sidebar__menu-item--bottom">
              <NavLink
                to="/parametres"
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
                title="Paramètres"
                onClick={closeMobile}
              >
                <span className="sidebar__icon"><Settings size={20} /></span>
                <span className="sidebar__text">Paramètres</span>
              </NavLink>
            </li>

          </ul>
        </nav>

        {/* FOOTER */}
        <div className="sidebar__footer">
          <p className="sidebar__footer-text">v0.0.90</p>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
