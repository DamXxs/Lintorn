// /frontend/src/components/layout/Header.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleAlert, Loader, Menu, X } from '../../utils/icons';
import GlobalSearch from '../shared/SearchBar/GlobalSearch';
import './Header.css';

const Header = ({ isSidebarExpanded, onToggleSidebar }) => {
  const navigate = useNavigate();
  const [djangoStatus, setDjangoStatus] = useState('checking');

  // Ref vers le GlobalSearch pour le focus via Ctrl+K
  const searchRef = useRef(null);

  // ── Vérification connexion Django ────────────────────────────
  const checkDjangoConnection = async () => {
    try {
      // URL relative → fonctionne avec le proxy craco en local ET sur Codespaces
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

  // ── Raccourci clavier Ctrl+K → focus la recherche ────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Focus l'input dans le GlobalSearch
        const input = searchRef.current?.querySelector('input');
        if (input) input.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Quand l'utilisateur clique un résultat → ouvre la fiche ──
  // Pour l'instant on navigue vers la page correspondante.
  // Plus tard, on pourra ouvrir directement une modale.
  const handleSelectItem = useCallback((item) => {
    // Navigue vers la page avec l'ID dans le state
    // pour que la page ouvre automatiquement la fiche
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

      {/* ── DROITE : Statut Django ─────────────────────────── */}
      <div className="header__right">
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
              {djangoStatus === 'error' && 'Serveur déconnecté'}
            </span>
          </div>
        )}
      </div>

    </header>
  );
};

export default Header;