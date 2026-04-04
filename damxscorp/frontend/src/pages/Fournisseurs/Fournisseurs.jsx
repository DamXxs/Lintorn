// /frontend/src/pages/Fournisseurs/Fournisseurs.jsx
// Page principale Fournisseurs — gère uniquement l'état et la mise en page.
// Les composants visuels sont dans leurs propres fichiers :
//   CardFournisseur.jsx / ModalFournisseur.jsx / ModalEmailPreRempli.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchFournisseurs,
  createFournisseur,
  updateFournisseur,
  patchFournisseur,
  deleteFournisseur,
  fetchPiecesEnAlerte,
} from '../../services/fournisseurService';
import CardFournisseur, { CATEGORIES } from './CardFournisseur';
import ModalFournisseur from './ModalFournisseur';
import ModalEmailPreRempli from './ModalEmailPreRempli';
import './Fournisseurs.css';

// ─────────────────────────────────────────────────────────────────────────────
// PAGE FOURNISSEURS
// ─────────────────────────────────────────────────────────────────────────────

const Fournisseurs = () => {
  // ── Données ────────────────────────────────────────────────────────────────
  const [fournisseurs, setFournisseurs] = useState([]);
  const [stockAlertes, setStockAlertes] = useState({ alerte: [], rupture: [] });
  const [loading, setLoading]           = useState(true);
  const [erreur,  setErreur]            = useState(null);

  // ── Filtres ────────────────────────────────────────────────────────────────
  const [recherche,       setRecherche]       = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('TOUS');

  // ── Modals (null = fermé) ──────────────────────────────────────────────────
  // modalForm : null = fermé | {} = création | {id, ...} = édition
  const [modalForm,  setModalForm]  = useState(null);
  // modalEmail : null = fermé | objet fournisseur = ouvert
  const [modalEmail, setModalEmail] = useState(null);

  // ── Chargement ─────────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    try {
      setLoading(true);
      // On charge les fournisseurs et les alertes stock en parallèle
      const [fData, sData] = await Promise.all([
        fetchFournisseurs(),
        fetchPiecesEnAlerte(),
      ]);
      setFournisseurs(fData);
      setStockAlertes(sData);
    } catch (err) {
      setErreur('Impossible de charger les fournisseurs. Vérifie que le backend tourne.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSave = async (formData) => {
    if (formData.id) {
      await updateFournisseur(formData.id, formData);
    } else {
      await createFournisseur(formData);
    }
    await charger();
  };

  const handleToggleFavori = async (fournisseur) => {
    await patchFournisseur(fournisseur.id, { est_favori: !fournisseur.est_favori });
    await charger();
  };

  const handleDelete = async (fournisseur) => {
    if (!window.confirm(`Supprimer "${fournisseur.nom}" ?`)) return;
    try {
      await deleteFournisseur(fournisseur.id);
      await charger();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  // ── Filtrage & tri ─────────────────────────────────────────────────────────

  const fournisseursFiltres = fournisseurs
    .filter(f => {
      const texte = recherche.toLowerCase();
      const matchRecherche = !texte
        || f.nom.toLowerCase().includes(texte)
        || f.email.toLowerCase().includes(texte)
        || (f.contact_nom && f.contact_nom.toLowerCase().includes(texte));
      const matchCategorie = filtreCategorie === 'TOUS' || f.categorie === filtreCategorie;
      return matchRecherche && matchCategorie;
    })
    // Favoris toujours en premier, puis tri alphabétique
    .sort((a, b) => {
      if (a.est_favori && !b.est_favori) return -1;
      if (!a.est_favori && b.est_favori) return 1;
      return a.nom.localeCompare(b.nom, 'fr');
    });

  // Séparation favoris / groupés par catégorie
  const favoris     = fournisseursFiltres.filter(f => f.est_favori);
  const parCategorie = CATEGORIES
    .map(cat => ({
      ...cat,
      items: fournisseursFiltres.filter(f => !f.est_favori && f.categorie === cat.value),
    }))
    .filter(cat => cat.items.length > 0);

  // ── Rendu ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="fournisseurs-page">
      <div className="fournisseurs-loading">⏳ Chargement des fournisseurs…</div>
    </div>
  );

  if (erreur) return (
    <div className="fournisseurs-page">
      <div className="fournisseurs-erreur">❌ {erreur}</div>
    </div>
  );

  return (
    <div className="fournisseurs-page">

      {/* ── MINI DASHBOARD STOCK ──────────────────────────────────────────── */}
      <div className="fournisseurs-stock-header">
        <span className="stock-header-label">Stock en temps réel :</span>
        <a href="/stock" className={`stock-badge ${stockAlertes.alerte.length === 0 ? 'stock-badge--ok' : 'stock-badge--alerte'}`}>
          ⚠️ {stockAlertes.alerte.length} en alerte
        </a>
        <a href="/stock" className={`stock-badge ${stockAlertes.rupture.length === 0 ? 'stock-badge--ok' : 'stock-badge--rupture'}`}>
          🔴 {stockAlertes.rupture.length} en rupture
        </a>
      </div>

      {/* ── EN-TÊTE PAGE ──────────────────────────────────────────────────── */}
      <div className="fournisseurs-header">
        <div>
          <h1>🏭 Fournisseurs</h1>
          <p className="fournisseurs-subtitle">
            {fournisseurs.length} fournisseur{fournisseurs.length > 1 ? 's' : ''} enregistré{fournisseurs.length > 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-add-fournisseur" onClick={() => setModalForm({})}>
          ➕ Ajouter un fournisseur
        </button>
      </div>

      {/* ── FILTRES ───────────────────────────────────────────────────────── */}
      <div className="fournisseurs-filtres">
        <input
          className="fournisseurs-search"
          placeholder="🔍 Rechercher par nom, email, contact…"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
        />
        <div className="categorie-tabs">
          <button
            className={`categorie-tab ${filtreCategorie === 'TOUS' ? 'categorie-tab--actif' : ''}`}
            onClick={() => setFiltreCategorie('TOUS')}
          >
            Tous
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              className={`categorie-tab ${filtreCategorie === c.value ? 'categorie-tab--actif' : ''}`}
              onClick={() => setFiltreCategorie(c.value)}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LISTE ─────────────────────────────────────────────────────────── */}
      {fournisseursFiltres.length === 0 ? (
        <div className="fournisseurs-vide">
          {fournisseurs.length === 0
            ? '🏭 Aucun fournisseur enregistré. Commencez par en ajouter un !'
            : '🔍 Aucun fournisseur ne correspond à votre recherche.'}
        </div>
      ) : (
        <>
          {/* Section favoris */}
          {favoris.length > 0 && (
            <section className="fournisseurs-section">
              <h2 className="section-titre section-titre--favoris">⭐ Favoris</h2>
              <div className="fournisseurs-grid">
                {favoris.map(f => (
                  <CardFournisseur
                    key={f.id}
                    fournisseur={f}
                    onEdit={setModalForm}
                    onDelete={handleDelete}
                    onToggleFavori={handleToggleFavori}
                    onEmail={setModalEmail}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Sections par catégorie */}
          {parCategorie.map(cat => (
            <section key={cat.value} className="fournisseurs-section">
              <h2 className="section-titre">{cat.icon} {cat.label}</h2>
              <div className="fournisseurs-grid">
                {cat.items.map(f => (
                  <CardFournisseur
                    key={f.id}
                    fournisseur={f}
                    onEdit={setModalForm}
                    onDelete={handleDelete}
                    onToggleFavori={handleToggleFavori}
                    onEmail={setModalEmail}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {/* ── MODALS ────────────────────────────────────────────────────────── */}
      {modalForm !== null && (
        <ModalFournisseur
          fournisseur={modalForm?.id ? modalForm : null}
          onSave={handleSave}
          onClose={() => setModalForm(null)}
        />
      )}
      {modalEmail && (
        <ModalEmailPreRempli
          fournisseur={modalEmail}
          onClose={() => setModalEmail(null)}
        />
      )}
    </div>
  );
};

export default Fournisseurs;
