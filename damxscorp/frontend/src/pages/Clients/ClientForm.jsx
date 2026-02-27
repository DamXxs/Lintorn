// /frontend/src/pages/Clients/ClientForm.jsx
import React, { useState, useEffect } from 'react';
import { addClient, editClient } from '../../utils/clientService';
// ✅ On utilise validators.js au lieu du code en dur
import { validateNom, validatePhone, validateEmail } from '../../utils/validators';
import './ClientForm.css';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
const ClientForm = ({ editingClient, onClose, onSuccess }) => {

  // =========================================================================
  // ÉTAT DU FORMULAIRE
  // =========================================================================
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',      // ← Nouveau
    notes: '',
  });

  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);

  // =========================================================================
  // PRÉ-REMPLISSAGE si modification
  // =========================================================================
  useEffect(() => {
    if (editingClient) {
      setFormData({
        nom:       editingClient.nom       || '',
        prenom:    editingClient.prenom    || '',
        telephone: editingClient.telephone || '',
        email:     editingClient.email     || '',
        adresse:   editingClient.adresse   || '',  // ← Nouveau
        notes:     editingClient.notes     || '',
      });
    } else {
      setFormData({ nom: '', prenom: '', telephone: '', email: '', adresse: '', notes: '' });
    }
    setErrors({});
  }, [editingClient]);

  // =========================================================================
  // GESTION DES CHANGEMENTS
  // =========================================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // =========================================================================
  // VALIDATION — utilise validators.js
  // =========================================================================
  const validate = () => {
    const newErrors = {};

    // validateNom, validatePhone, validateEmail viennent de validators.js
    const nomError   = validateNom(formData.nom);
    const phoneError = validatePhone(formData.telephone);
    const emailError = validateEmail(formData.email);

    if (nomError)   newErrors.nom       = nomError;
    if (phoneError) newErrors.telephone = phoneError;
    if (emailError) newErrors.email     = emailError;

    return newErrors;
  };

  // =========================================================================
  // SOUMISSION
  // =========================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);
      if (editingClient) {
        await editClient(editingClient.id, formData);
      } else {
        await addClient(formData);
      }
      onSuccess();
    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setSaving(false);
    }
  };

  // =========================================================================
  // RENDU
  // =========================================================================
  return (
    <div className="client-form__overlay" onClick={onClose}>
      <div
        className="client-form__content"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div className="client-form__header">
          <h2 className="client-form__title">
            {editingClient ? '✏️ Modifier le client' : '➕ Nouveau client'}
          </h2>
          <button className="client-form__close" onClick={onClose}>✕</button>
        </div>

        {/* ── FORMULAIRE ───────────────────────────────────────── */}
        <form className="client-form__body" onSubmit={handleSubmit}>

          {errors.global && (
            <div className="client-form__error-global">❌ {errors.global}</div>
          )}

          {/* IDENTITÉ */}
          <div className="form-section">
            <div className="form-section__title">👤 Identité</div>
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label required">Nom</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="DUPONT"
                  className={`form-input ${errors.nom ? 'form-input--error' : ''}`}
                />
                {errors.nom && <span className="form-error">{errors.nom}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  placeholder="Jean"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* CONTACT */}
          <div className="form-section">
            <div className="form-section__title">📞 Contact</div>
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="06 12 34 56 78"
                  className={`form-input ${errors.telephone ? 'form-input--error' : ''}`}
                />
                {errors.telephone && <span className="form-error">{errors.telephone}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jean@email.com"
                  className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
            </div>

            {/* Adresse avec autocomplétion */}
            <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label">Adresse postale</label>
                <AddressAutocomplete
                    value={formData.adresse}
                    onChange={(val) => setFormData(prev => ({ ...prev, adresse: val }))}
                    onSelect={(adresseObj) => {
                        // onSelect reçoit l'objet complet si tu veux récupérer
                        // le code postal ou la ville séparément plus tard
                        setFormData(prev => ({ ...prev, adresse: adresseObj.adresse }));
                    }}
                />
            </div>
          </div>

          {/* NOTES */}
          <div className="form-section">
            <div className="form-section__title">📝 Notes</div>
            <div className="form-group">
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Informations utiles sur ce client..."
                className="form-input form-textarea"
                rows="2"
              />
            </div>
          </div>

          {/* BOUTONS */}
          <div className="client-form__footer">
            <button
              type="button"
              className="form-btn form-btn--cancel"
              onClick={onClose}
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="form-btn form-btn--save"
              disabled={saving}
            >
              {saving ? '⏳ Enregistrement...' : editingClient ? '💾 Modifier' : '💾 Créer'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ClientForm;