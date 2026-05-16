// /frontend/src/pages/Vehicles/VehicleForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { addVehicule, editVehicule } from './vehicleService';
import { addClient } from '../Clients/clientService';
import { useReferentiels } from '../../context/ReferentielsContext';
import { fetchClients } from '../../services/api';
import { validateImmatriculation, validateAnnee, formatImmatriculation, validateNom, validatePhone, formatNom, formatPrenom, formatPhone } from '../../utils/validators';
import useForm from '../../hooks/useForm';
import { Key, Car, User, FileText, Pencil, Save, Loader, CircleAlert, Search, UserPlus, X } from '../../utils/icons';
import Modal         from '../../components/shared/Modals/Modal';
import PlateSelector from '../../components/shared/plates/PlateSelector';
import '../../components/shared/Modals/forms.css';
import './VehicleForm.css';

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

  // ── Autocomplete client ───────────────────────────────────────────────────
  const [clientSearch, setClientSearch]         = useState('');
  const [clientSelected, setClientSelected]     = useState(null);
  const [showDropdown, setShowDropdown]         = useState(false);
  const searchRef = useRef(null);

  // ── Mini-formulaire création client ──────────────────────────────────────
  const [showNewClient, setShowNewClient]       = useState(false);
  const [newClientData, setNewClientData]       = useState({ nom: '', prenom: '', telephone: '' });
  const [newClientErrors, setNewClientErrors]   = useState({});
  const [creatingClient, setCreatingClient]     = useState(false);

  useEffect(() => {
    fetchClients().then(data => {
      setClients(data);
      // En mode édition : pré-sélectionner le propriétaire existant
      if (editingVehicule?.proprietaire_id) {
        const found = data.find(c => c.id === editingVehicule.proprietaire_id);
        if (found) {
          setClientSelected(found);
          setClientSearch(`${found.nom} ${found.prenom || ''}`.trim());
        }
      }
    }).catch(() => {});
  }, [editingVehicule]);

  // Fermer le dropdown si clic ailleurs
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clientsFiltres = clientSearch.trim().length >= 1
    ? clients.filter(c =>
        `${c.nom} ${c.prenom || ''}`.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.telephone || '').includes(clientSearch)
      ).slice(0, 8)
    : [];

  const handleClientSearchChange = (e) => {
    const val = e.target.value;
    setClientSearch(val);
    setShowDropdown(true);
    if (!val.trim()) {
      setClientSelected(null);
      setFormData(prev => ({ ...prev, proprietaire: '' }));
    }
  };

  const handleClientSelect = (client) => {
    setClientSelected(client);
    setClientSearch(`${client.nom} ${client.prenom || ''}`.trim());
    setShowDropdown(false);
    setFormData(prev => ({ ...prev, proprietaire: String(client.id) }));
  };

  const handleClearClient = () => {
    setClientSelected(null);
    setClientSearch('');
    setFormData(prev => ({ ...prev, proprietaire: '' }));
  };

  // ── Créer un nouveau client inline ────────────────────────────────────────
  const handleNewClientChange = (e) => {
    let { name, value } = e.target;
    if (name === 'nom')       value = formatNom(value);
    if (name === 'prenom')    value = formatPrenom(value);
    if (name === 'telephone') value = formatPhone(value);
    setNewClientData(prev => ({ ...prev, [name]: value }));
    if (newClientErrors[name]) setNewClientErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleCreateClient = async () => {
    const errs = {};
    const nomErr   = validateNom(newClientData.nom);
    const phoneErr = validatePhone(newClientData.telephone);
    if (nomErr)   errs.nom       = nomErr;
    if (phoneErr) errs.telephone = phoneErr;
    if (Object.keys(errs).length > 0) { setNewClientErrors(errs); return; }

    setCreatingClient(true);
    try {
      const nouveau = await addClient(newClientData);
      setClients(prev => [...prev, nouveau]);
      handleClientSelect(nouveau);
      setShowNewClient(false);
      setNewClientData({ nom: '', prenom: '', telephone: '' });
      setNewClientErrors({});
    } catch (err) {
      setNewClientErrors({ global: err.message });
    } finally {
      setCreatingClient(false);
    }
  };

  const { formData, setFormData, errors, setErrors, saving, setSaving }
    = useForm(
        INITIAL_DATA,
        editingVehicule,
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

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === 'immatriculation') {
      value = formatImmatriculation(value, { vehicleType: formData.type_vehicule });
    }

    if (name === 'type_vehicule') {
      setFormData(prev => ({ ...prev, [name]: value, immatriculation: '' }));
      setErrors(prev => ({ ...prev, immatriculation: null }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.marque.trim())  newErrors.marque  = 'Marque obligatoire';
    if (!formData.modele.trim())  newErrors.modele  = 'Modèle obligatoire';

    const immatError = validateImmatriculation(formData.immatriculation, {
      vehicleType: formData.type_vehicule
    });
    if (immatError) newErrors.immatriculation = immatError;

    const anneeError = validateAnnee(formData.annee);
    if (anneeError) newErrors.annee = anneeError;
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
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

  const showSivButton = !['BATEAU', 'JETSKI', 'VOILIER', 'MOTOCULTURE', 'ENGIN', 'ENGIN_AGRICOLE', 'TONDEUSE']
    .includes((formData.type_vehicule || '').toUpperCase());

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
            <label className="form-label required">Type de véhicule</label>
            <select name="type_vehicule" value={formData.type_vehicule} onChange={handleChange} className="form-input">
              {getTypeVehicules().map(t => (
                <option key={t.valeur} value={t.valeur}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Immatriculation</label>
            <div className="plate-with-siv">
              <PlateSelector
                vehicleType={formData.type_vehicule}
                name="immatriculation"
                value={formData.immatriculation}
                onChange={handleChange}
                size="md"
                hasError={Boolean(errors.immatriculation)}
              />
              {showSivButton && (
                <button
                  type="button" className="btn-siv"
                  onClick={() => alert('API SIV en cours d\'implémentation — bientôt disponible !')}
                  disabled={!formData.immatriculation}
                  title="API SIV — bientôt disponible"
                >
                  <Search size={14} /> SIV
                </button>
              )}
            </div>
            {errors.immatriculation && <span className="form-error">{errors.immatriculation}</span>}
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

        {/* PROPRIÉTAIRE — autocomplete */}
        <div className="form-section">
          <div className="form-section__title"><User size={14} /> Propriétaire</div>

          <div className="form-group" ref={searchRef} style={{ position: 'relative' }}>
            <label className="form-label">Rechercher un client</label>

            {clientSelected ? (
              <div className="vf-client-selected">
                <span className="vf-client-selected__name">
                  {clientSelected.nom} {clientSelected.prenom || ''}
                  {clientSelected.telephone && ` — ${clientSelected.telephone}`}
                </span>
                <button
                  type="button"
                  className="vf-client-selected__clear"
                  onClick={handleClearClient}
                  title="Changer de client"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="vf-client-search">
                  <Search size={14} className="vf-client-search__icon" />
                  <input
                    type="text"
                    className="form-input vf-client-search__input"
                    placeholder="Nom, prénom ou téléphone..."
                    value={clientSearch}
                    onChange={handleClientSearchChange}
                    onFocus={() => clientSearch.trim() && setShowDropdown(true)}
                    autoComplete="off"
                  />
                </div>

                {showDropdown && clientsFiltres.length > 0 && (
                  <div className="vf-client-dropdown">
                    {clientsFiltres.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className="vf-client-dropdown__item"
                        onMouseDown={() => handleClientSelect(c)}
                      >
                        <span className="vf-client-dropdown__nom">{c.nom} {c.prenom || ''}</span>
                        {c.telephone && <span className="vf-client-dropdown__tel">{c.telephone}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {showDropdown && clientSearch.trim().length >= 2 && clientsFiltres.length === 0 && (
                  <div className="vf-client-dropdown vf-client-dropdown--empty">
                    Aucun client trouvé
                  </div>
                )}
              </>
            )}

            {/* Bouton créer un nouveau client */}
            {!showNewClient && (
              <button
                type="button"
                className="vf-btn-new-client"
                onClick={() => { setShowNewClient(true); setShowDropdown(false); }}
              >
                <UserPlus size={13} /> Créer un nouveau client
              </button>
            )}
          </div>

          {/* Mini-formulaire création client */}
          {showNewClient && (
            <div className="vf-new-client-form">
              <div className="vf-new-client-form__header">
                <strong><UserPlus size={13} /> Nouveau client</strong>
                <button
                  type="button"
                  className="vf-new-client-form__close"
                  onClick={() => { setShowNewClient(false); setNewClientData({ nom: '', prenom: '', telephone: '' }); setNewClientErrors({}); }}
                >
                  <X size={14} />
                </button>
              </div>

              {newClientErrors.global && (
                <div className="form-error-global" style={{ fontSize: 12, padding: '6px 10px' }}>
                  <CircleAlert size={12} /> {newClientErrors.global}
                </div>
              )}

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label required">Nom</label>
                  <input
                    type="text" name="nom" value={newClientData.nom}
                    onChange={handleNewClientChange} placeholder="DUPONT"
                    className={`form-input ${newClientErrors.nom ? 'form-input--error' : ''}`}
                  />
                  {newClientErrors.nom && <span className="form-error">{newClientErrors.nom}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input
                    type="text" name="prenom" value={newClientData.prenom}
                    onChange={handleNewClientChange} placeholder="Jean"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input
                  type="tel" name="telephone" value={newClientData.telephone}
                  onChange={handleNewClientChange} placeholder="06 12 34 56 78"
                  className={`form-input ${newClientErrors.telephone ? 'form-input--error' : ''}`}
                />
                {newClientErrors.telephone && <span className="form-error">{newClientErrors.telephone}</span>}
              </div>
              <button
                type="button"
                className="form-btn form-btn--save"
                onClick={handleCreateClient}
                disabled={creatingClient}
                style={{ width: '100%', marginTop: 4 }}
              >
                {creatingClient ? <><Loader size={13} /> Création...</> : <><Save size={13} /> Créer et sélectionner</>}
              </button>
            </div>
          )}
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
