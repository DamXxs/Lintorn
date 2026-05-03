// /frontend/src/components/layout/Header.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleAlert, Loader, Menu, X } from '../../utils/icons';
import GlobalSearch from '../shared/SearchBar/GlobalSearch';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

// Couleurs par rôle — cohérent avec UtilisateursEditor
const ROLE_COULEURS = {
  user:       '#888',
  superuser:  '#2980b9',
  admin:      '#8e44ad',
  superadmin: '#e67e22',
};

const Header = ({ isSidebarExpanded, onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [djangoStatus, setDjangoStatus] = useState('checking');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchRef  = useRef(null);
  const userMenuRef = useRef(null);

  // ── Vérification connexion Django ────────────────────────────
  const checkDjangoConnection = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || '/api';
      const response = await fetch(`${apiBase}/health/`);
      setDjangoStatus(response.ok ? 'connected' : 'error');
    } catch {
      setDjangoStatus('error');
    }
  };

  useEffect(() => {
    checkDjangoConnection();
    const interval = setInterval(checkDjangoConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Raccourci clavier Ctrl+K ─────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = searchRef.current?.querySelector('input');
        if (input) input.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Ferme le menu user si clic en dehors ─────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Logout ───────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // ── Navigation depuis la recherche ───────────────────────────
  const handleSelectItem = useCallback((item) => {
    switch (item._type) {
      case 'client':
        navigate('/clients', { state: { openClientId: item._id } });
        break;
      case 'vehicule':
        navigate('/vehicles', { state: { openVehiculeId: item._id } });
        break;
      case 'piece':
        navigate('/stock', { state: { openPieceId: item._id } });
        break;
      case 'intervention':
        navigate('/rdv', { state: { openRdvId: item._id } });
        break;
      default:
        navigate(item._pageUrl);
    }
  }, [navigate]);

  // ── Initiales pour l'avatar ──────────────────────────────────
  const getInitiales = (username) =>
    username ? username.slice(0, 2).toUpperCase() : '??';

  const couleurAvatar = ROLE_COULEURS[user?.role] ?? '#888';

  return (
    <header className="header">

      {/* ── GAUCHE : Burger + Logo ─────────────────────────── */}
      <div className="header__left">
        <button
          className="header__burger"
          onClick={onToggleSidebar}
          aria-label={isSidebarExpanded ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {isSidebarExpanded ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="header__logo">MATORN</h1>
      </div>

      {/* ── CENTRE : Recherche globale ─────────────────────── */}
      <div className="header__center" ref={searchRef}>
        <GlobalSearch onSelectItem={handleSelectItem} />
      </div>

      {/* ── DROITE : Status + Avatar ───────────────────────── */}
      <div className="header__right">

        {/* Badge Django — seulement si problème */}
        {djangoStatus !== 'connected' && (
          <div className={`header__status header__status--${djangoStatus}`}>
            <span className="header__status-dot">
              {djangoStatus === 'checking'
                ? <Loader size={12} className="header__spin" />
                : <CircleAlert size={12} />
              }
            </span>
            <span className="header__status-text">
              {djangoStatus === 'checking' && 'Connexion...'}
              {djangoStatus === 'error'    && 'Serveur déconnecté'}
            </span>
          </div>
        )}

        {/* Avatar utilisateur + menu dropdown */}
        {user && (
          <div className="header__user" ref={userMenuRef}>
            <button
              className="header__avatar"
              style={{ background: couleurAvatar }}
              onClick={() => setShowUserMenu(p => !p)}
              title={`${user.username} — ${user.role}`}
            >
              {getInitiales(user.username)}
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="header__user-menu">
                <div className="header__user-info">
                  <span className="header__user-name">{user.username}</span>
                  <span className="header__user-role" style={{ color: couleurAvatar }}>
                    {user.role}
                  </span>
                </div>
                <div className="header__user-divider" />
                <button className="header__user-logout" onClick={handleLogout}>
                  🚪 Se déconnecter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </header>
  );
};

export default Header;