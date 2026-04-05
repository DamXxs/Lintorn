// /frontend/src/pages/Vehicles/VehicleForm.jsx
import React, { useState, useEffect } from 'react';
import { addVehicule, editVehicule } from './vehicleService';
import { useReferentiels } from '../../context/ReferentielsContext';
import { fetchClients } from '../../services/api';
// ✅ Validators centralisés (comme dans ClientForm)
import { validateImmatriculation, validateAnnee, formatImmatriculation } from '../../utils/validators';
import useForm from '../../hooks/useForm';
import { Key, Car, User, FileText, Pencil, Plus, Save, Loader, CircleAlert, Search } from '../../utils/icons';
import Modal            from '../../components/shared/Modals/Modal';
import FrenchPlateInput from '../../components/shared/Frenchplate/FrenchPlateInput';
import '../../components/shared/Modals/forms.css';
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

  // ── useForm gère : formData, errors, saving + reset ──────────────
  const { formData, setFormData, errors, setErrors, saving, setSaving }
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

  // ── handleChange avec formatters automatiques ────────────────────
  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'immatriculation') value = formatImmatriculation(value);
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

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
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll vers le premier champ en erreur
      setTimeout(() => {
        const premier = Object.keys(validationErrors)[0];
        document.querySelector(`.vehicle-form__body [name="${premier}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

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
    <Modal
      title={editingVehicule ? 'Modifier le véhicule' : 'Nouveau véhicule'}
      titleIcon={editingVehicule ? <Pencil size={15} /> : <Car size={15} />}
      onClose={onClose}
      footer={
        <>
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
            form="vehicle-form"
            className="form-btn form-btn--save"
            disabled={saving}
          >
            {saving
              ? <><Loader size={14} /> Enregistrement...</>
              : editingVehicule
                ? <><Save size={14} /> Modifier</>
                : <><Save size={14} /> Créer</>
            }
          </button>
        </>
      }
    >
      <form
        id="vehicle-form"
        className="vehicle-form__body"
        onSubmit={handleSubmit}
        noValidate
      >
        {errors.global && (
          <div className="form-error-global"><CircleAlert size={14} /> {errors.global}</div>
        )}

        {/* IDENTIFICATION */}
        <div className="form-section">
          <div className="form-section__title"><Key size={14} /> Identification</div>

          <div className="form-group">
            <label className="form-label required">Immatriculation</label>
            <div className="plate-with-siv">
              <FrenchPlateInput
                name="immatriculation"
                value={formData.immatriculation}
                onChange={handleChange}
                size="md"
                hasError={Boolean(errors.immatriculation)}
              />
              <button
                type="button" className="btn-siv"
                onClick={handleSivSearch}
                disabled={!formData.immatriculation}
                title="API SIV — bientôt disponible"
              >
                <Search size={14} /> SIV
              </button>
            </div>
            {errors.immatriculation && <span className="form-error">{errors.immatriculation}</span>}
          </div>

          <div className="form-group">
            <label className="form-label required">Type de véhicule</label>
            <select name="type_vehicule" value={formData.type_vehicule} onChange={handleChange} className="form-input">
              {getTypeVehicules().map(t => (
                <option key={t.valeur} value={t.valeur}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* VÉHICULE */}
        <div className="form-section">
          <div className="form-section__title"><Car size={14} /> Informations véhicule</div>
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label required">Marque</label>
              <input
                type="text" name="marque" value={formData.marque}
                onChange={handleChange} placeholder="Peugeot"
                className={`form-input ${errors.marque ? 'form-input--error' : ''}`}
              />
              {errors.marque && <span className="form-error">{errors.marque}</span>}
            </div>
            <div className="form-group">
              <label className="form-label required">Modèle</label>
              <input
                type="text" name="modele" value={formData.modele}
                onChange={handleChange} placeholder="308"
                className={`form-input ${errors.modele ? 'form-input--error' : ''}`}
              />
              {errors.modele && <span className="form-error">{errors.modele}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Année</label>
            <input
              type="number" name="annee" value={formData.annee}
              onChange={handleChange} placeholder="2020"
              min="1900" max="2030"
              className={`form-input ${errors.annee ? 'form-input--error' : ''}`}
            />
            {errors.annee && <span className="form-error">{errors.annee}</span>}
          </div>
        </div>

        {/* PROPRIÉTAIRE */}
        <div className="form-section">
          <div className="form-section__title"><User size={14} /> Propriétaire</div>
          <div className="form-group">
            <label className="form-label">Client propriétaire</label>
            <select name="proprietaire" value={formData.proprietaire} onChange={handleChange} className="form-input">
              <option value="">— Aucun propriétaire —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nom} {c.prenom}</option>
              ))}
            </select>
          </div>
        </div>

        {/* NOTES */}
        <div className="form-section">
          <div className="form-section__title"><FileText size={14} /> Notes</div>
          <div className="form-group">
            <textarea
              name="notes" value={formData.notes}
              onChange={handleChange}
              placeholder="Pneus hiver, historique particulier..."
              className="form-input form-textarea" rows="2"
            />
          </div>
        </div>

      </form>
    </Modal>
  );
};

export default VehicleForm;
