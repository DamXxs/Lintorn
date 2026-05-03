// /frontend/src/pages/Fournisseurs/ModalFournisseur.jsx
import React, { useState } from 'react';
import Modal from '../../components/shared/Modals/Modal';
import { useReferentiels } from '../../context/ReferentielsContext';
import { validateNom, validateEmail, validatePhone } from '../../utils/validators';
import '../../components/shared/Modals/forms.css';
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
 * Utilise Modal.jsx (coquille partagée) + forms.css (styles partagés).
 *
 * Props :
 *   fournisseur – null = création, objet = édition
 *   onSave      – fn(formData) → appelle l'API puis recharge la liste
 *   onClose     – fn() → ferme la modal
 */
const ModalFournisseur = ({ fournisseur, onSave, onClose }) => {
  const { getCategoriesFournisseur } = useReferentiels();
  const categories = getCategoriesFournisseur();

  const [form,   setForm]   = useState(fournisseur || FORMULAIRE_VIDE);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState(null);

  const isEdition = Boolean(fournisseur?.id);

  // Met à jour le champ correspondant (gère checkboxes et champs texte)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const nomError = validateNom(form.nom);
    const emailError = !form.email?.trim() ? 'L\'email est obligatoire' : validateEmail(form.email);
    const phoneError = validatePhone(form.telephone);

    if (nomError) newErrors.nom = nomError;
    if (emailError) newErrors.email = emailError;
    if (phoneError) newErrors.telephone = phoneError;

    return newErrors;
  };

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

    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Boutons collés en bas — passés en prop footer à Modal
  const footer = (
    <>
      <button type="button" className="form-btn form-btn--cancel" onClick={onClose}>
        Annuler
      </button>
      <button
        type="submit"
        form="form-fournisseur"
        className="form-btn form-btn--save"
        disabled={saving}
      >
        {saving ? 'Enregistrement…' : (isEdition ? '💾 Enregistrer' : '➕ Créer')}
      </button>
    </>
  );

  return (
    <Modal
      title={isEdition ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
      titleIcon={<span>🏭</span>}
      onClose={onClose}
      footer={footer}
    >
      <form id="form-fournisseur" onSubmit={handleSubmit} noValidate>

        {/* Erreur globale */}
        {erreur && <div className="form-error-global">⚠️ {erreur}</div>}

        {/* ── Section : Identité ─────────────────────────────────── */}
        <div className="form-section">
          <p className="form-section__title">🏭 Identité</p>

          <div className="form-group">
            <label className="form-label required">Nom du fournisseur</label>
            <input
              name="nom"
              className="form-input"
              value={form.nom}
              onChange={handleChange}
              placeholder="Ex : Utiligroup, Norauto, Autorectif…"
              required
            />
            {errors.nom && <span className="form-error">{errors.nom}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Catégorie</label>
            <select name="categorie" className="form-input" value={form.categorie} onChange={handleChange}>
              {categories.map(c => (
                <option key={c.valeur} value={c.valeur}>
                  {c.icone} {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Section : Contact ──────────────────────────────────── */}
        <div className="form-section">
          <p className="form-section__title">📞 Contact</p>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label required">Email de commande</label>
              <input
                name="email"
                type="email"
                className="form-input"
                value={form.email}
                onChange={handleChange}
                placeholder="commandes@fournisseur.fr"
                required
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input
                name="telephone"
                className="form-input"
                value={form.telephone}
                onChange={handleChange}
                placeholder="01 23 45 67 89"
              />
              {errors.telephone && <span className="form-error">{errors.telephone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nom du contact commercial</label>
            <input
              name="contact_nom"
              className="form-input"
              value={form.contact_nom}
              onChange={handleChange}
              placeholder="Ex : Jean Dupont"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Adresse postale</label>
            <textarea
              name="adresse"
              className="form-input form-textarea"
              value={form.adresse}
              onChange={handleChange}
              placeholder="Adresse complète…"
            />
          </div>
        </div>

        {/* ── Section : Notes & Options ─────────────────────────── */}
        <div className="form-section">
          <p className="form-section__title">📝 Notes & Options</p>

          <div className="form-group">
            <label className="form-label">Notes internes</label>
            <textarea
              name="notes"
              className="form-input form-textarea"
              value={form.notes}
              onChange={handleChange}
              placeholder="Conditions de paiement, remises négociées, délais habituels…"
            />
          </div>

          {/* Cases à cocher — style dans ModalFournisseur.css */}
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
        </div>

      </form>
    </Modal>
  );
};

export default ModalFournisseur;
