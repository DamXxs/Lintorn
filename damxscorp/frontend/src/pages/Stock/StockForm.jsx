// /frontend/src/pages/Stock/StockForm.jsx
// Modal pour créer ou modifier une pièce de stock.
import React, { useState, useEffect } from 'react';
import { fetchFournisseurs } from '../../services/fournisseurService';
import './StockForm.css';

// ── Catégories de pièces (synchronisées avec stock/models.py) ────────────────
const CATEGORIES_PIECE = [
  { value: 'FILTRATION',   label: 'Filtration' },
  { value: 'HUILES',       label: 'Huiles & Liquides' },
  { value: 'FREINAGE',     label: 'Freinage' },
  { value: 'PNEUMATIQUE',  label: 'Pneumatiques' },
  { value: 'ELECTRICITE',  label: 'Électricité' },
  { value: 'MECANIQUE',    label: 'Mécanique' },
  { value: 'CARROSSERIE',  label: 'Carrosserie' },
  { value: 'AUTRE',        label: 'Autre' },
];

// ── Formulaire vide pour la création ────────────────────────────────────────
const PIECE_VIDE = {
  reference:      '',
  nom:            '',
  description:    '',
  categorie:      'AUTRE',
  prix_achat:     '',
  prix_vente:     '',
  stock_actuel:   0,
  stock_minimum:  5,
  fournisseur:    '',   // ancien champ texte (compat)
  fournisseur_ref: '',  // ID FK vers la fiche fournisseur
  delai_livraison: 2,
};

/**
 * StockForm
 * Modal de création / modification d'une pièce.
 *
 * Props :
 *   piece   – null = création | objet = édition
 *   onSave  – fn(formData) → doit appeler l'API et actualiser la liste
 *   onClose – fn() → ferme le modal
 */
const StockForm = ({ piece, onSave, onClose }) => {
  const [form,         setForm]         = useState(piece || PIECE_VIDE);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [erreur,       setErreur]       = useState(null);

  // Charge la liste des fournisseurs actifs pour le sélecteur
  useEffect(() => {
    fetchFournisseurs(true)  // true = actifs seulement
      .then(setFournisseurs)
      .catch(() => setFournisseurs([]));
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      // Les champs numériques sont convertis en nombre
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErreur(null);

    // Nettoyage : si fournisseur_ref est vide, on envoie null
    const payload = {
      ...form,
      fournisseur_ref: form.fournisseur_ref || null,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isEdition = Boolean(piece?.id);

  return (
    <div className="stockform-overlay" onClick={onClose}>
      <div className="stockform-box" onClick={e => e.stopPropagation()}>

        {/* En-tête */}
        <div className="stockform-header">
          <h2>{isEdition ? `✏️ Modifier — ${piece.nom}` : '➕ Nouvelle pièce'}</h2>
          <button className="stockform-close" onClick={onClose} title="Fermer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="stockform-form">

          {erreur && <div className="stockform-error">{erreur}</div>}

          {/* ── Section Identification ── */}
          <fieldset className="sf-fieldset">
            <legend className="sf-legend">Identification</legend>

            <div className="sf-row">
              <div className="sf-group">
                <label>Référence *</label>
                <input
                  name="reference"
                  value={form.reference}
                  onChange={handleChange}
                  placeholder="Ex : FLT-OIL-001"
                  required
                />
              </div>
              <div className="sf-group sf-group--large">
                <label>Nom de la pièce *</label>
                <input
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  placeholder="Ex : Filtre à huile"
                  required
                />
              </div>
            </div>

            <div className="sf-row">
              <div className="sf-group">
                <label>Catégorie</label>
                <select name="categorie" value={form.categorie} onChange={handleChange}>
                  {CATEGORIES_PIECE.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="sf-group">
                <label>Délai livraison (jours)</label>
                <input
                  name="delai_livraison"
                  type="number"
                  min={0}
                  value={form.delai_livraison}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="sf-group">
              <label>Description / compatibilité</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                placeholder="Compatibilité véhicules, spécifications techniques…"
              />
            </div>
          </fieldset>

          {/* ── Section Prix ── */}
          <fieldset className="sf-fieldset">
            <legend className="sf-legend">Prix</legend>
            <div className="sf-row">
              <div className="sf-group">
                <label>Prix d'achat HT (€) *</label>
                <input
                  name="prix_achat"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.prix_achat}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="sf-group">
                <label>Prix de vente TTC (€) *</label>
                <input
                  name="prix_vente"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.prix_vente}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>
              {/* Affichage de la marge en temps réel */}
              {form.prix_achat > 0 && form.prix_vente > 0 && (
                <div className="sf-marge-preview">
                  Marge : <strong>
                    {(form.prix_vente - form.prix_achat).toFixed(2)} €
                    ({(((form.prix_vente - form.prix_achat) / form.prix_achat) * 100).toFixed(1)} %)
                  </strong>
                </div>
              )}
            </div>
          </fieldset>

          {/* ── Section Stock ── */}
          <fieldset className="sf-fieldset">
            <legend className="sf-legend">Stock</legend>
            <div className="sf-row">
              <div className="sf-group">
                <label>Stock actuel</label>
                <input
                  name="stock_actuel"
                  type="number"
                  min={0}
                  value={form.stock_actuel}
                  onChange={handleChange}
                />
              </div>
              <div className="sf-group">
                <label>Seuil minimum (alerte)</label>
                <input
                  name="stock_minimum"
                  type="number"
                  min={0}
                  value={form.stock_minimum}
                  onChange={handleChange}
                />
              </div>
            </div>
            <p className="sf-aide">
              ℹ️ Une alerte sera déclenchée dès que le stock descend sous le seuil minimum.
            </p>
          </fieldset>

          {/* ── Section Fournisseur ── */}
          <fieldset className="sf-fieldset">
            <legend className="sf-legend">Fournisseur</legend>

            <div className="sf-group">
              <label>Fiche fournisseur liée</label>
              <select
                name="fournisseur_ref"
                value={form.fournisseur_ref || ''}
                onChange={handleChange}
              >
                <option value="">— Aucun fournisseur lié —</option>
                {fournisseurs.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nom} ({f.categorie})
                  </option>
                ))}
              </select>
              <span className="sf-aide">
                Lier une fiche fournisseur permet de générer les emails de commande automatiquement.
              </span>
            </div>

            <div className="sf-group">
              <label>Fournisseur (texte libre — ancien champ)</label>
              <input
                name="fournisseur"
                value={form.fournisseur}
                onChange={handleChange}
                placeholder="Ex : Autodis — à remplir si pas de fiche liée"
              />
            </div>
          </fieldset>

          {/* Pied */}
          <div className="stockform-footer">
            <button type="button" className="sf-btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="sf-btn-save" disabled={saving}>
              {saving ? 'Enregistrement…' : (isEdition ? '💾 Enregistrer' : '➕ Créer la pièce')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default StockForm;
