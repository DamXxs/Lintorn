// /frontend/src/pages/Stock/StockForm.jsx
//
// ══════════════════════════════════════════════════════════════════
//  STOCKFORM — Modal création / modification d'une pièce de stock
//
//  Utilise Modal.jsx pour :
//  - L'overlay (fond flou)
//  - Le header (titre + icône + X 22px)
//  - Le footer sticky (Annuler / Créer ou Enregistrer)
//
//  Ce composant gère uniquement :
//  - L'état du formulaire (form, errors, saving)
//  - La validation des champs
//  - L'appel à onSave() via handleSubmit
// ══════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import Modal from '../../components/shared/Modals/Modal';
import { fetchFournisseurs } from '../Fournisseurs/fournisseurService';
import { validateReference, validateNom, validatePrix } from '../../utils/validators';
import { Package, Save, Loader } from '../../utils/icons';
import { getApiError } from '../../utils/apiError';
import './StockForm.css';

// ── Formulaire vide pour la création ─────────────────────────────
const PIECE_VIDE = {
  reference:       '',
  nom:             '',
  description:     '',
  categorie:       'AUTRE',
  prix_achat:      '',
  prix_vente:      '',
  stock_actuel:    0,
  stock_minimum:   5,
  fournisseur_ref: '',
  delai_livraison: 2,
};

// ── Catégories synchronisées avec stock/models.py ─────────────────
const CATEGORIES_PIECE = [
  { value: 'FILTRATION',  label: 'Filtration' },
  { value: 'HUILES',      label: 'Huiles & Liquides' },
  { value: 'FREINAGE',    label: 'Freinage' },
  { value: 'PNEUMATIQUE', label: 'Pneumatiques' },
  { value: 'ELECTRICITE', label: 'Électricité' },
  { value: 'MECANIQUE',   label: 'Mécanique' },
  { value: 'CARROSSERIE', label: 'Carrosserie' },
  { value: 'AUTRE',       label: 'Autre' },
];

const StockForm = ({ piece, onSave, onClose }) => {
  const [form,         setForm]         = useState(piece || PIECE_VIDE);
  const [errors,       setErrors]       = useState({});
  const [fournisseurs, setFournisseurs] = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [erreur,       setErreur]       = useState(null);

  // Charge les fournisseurs actifs pour le sélecteur
  useEffect(() => {
    fetchFournisseurs(true)
      .then(setFournisseurs)
      .catch(() => setFournisseurs([]));
  }, []);

  // ── Gestion des changements ───────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  // ── Validation ────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    const referenceError  = validateReference(form.reference);
    const nomError        = validateNom(form.nom);
    const prixAchatError  = validatePrix(form.prix_achat,  'Le prix d\'achat');
    const prixVenteError  = validatePrix(form.prix_vente,  'Le prix de vente');

    if (referenceError) newErrors.reference  = referenceError;
    if (nomError)       newErrors.nom        = nomError;
    if (prixAchatError) newErrors.prix_achat = prixAchatError;
    if (prixVenteError) newErrors.prix_vente = prixVenteError;

    // Prix de vente doit être >= prix d'achat
    if (!prixAchatError && !prixVenteError && Number(form.prix_vente) < Number(form.prix_achat)) {
      newErrors.prix_vente = 'Le prix de vente doit être ≥ au prix d\'achat';
    }

    return newErrors;
  };

  // ── Soumission ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErreur(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSaving(false);
      return;
    }

    setErrors({});

    // Fournisseur vide → null pour Django
    const payload = {
      ...form,
      fournisseur_ref: form.fournisseur_ref || null,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setErreur(getApiError(err, 'Erreur lors de l\'enregistrement de la pièce'));
    } finally {
      setSaving(false);
    }
  };

  const isEdition = Boolean(piece?.id);

  return (
    <Modal
      title={isEdition ? `Modifier — ${piece.nom}` : 'Nouvelle pièce'}
      titleIcon={<Package size={16} />}
      onClose={onClose}
      footer={
        <>
          {/* FOOTER — Annuler + Créer/Enregistrer */}
          <button
            type="button"
            className="modal-btn modal-btn--cancel"
            onClick={onClose}
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="stock-form"
            className="modal-btn modal-btn--success"
            disabled={saving}
          >
            {saving
              ? <><Loader size={14} /> Enregistrement…</>
              : isEdition
                ? <><Save size={14} /> Enregistrer</>
                : <><Save size={14} /> Créer la pièce</>
            }
          </button>
        </>
      }
    >
      <form id="stock-form" onSubmit={handleSubmit} noValidate>

        {/* Erreur globale API */}
        {erreur && <div className="sf-error">{erreur}</div>}

        {/* ── IDENTIFICATION ───────────────────────────────────── */}
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
              />
              {errors.reference && <span className="sf-field-error">{errors.reference}</span>}
            </div>
            <div className="sf-group sf-group--large">
              <label>Nom de la pièce *</label>
              <input
                name="nom"
                value={form.nom}
                onChange={handleChange}
                placeholder="Ex : Filtre à huile"
              />
              {errors.nom && <span className="sf-field-error">{errors.nom}</span>}
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

        {/* ── PRIX ─────────────────────────────────────────────── */}
        <fieldset className="sf-fieldset">
          <legend className="sf-legend">Prix</legend>
          <div className="sf-row">
            <div className="sf-group">
              <label>Prix d'achat HT (€) *</label>
              <input
                name="prix_achat"
                type="number" step="0.01" min={0}
                value={form.prix_achat}
                onChange={handleChange}
                placeholder="0.00"
              />
              {errors.prix_achat && <span className="sf-field-error">{errors.prix_achat}</span>}
            </div>
            <div className="sf-group">
              <label>Prix de vente TTC (€) *</label>
              <input
                name="prix_vente"
                type="number" step="0.01" min={0}
                value={form.prix_vente}
                onChange={handleChange}
                placeholder="0.00"
              />
              {errors.prix_vente && <span className="sf-field-error">{errors.prix_vente}</span>}
            </div>

            {/* Aperçu marge en temps réel */}
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

        {/* ── STOCK ────────────────────────────────────────────── */}
        <fieldset className="sf-fieldset">
          <legend className="sf-legend">Stock</legend>
          <div className="sf-row">
            <div className="sf-group">
              <label>Stock actuel</label>
              <input
                name="stock_actuel"
                type="number" min={0}
                value={form.stock_actuel}
                onChange={handleChange}
              />
            </div>
            <div className="sf-group">
              <label>Seuil minimum (alerte)</label>
              <input
                name="stock_minimum"
                type="number" min={0}
                value={form.stock_minimum}
                onChange={handleChange}
              />
            </div>
          </div>
          <p className="sf-aide">
            ℹ️ Une alerte se déclenche dès que le stock passe sous le seuil minimum.
          </p>
        </fieldset>

        {/* ── FOURNISSEUR ──────────────────────────────────────── */}
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
              Lier un fournisseur permet de générer les emails de commande automatiquement.
            </span>
          </div>
        </fieldset>

      </form>
    </Modal>
  );
};

export default StockForm;