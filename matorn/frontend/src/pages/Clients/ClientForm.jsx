// /frontend/src/pages/Clients/ClientForm.jsx
import React, { useState } from 'react';
import { addClient, editClient } from './clientService';
import { addVehicule } from '../Vehicles/vehicleService';
import { useReferentiels } from '../../context/ReferentielsContext';
import { validateNom, validatePhone, validateEmail, validateImmatriculation, formatNom, formatPrenom, formatPhone, formatImmatriculation } from '../../utils/validators';
import useForm from '../../hooks/useForm';
import { User, Phone, FileText, Pencil, UserPlus, Save, Loader, CircleAlert, Car, Plus, X } from '../../utils/icons';
import Modal from '../../components/shared/Modals/Modal';
import '../../components/shared/Modals/forms.css';
import './ClientForm.css';
import AddressAutocomplete from '../../components/shared/AdressAutocomplete/AddressAutocomplete';

const INITIAL_DATA = {
  nom: '', prenom: '', telephone: '', email: '', adresse: '', notes: '',
};

const VEHICULE_VIDE = () => ({
  _tempId:         Date.now() + Math.random(),
  type_vehicule:   'VOITURE',
  immatriculation: '',
  marque:          '',
  modele:          '',
  annee:           '',
});

const ClientForm = ({ editingClient, onClose, onSuccess }) => {

  const { getTypeVehicules } = useReferentiels();

  const { formData, setFormData, errors, setErrors, saving, setSaving }
    = useForm(
        INITIAL_DATA,
        editingClient,
        (client) => ({
          nom:       client.nom       || '',
          prenom:    client.prenom    || '',
          telephone: client.telephone || '',
          email:     client.email     || '',
          adresse:   client.adresse   || '',
          notes:     client.notes     || '',
        })
      );

  // Véhicules à créer (seulement en mode création)
  const [vehicules, setVehicules] = useState([]);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'nom')       value = formatNom(value);
    if (name === 'prenom')    value = formatPrenom(value);
    if (name === 'telephone') value = formatPhone(value);
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  // ── Gestion des véhicules ────────────────────────────────────────
  const handleAddVehicule = () => {
    setVehicules(prev => [...prev, VEHICULE_VIDE()]);
  };

  const handleRemoveVehicule = (tempId) => {
    setVehicules(prev => prev.filter(v => v._tempId !== tempId));
  };

  const handleVehiculeChange = (tempId, field, value) => {
    setVehicules(prev => prev.map(v => {
      if (v._tempId !== tempId) return v;
      // Changer le type reset la plaque
      if (field === 'type_vehicule') return { ...v, type_vehicule: value, immatriculation: '' };
      if (field === 'immatriculation') {
        value = formatImmatriculation(value, { vehicleType: v.type_vehicule });
      }
      return { ...v, [field]: value };
    }));
  };

  // ── Validation ───────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    const nomError   = validateNom(formData.nom);
    const phoneError = validatePhone(formData.telephone);
    const emailError = validateEmail(formData.email);
    if (nomError)   newErrors.nom       = nomError;
    if (phoneError) newErrors.telephone = phoneError;
    if (emailError) newErrors.email     = emailError;
    return newErrors;
  };

  // ── Soumission ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTimeout(() => {
        const premier = Object.keys(validationErrors)[0];
        document.querySelector(`.client-form__body [name="${premier}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    try {
      setSaving(true);
      if (editingClient) {
        await editClient(editingClient.id, formData);
      } else {
        const nouveauClient = await addClient(formData);
        // Créer les véhicules liés
        for (const v of vehicules) {
          if (!v.marque.trim() && !v.modele.trim() && !v.immatriculation.trim()) continue;
          await addVehicule({
            type_vehicule:   v.type_vehicule,
            immatriculation: v.immatriculation.toUpperCase(),
            marque:          v.marque,
            modele:          v.modele,
            annee:           v.annee ? parseInt(v.annee) : null,
            proprietaire:    nouveauClient.id,
          });
        }
      }
      onSuccess();
    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editingClient ? 'Modifier le client' : 'Nouveau client'}
      titleIcon={editingClient ? <Pencil size={20} /> : <UserPlus size={20} />}
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
            form="client-form"
            className="form-btn form-btn--save"
            disabled={saving}
          >
            {saving
              ? <><Loader size={16} /> Enregistrement...</>
              : editingClient
                ? <><Save size={16} /> Modifier</>
                : <><Save size={16} /> Créer</>
            }
          </button>
        </>
      }
    >
      <form
        id="client-form"
        className="client-form__body"
        onSubmit={handleSubmit}
        noValidate
      >
        {errors.global && (
          <div className="form-error-global"><CircleAlert size={14} /> {errors.global}</div>
        )}

        {/* IDENTITÉ */}
        <div className="form-section">
          <div className="form-section__title"><User size={14} /> Identité</div>
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label required">Nom</label>
              <input
                type="text" name="nom" value={formData.nom}
                onChange={handleChange} placeholder="DUPONT"
                className={`form-input ${errors.nom ? 'form-input--error' : ''}`}
              />
              {errors.nom && <span className="form-error">{errors.nom}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input
                type="text" name="prenom" value={formData.prenom}
                onChange={handleChange} placeholder="Jean"
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* CONTACT */}
        <div className="form-section">
          <div className="form-section__title"><Phone size={14} /> Contact</div>
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input
                type="tel" name="telephone" value={formData.telephone}
                onChange={handleChange} placeholder="06 12 34 56 78"
                className={`form-input ${errors.telephone ? 'form-input--error' : ''}`}
              />
              {errors.telephone && <span className="form-error">{errors.telephone}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="text" name="email" value={formData.email}
                onChange={handleChange} placeholder="jean@email.com"
                className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '10px' }}>
            <label className="form-label">Adresse postale</label>
            <AddressAutocomplete
              value={formData.adresse}
              onChange={(val) => setFormData(prev => ({ ...prev, adresse: val }))}
              onSelect={(adresseObj) => {
                setFormData(prev => ({ ...prev, adresse: adresseObj.adresse }));
              }}
            />
          </div>
        </div>

        {/* NOTES */}
        <div className="form-section">
          <div className="form-section__title"><FileText size={14} /> Notes</div>
          <div className="form-group">
            <textarea
              name="notes" value={formData.notes}
              onChange={handleChange}
              placeholder="Informations utiles sur ce client..."
              className="form-input form-textarea" rows="2"
            />
          </div>
        </div>

        {/* VÉHICULES — seulement en création */}
        {!editingClient && (
          <div className="form-section">
            <div className="form-section__title">
              <Car size={14} /> Véhicule(s)
              <span style={{ fontSize: 11, fontWeight: 400, color: '#888', marginLeft: 6 }}>(optionnel)</span>
            </div>

            {vehicules.map((v, idx) => (
              <div key={v._tempId} className="cf-vehicule-block">
                <div className="cf-vehicule-block__header">
                  <span className="cf-vehicule-block__num">Véhicule {idx + 1}</span>
                  <button
                    type="button"
                    className="cf-vehicule-block__remove"
                    onClick={() => handleRemoveVehicule(v._tempId)}
                    title="Retirer ce véhicule"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                      className="form-input"
                      value={v.type_vehicule}
                      onChange={e => handleVehiculeChange(v._tempId, 'type_vehicule', e.target.value)}
                    >
                      {getTypeVehicules().map(t => (
                        <option key={t.valeur} value={t.valeur}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Immatriculation</label>
                    <input
                      type="text"
                      className="form-input"
                      value={v.immatriculation}
                      onChange={e => handleVehiculeChange(v._tempId, 'immatriculation', e.target.value)}
                      placeholder="AB-123-CD"
                    />
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="form-label">Marque</label>
                    <input
                      type="text"
                      className="form-input"
                      value={v.marque}
                      onChange={e => handleVehiculeChange(v._tempId, 'marque', e.target.value)}
                      placeholder="Peugeot"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Modèle</label>
                    <input
                      type="text"
                      className="form-input"
                      value={v.modele}
                      onChange={e => handleVehiculeChange(v._tempId, 'modele', e.target.value)}
                      placeholder="308"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Année</label>
                  <input
                    type="number"
                    className="form-input"
                    value={v.annee}
                    onChange={e => handleVehiculeChange(v._tempId, 'annee', e.target.value)}
                    placeholder="2020"
                    min="1900" max="2030"
                    style={{ maxWidth: 120 }}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              className="cf-btn-add-vehicule"
              onClick={handleAddVehicule}
            >
              <Plus size={13} /> Ajouter un véhicule
            </button>
          </div>
        )}

      </form>
    </Modal>
  );
};

export default ClientForm;
