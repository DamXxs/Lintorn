// /frontend/src/pages/Parametres/Parametres.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useReferentiels } from '../../context/ReferentielsContext';
import ReferentielEditor from './Referentiels/ReferentielEditor';
import DepartementEditor from './DepartementEditor';
import CollaborateurEditor from './CollaborateurEditor';
import ParametresFacturation from './ParametresFacturation';
import { fetchDepartements, fetchCollaborateurs } from '../../services/api';
import {
  Palette, Bell, Bot, Settings, Loader,
  Car, Wrench, Package, Factory, Users, Tag, Banknote
} from '../../utils/icons';
import './Parametres.css';
import '../../components/shared/list-page.css';

const Parametres = () => {
  const { themeName, setTheme, themes } = useTheme();
  const { referentiels, loading, reload } = useReferentiels();

  // ── Données chargées depuis l'API ─────────────────────────────────────────
  const [departements,    setDepartements]    = useState([]);
  const [collaborateurs,  setCollaborateurs]  = useState([]);
  const [loadingDepts,    setLoadingDepts]    = useState(true);
  const [loadingCollabs,  setLoadingCollabs]  = useState(true);

  const reloadDepartements = () => {
    setLoadingDepts(true);
    fetchDepartements()
      .then(setDepartements)
      .finally(() => setLoadingDepts(false));
  };

  const reloadCollaborateurs = () => {
    setLoadingCollabs(true);
    fetchCollaborateurs()
      .then(setCollaborateurs)
      .finally(() => setLoadingCollabs(false));
  };

  useEffect(() => {
    reloadDepartements();
    reloadCollaborateurs();
  }, []);

  return (
    <div className="list-page">
      <h1 className="parametres-title"><Settings size={20} /> Paramètres</h1>

      {/* ── THÈMES ─────────────────────────────────────────────────────────── */}
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

      {/* ── DÉPARTEMENTS ───────────────────────────────────────────────────── */}
      <section className="param-section">
        <h2 className="param-section__title"><Factory size={16} /> Départements</h2>
        <p className="param-description">
          Définissez les départements de votre garage (ex : Atelier, Académie, Carrosserie…).
          Chaque département apparaît dans le formulaire de prise de RDV.
          Il doit en rester <strong>au moins un actif</strong>.
        </p>
        {loadingDepts ? (
          <p className="param-placeholder"><Loader size={14} /> Chargement...</p>
        ) : (
          <DepartementEditor departements={departements} onReload={reloadDepartements} />
        )}
      </section>

      {/* ── ÉQUIPE / COLLABORATEURS ─────────────────────────────────────────── */}
      <section className="param-section">
        <h2 className="param-section__title"><Users size={16} /> Équipe</h2>
        <p className="param-description">
          Gérez les membres de votre équipe. Chaque collaborateur apparaîtra dans le planning
          avec sa propre couleur pour faciliter la lecture du calendrier.
        </p>
        {loadingCollabs ? (
          <p className="param-placeholder"><Loader size={14} /> Chargement...</p>
        ) : (
          <CollaborateurEditor collaborateurs={collaborateurs} onReload={reloadCollaborateurs} />
        )}
      </section>

      {/* ── RÉFÉRENTIELS ───────────────────────────────────────────────────── */}
      {loading ? (
        <section className="param-section">
          <p className="param-placeholder"><Loader size={14} /> Chargement des référentiels...</p>
        </section>
      ) : (
        <>
          <section className="param-section">
            <h2 className="param-section__title"><Car size={16} /> Types de véhicules</h2>
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
            <h2 className="param-section__title"><Wrench size={16} /> Types d'interventions</h2>
            <p className="param-description">
              Personnalisez les types d'interventions selon votre activité.
            </p>
            <ReferentielEditor
              categorie="TYPE_INTERVENTION"
              items={referentiels.TYPE_INTERVENTION}
              onReload={reload}
            />
          </section>

          <section className="param-section">
            <h2 className="param-section__title"><Package size={16} /> Catégories de stock</h2>
            <p className="param-description">
              Organisez vos pièces par catégories adaptées à votre stock.
            </p>
            <ReferentielEditor
              categorie="CATEGORIE_STOCK"
              items={referentiels.CATEGORIE_STOCK}
              onReload={reload}
            />
          </section>

          <section className="param-section">
            <h2 className="param-section__title"><Tag size={16} /> Catégories de fournisseurs</h2>
            <p className="param-description">
              Personnalisez les catégories de vos fournisseurs (pneumatiques, pièces, carrosserie…).
              Elles apparaissent dans la page Fournisseurs pour filtrer et classer vos contacts.
            </p>
            <ReferentielEditor
              categorie="CATEGORIE_FOURNISSEUR"
              items={referentiels.CATEGORIE_FOURNISSEUR}
              onReload={reload}
            />
          </section>
        </>
      )}

      {/* ── PARAMÈTRES DE FACTURATION ──────────────────────────────────────── */}
      <section className="param-section">
        <h2 className="param-section__title"><Banknote size={16} /> Facturation</h2>
        <p className="param-description">
          Configurez le taux de TVA et les forfaits main d'œuvre utilisés dans vos devis et factures.
        </p>
        <ParametresFacturation embedded />
      </section>

      {/* ── FUTURES OPTIONS ────────────────────────────────────────────────── */}
      <section className="param-section">
        <h2 className="param-section__title"><Bell size={16} /> Notifications <span className="coming-soon">bientôt</span></h2>
        <p className="param-placeholder">Alertes de stock, rappels RDV automatiques...</p>
      </section>

      <section className="param-section">
        <h2 className="param-section__title"><Bot size={16} /> IA & Messagerie <span className="coming-soon">bientôt</span></h2>
        <p className="param-placeholder">Assistant IA pour les prises de RDV automatiques...</p>
      </section>

    </div>
  );
};

export default Parametres;
