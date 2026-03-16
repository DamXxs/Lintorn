// /frontend/src/pages/Vehicles/VehicleForm.jsx
import React, { useState, useEffect } from 'react';
import { addVehicule, editVehicule } from '../../utils/vehicleService';
import { useReferentiels } from '../../context/ReferentielsContext';
import { fetchClients } from '../../services/api';
// ✅ Validators centralisés (comme dans ClientForm)
import { validateImmatriculation, validateAnnee } from '../../utils/validators';
import useForm from '../../hooks/useForm';
import { Key, Car, User, FileText, Pencil, Plus, X, Save, Loader, CircleAlert, Search } from '../../utils/icons';
import './VehicleForm.css';

// Valeurs vides du formulaire (état initial)
const INITIAL_DATA = {
  immatriculation: '',
  marque:          '',
  modele:          '',
  annee:           '',
  type_vehicule:   'VOITURE',
  proprietaire:    '',
  notes:           '',
};

const VehicleForm = ({ editingVehicule, onClose, onSuccess }) => {

  const [clients, setClients] = useState([]);
  const { getTypeVehicules }  = useReferentiels();

  // Charger la liste des clients pour le select propriétaire
  useEffect(() => {
    fetchClients().then(setClients).catch(() => {});
  }, []);

  // ── useForm gère : formData, errors, saving + handleChange + reset ──
  const { formData, errors, setErrors, saving, setSaving, handleChange }
    = useForm(
        INITIAL_DATA,
        editingVehicule,
        // Fonction qui pré-remplit le formulaire depuis le véhicule existant
        (v) => ({
          immatriculation: v.immatriculation || '',
          marque:          v.marque          || '',
          modele:          v.modele          || '',
          annee:           v.annee           ? String(v.annee) : '',
          type_vehicule:   v.type_vehicule   || 'VOITURE',
          proprietaire:    v.proprietaire_id ? String(v.proprietaire_id) : '',
          notes:           v.notes           || '',
        })
      );

  // ── Validation via validators.js ─────────────────────────────────
  const validate = () => {
    const newErrors = {};
    // Champs obligatoires manuels
    if (!formData.marque.trim())  newErrors.marque  = 'Marque obligatoire';
    if (!formData.modele.trim())  newErrors.modele  = 'Modèle obligatoire';
    // Validation via validators.js (même fichier que ClientForm)
    const immatError = validateImmatriculation(formData.immatriculation);
    if (immatError) newErrors.immatriculation = immatError;
    const anneeError = validateAnnee(formData.annee);
    if (anneeError) newErrors.annee = anneeError;
    return newErrors;
  };

  // ── Soumission ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    try {
      setSaving(true);
      const data = {
        ...formData,
        immatriculation: formData.immatriculation.toUpperCase(),
        annee:           formData.annee        ? parseInt(formData.annee)        : null,
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

  // Recherche SIV (placeholder — sera développé plus tard)
  const handleSivSearch = () => {
    alert('API SIV en cours d\'implémentation — bientôt disponible !');
  };

  // ── Rendu ────────────────────────────────────────────────────────
  return (
    <div className="vehicle-form__overlay" onClick={onClose}>
      <div className="vehicle-form__content" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="vehicle-form__header">
          <h2 className="vehicle-form__title">
            {editingVehicule ? <><Pencil size={15}/> Modifier le véhicule</> : <><Plus size={15}/> Nouveau véhicule</>}
          </h2>
          <button className="vehicle-form__close" onClick={onClose}><X size={16} /></button>
        </div>

        <form className="vehicle-form__body" onSubmit={handleSubmit}>

          {errors.global && (
            <div className="vf-error-global"><CircleAlert size={14} /> {errors.global}</div>
          )}

          {/* IDENTIFICATION */}
          <div className="vf-section">
            <div className="vf-section__title"><Key size={14} /> Identification</div>

            <div className="vf-group">
              <label className="vf-label required">Immatriculation</label>
              <div className="vf-input-with-btn">
                <input
                  type="text" name="immatriculation" value={formData.immatriculation}
                  onChange={handleChange} placeholder="AB-123-CD"
                  className={`vf-input ${errors.immatriculation ? 'vf-input--error' : ''}`}
                  style={{ textTransform: 'uppercase' }}
                />
                <button
                  type="button" className="vf-btn-siv"
                  onClick={handleSivSearch}
                  disabled={!formData.immatriculation}
                  title="API SIV — bientôt disponible"
                >
                  <Search size={14} /> SIV
                </button>
              </div>
              {errors.immatriculation && <span className="vf-error">{errors.immatriculation}</span>}
            </div>

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
            <div className="vf-section__title"><Car size={14} /> Informations véhicule</div>
            <div className="vf-row-2col">
              <div className="vf-group">
                <label className="vf-label required">Marque</label>
                <input
                  type="text" name="marque" value={formData.marque}
                  onChange={handleChange} placeholder="Peugeot"
                  className={`vf-input ${errors.marque ? 'vf-input--error' : ''}`}
                />
                {errors.marque && <span className="vf-error">{errors.marque}</span>}
              </div>
              <div className="vf-group">
                <label className="vf-label required">Modèle</label>
                <input
                  type="text" name="modele" value={formData.modele}
                  onChange={handleChange} placeholder="308"
                  className={`vf-input ${errors.modele ? 'vf-input--error' : ''}`}
                />
                {errors.modele && <span className="vf-error">{errors.modele}</span>}
              </div>
            </div>

            <div className="vf-group">
              <label className="vf-label">Année</label>
              <input
                type="number" name="annee" value={formData.annee}
                onChange={handleChange} placeholder="2020"
                min="1900" max="2030"
                className={`vf-input ${errors.annee ? 'vf-input--error' : ''}`}
              />
              {errors.annee && <span className="vf-error">{errors.annee}</span>}
            </div>
          </div>

          {/* PROPRIÉTAIRE */}
          <div className="vf-section">
            <div className="vf-section__title"><User size={14} /> Propriétaire</div>
            <div className="vf-group">
              <label className="vf-label">Client propriétaire</label>
              <select name="proprietaire" value={formData.proprietaire} onChange={handleChange} className="vf-input">
                <option value="">— Aucun propriétaire —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nom} {c.prenom}</option>
                ))}
              </select>
            </div>
          </div>

          {/* NOTES */}
          <div className="vf-section">
            <div className="vf-section__title"><FileText size={14} /> Notes</div>
            <div className="vf-group">
              <textarea
                name="notes" value={formData.notes}
                onChange={handleChange}
                placeholder="Pneus hiver, historique particulier..."
                className="vf-input vf-textarea" rows="2"
              />
            </div>
          </div>

          {/* BOUTONS */}
          <div className="vehicle-form__footer">
            <button type="button" className="vf-btn vf-btn--cancel" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="vf-btn vf-btn--save" disabled={saving}>
              {saving ? <><Loader size={14} /> Enregistrement...</> : editingVehicule ? <><Save size={14} /> Modifier</> : <><Save size={14} /> Créer</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default VehicleForm;
