// /frontend/src/pages/Vehicles/VehicleForm.jsx
import React, { useState, useEffect } from 'react';
import { addVehicule, editVehicule } from '../../utils/vehicleService';
import { useReferentiels } from '../../context/ReferentielsContext';
import { fetchClients } from '../../services/api';
import './VehicleForm.css';



const VehicleForm = ({ editingVehicule, onClose, onSuccess }) => {

  const [formData, setFormData] = useState({
    immatriculation: '',
    marque:          '',
    modele:          '',
    annee:           '',
    type_vehicule:   'VOITURE',
    proprietaire:    '',   // ID client
    notes:           '',
  });

  const [clients, setClients]   = useState([]);  // Liste pour le select
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const { getTypeVehicules } = useReferentiels();

  // Charger la liste des clients pour le select
  useEffect(() => {
    fetchClients().then(setClients).catch(() => {});
  }, []);

  // Pré-remplissage en modification
  useEffect(() => {
    if (editingVehicule) {
      setFormData({
        immatriculation: editingVehicule.immatriculation || '',
        marque:          editingVehicule.marque          || '',
        modele:          editingVehicule.modele          || '',
        annee:           editingVehicule.annee           ? String(editingVehicule.annee) : '',
        type_vehicule:   editingVehicule.type_vehicule   || 'VOITURE',
        proprietaire:    editingVehicule.proprietaire_id ? String(editingVehicule.proprietaire_id) : '',
        notes:           editingVehicule.notes           || '',
      });
    }
    setErrors({});
  }, [editingVehicule]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.immatriculation.trim()) newErrors.immatriculation = 'Immatriculation obligatoire';
    if (!formData.marque.trim())          newErrors.marque          = 'Marque obligatoire';
    if (!formData.modele.trim())          newErrors.modele          = 'Modèle obligatoire';
    if (formData.annee && (isNaN(formData.annee) || formData.annee < 1900 || formData.annee > 2030)) {
      newErrors.annee = 'Année invalide';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    try {
      setSaving(true);
      // Prépare les données pour Django
      const data = {
        ...formData,
        immatriculation: formData.immatriculation.toUpperCase(),
        annee:           formData.annee ? parseInt(formData.annee) : null,
        proprietaire:    formData.proprietaire ? parseInt(formData.proprietaire) : null,
      };

      if (editingVehicule) {
        await editVehicule(editingVehicule.id, data);
      } else {
        await addVehicule(data);
      }
      onSuccess();
    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Recherche SIV (disabled pour l'instant)
  const handleSivSearch = () => {
    alert('API SIV en cours d\'implémentation — bientôt disponible !');
  };

  return (
    <div className="vehicle-form__overlay" onClick={onClose}>
      <div className="vehicle-form__content" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="vehicle-form__header">
          <h2 className="vehicle-form__title">
            {editingVehicule ? '✏️ Modifier le véhicule' : '➕ Nouveau véhicule'}
          </h2>
          <button className="vehicle-form__close" onClick={onClose}>✕</button>
        </div>

        <form className="vehicle-form__body" onSubmit={handleSubmit}>

          {errors.global && (
            <div className="vf-error-global">❌ {errors.global}</div>
          )}

          {/* IDENTIFICATION */}
          <div className="vf-section">
            <div className="vf-section__title">🔑 Identification</div>

            {/* Immatriculation + bouton SIV */}
            <div className="vf-group">
              <label className="vf-label required">Immatriculation</label>
              <div className="vf-input-with-btn">
                <input
                  type="text"
                  name="immatriculation"
                  value={formData.immatriculation}
                  onChange={handleChange}
                  placeholder="AB-123-CD"
                  className={`vf-input ${errors.immatriculation ? 'vf-input--error' : ''}`}
                  style={{ textTransform: 'uppercase' }}
                />
                <button
                  type="button"
                  className="vf-btn-siv"
                  onClick={handleSivSearch}
                  disabled={!formData.immatriculation}
                  title="API SIV — bientôt disponible"
                >
                  🔍 SIV
                </button>
              </div>
              {errors.immatriculation && <span className="vf-error">{errors.immatriculation}</span>}
            </div>

            {/* Type véhicule */}
            <div className="vf-group">
              <label className="vf-label required">Type de véhicule</label>
              <select name="type_vehicule" value={formData.type_vehicule} onChange={handleChange} className="vf-input">
                {getTypeVehicules().map(t => (
                  <option key={t.valeur} value={t.valeur}>{t.icone} {t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* VÉHICULE */}
          <div className="vf-section">
            <div className="vf-section__title">🚗 Informations véhicule</div>
            <div className="vf-row-2col">
              <div className="vf-group">
                <label className="vf-label required">Marque</label>
                <input
                  type="text"
                  name="marque"
                  value={formData.marque}
                  onChange={handleChange}
                  placeholder="Peugeot"
                  className={`vf-input ${errors.marque ? 'vf-input--error' : ''}`}
                />
                {errors.marque && <span className="vf-error">{errors.marque}</span>}
              </div>
              <div className="vf-group">
                <label className="vf-label required">Modèle</label>
                <input
                  type="text"
                  name="modele"
                  value={formData.modele}
                  onChange={handleChange}
                  placeholder="308"
                  className={`vf-input ${errors.modele ? 'vf-input--error' : ''}`}
                />
                {errors.modele && <span className="vf-error">{errors.modele}</span>}
              </div>
            </div>

            <div className="vf-group">
              <label className="vf-label">Année</label>
              <input
                type="number"
                name="annee"
                value={formData.annee}
                onChange={handleChange}
                placeholder="2020"
                min="1900" max="2030"
                className={`vf-input ${errors.annee ? 'vf-input--error' : ''}`}
              />
              {errors.annee && <span className="vf-error">{errors.annee}</span>}
            </div>
          </div>

          {/* PROPRIÉTAIRE */}
          <div className="vf-section">
            <div className="vf-section__title">👤 Propriétaire</div>
            <div className="vf-group">
              <label className="vf-label">Client propriétaire</label>
              <select name="proprietaire" value={formData.proprietaire} onChange={handleChange} className="vf-input">
                <option value="">— Aucun propriétaire —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.prenom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* NOTES */}
          <div className="vf-section">
            <div className="vf-section__title">📝 Notes</div>
            <div className="vf-group">
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Pneus hiver, historique particulier..."
                className="vf-input vf-textarea"
                rows="2"
              />
            </div>
          </div>

          {/* BOUTONS */}
          <div className="vehicle-form__footer">
            <button type="button" className="vf-btn vf-btn--cancel" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="vf-btn vf-btn--save" disabled={saving}>
              {saving ? '⏳ Enregistrement...' : editingVehicule ? '💾 Modifier' : '💾 Créer'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default VehicleForm;