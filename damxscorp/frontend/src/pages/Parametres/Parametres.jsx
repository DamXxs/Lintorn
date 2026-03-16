// /frontend/src/pages/Parametres/Parametres.jsx
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useReferentiels } from '../../context/ReferentielsContext';
import ReferentielEditor from './ReferentielEditor';
import { Palette, Bell, Bot } from 'lucide-react';
import './Parametres.css';

const Parametres = () => {
  const { themeName, setTheme, themes } = useTheme();
  const { referentiels, loading, reload } = useReferentiels();

  return (
    <div className="parametres-page">
      <h1 className="parametres-title">⚙️ Paramètres</h1>

      {/* THÈMES */}
      <section className="param-section">
        <h2 className="param-section__title"><Palette size={16} /> Thème de l'interface</h2>
        <div className="theme-grid">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              className={`theme-card ${themeName === key ? 'theme-card--active' : ''}`}
              onClick={() => setTheme(key)}
            >
              <span className="theme-card__icon">{theme.icon}</span>
              <span className="theme-card__name">{theme.name}</span>
              <div className="theme-card__preview">
                <span style={{ background: theme.variables['--bg'] }} />
                <span style={{ background: theme.variables['--panel'] }} />
                <span style={{ background: theme.variables['--accent'] }} />
              </div>
              {themeName === key && <span className="theme-card__badge">✓ Actif</span>}
            </button>
          ))}
        </div>
      </section>

      {/* RÉFÉRENTIELS */}
      {loading ? (
        <section className="param-section">
          <p className="param-placeholder">⏳ Chargement des référentiels...</p>
        </section>
      ) : (
        <>
          <section className="param-section">
            <h2 className="param-section__title">🚗 Types de véhicules</h2>
            <p className="param-description">
              Définissez les types de véhicules que vous acceptez dans votre garage.
              Désactivez ceux dont vous n'avez pas besoin — ils n'apparaîtront plus dans les formulaires.
            </p>
            <ReferentielEditor
              categorie="TYPE_VEHICULE"
              items={referentiels.TYPE_VEHICULE}
              onReload={reload}
            />
          </section>

          <section className="param-section">
            <h2 className="param-section__title">🔧 Types d'interventions</h2>
            <p className="param-description">
              Personnalisez les types d'interventions selon votre activité.
              La couleur est utilisée dans le calendrier planning.
            </p>
            <ReferentielEditor
              categorie="TYPE_INTERVENTION"
              items={referentiels.TYPE_INTERVENTION}
              onReload={reload}
            />
          </section>

          <section className="param-section">
            <h2 className="param-section__title">📦 Catégories de stock</h2>
            <p className="param-description">
              Organisez vos pièces par catégories adaptées à votre stock.
            </p>
            <ReferentielEditor
              categorie="CATEGORIE_STOCK"
              items={referentiels.CATEGORIE_STOCK}
              onReload={reload}
            />
          </section>
        </>
      )}

      {/* FUTURES OPTIONS */}
      <section className="param-section">
        <h2 className="param-section__title"><Bell size={16} /> Notifications ...</h2>
        <p className="param-placeholder">Gestion des alertes de stock, rappels RDV...</p>
      </section>

      <section className="param-section">
        <h2 className="param-section__title"><Bot size={16} /> IA & Messagerie ...</h2>
        <p className="param-placeholder">Configuration de l'assistant IA pour les RDV automatiques...</p>
      </section>

    </div>
  );
};

export default Parametres;