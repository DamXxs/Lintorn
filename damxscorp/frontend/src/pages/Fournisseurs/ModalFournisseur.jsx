// /frontend/src/pages/Fournisseurs/ModalFournisseur.jsx
import React, { useState } from 'react';
import { CATEGORIES } from './CardFournisseur';
import './ModalFournisseur.css';

// Valeurs par défaut pour le formulaire de création
const FORMULAIRE_VIDE = {
  nom:         '',
  email:       '',
  telephone:   '',
  contact_nom: '',
  adresse:     '',
  categorie:   'AUTRE',
  est_favori:  false,
  actif:       true,
  notes:       '',
};

/**
 * ModalFournisseur
 * Modal pour créer ou modifier un fournisseur.
 *
 * Props :
 *   fournisseur – null = création, objet = édition
 *   onSave      – fn(formData) → doit créer ou modifier via l'API
 *   onClose     – fn() → ferme le modal
 */
const ModalFournisseur = ({ fournisseur, onSave, onClose }) => {
  // Si on édite, on pré-remplit le formulaire avec les données existantes
  const [form, setForm]     = useState(fournisseur || FORMULAIRE_VIDE);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState(null);

  // Met à jour le champ correspondant dans l'état du formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErreur(null);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isEdition = Boolean(fournisseur?.id);

  return (
    <div className="modal-fourn-overlay" onClick={onClose}>
      {/* stopPropagation : empêche le clic sur la boîte de fermer le modal */}
      <div className="modal-fourn-box" onClick={e => e.stopPropagation()}>

        {/* En-tête */}
        <div className="modal-fourn-header">
          <h2>{isEdition ? '✏️ Modifier le fournisseur' : '➕ Nouveau fournisseur'}</h2>
          <button className="modal-fourn-close" onClick={onClose} title="Fermer">✕</button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="modal-fourn-form">

          {/* Message d'erreur éventuel */}
          {erreur && <div className="modal-fourn-error">{erreur}</div>}

          {/* Ligne 1 : Nom + Catégorie */}
          <div className="mf-row">
            <div className="mf-group mf-group--large">
              <label>Nom du fournisseur *</label>
              <input
                name="nom"
                value={form.nom}
                onChange={handleChange}
                placeholder="Ex : Utiligroup, Norauto, Autorectif…"
                required
              />
            </div>
            <div className="mf-group">
              <label>Catégorie</label>
              <select name="categorie" value={form.categorie} onChange={handleChange}>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ligne 2 : Email + Téléphone */}
          <div className="mf-row">
            <div className="mf-group mf-group--large">
              <label>Email de commande *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="commandes@fournisseur.fr"
                required
              />
            </div>
            <div className="mf-group">
              <label>Téléphone</label>
              <input
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                placeholder="01 23 45 67 89"
              />
            </div>
          </div>

          {/* Contact commercial */}
          <div className="mf-group">
            <label>Nom du contact commercial</label>
            <input
              name="contact_nom"
              value={form.contact_nom}
              onChange={handleChange}
              placeholder="Ex : Jean Dupont"
            />
          </div>

          {/* Adresse */}
          <div className="mf-group">
            <label>Adresse</label>
            <textarea
              name="adresse"
              value={form.adresse}
              onChange={handleChange}
              rows={2}
              placeholder="Adresse postale complète"
            />
          </div>

          {/* Notes */}
          <div className="mf-group">
            <label>Notes internes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Conditions de paiement, remises négociées, délais habituels…"
            />
          </div>

          {/* Cases à cocher */}
          <div className="mf-checkboxes">
            <label className="mf-checkbox-label">
              <input
                type="checkbox"
                name="est_favori"
                checked={form.est_favori}
                onChange={handleChange}
              />
              ⭐ Mettre en favori (affiché en premier dans la liste)
            </label>
            <label className="mf-checkbox-label">
              <input
                type="checkbox"
                name="actif"
                checked={form.actif}
                onChange={handleChange}
              />
              ✅ Fournisseur actif
            </label>
          </div>

          {/* Pied de modal : boutons */}
          <div className="modal-fourn-footer">
            <button type="button" className="mf-btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="mf-btn-save" disabled={saving}>
              {saving ? 'Enregistrement…' : (isEdition ? '💾 Enregistrer' : '➕ Créer')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ModalFournisseur;
