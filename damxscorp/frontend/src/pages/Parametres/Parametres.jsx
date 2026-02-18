// /frontend/src/pages/Parametres/Parametres.jsx
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './Parametres.css';

const Parametres = () => {
  const { themeName, setTheme, themes } = useTheme();

  return (
    <div className="parametres-page">
      <h1 className="parametres-title">⚙️ Paramètres</h1>

      {/* THÈMES */}
      <section className="param-section">
        <h2 className="param-section__title">🎨 Thème de l'interface</h2>
        <div className="theme-grid">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              className={`theme-card ${themeName === key ? 'theme-card--active' : ''}`}
              onClick={() => setTheme(key)}
            >
              <span className="theme-card__icon">{theme.icon}</span>
              <span className="theme-card__name">{theme.name}</span>
              {/* Aperçu des couleurs du thème */}
              <div className="theme-card__preview">
                <span style={{ background: theme.variables['--bg'] }} />
                <span style={{ background: theme.variables['--panel'] }} />
                <span style={{ background: theme.variables['--accent'] }} />
              </div>
              {themeName === key && (
                <span className="theme-card__badge">✓ Actif</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* PLACEHOLDER pour futures options */}
      <section className="param-section">
        <h2 className="param-section__title">🔔 Notifications <span className="coming-soon">Bientôt</span></h2>
        <p className="param-placeholder">Gestion des alertes de stock, rappels RDV...</p>
      </section>

      <section className="param-section">
        <h2 className="param-section__title">🤖 IA & Messagerie <span className="coming-soon">Bientôt</span></h2>
        <p className="param-placeholder">Configuration de l'assistant IA pour les RDV automatiques...</p>
      </section>

    </div>
  );
};

export default Parametres;