// /frontend/src/pages/Clients/ClientForm.jsx
import React from 'react';
import { addClient, editClient } from './clientService';
import { validateNom, validatePhone, validateEmail, formatNom, formatPrenom, formatPhone } from '../../utils/validators';
import useForm from '../../hooks/useForm';
import { User, Phone, FileText, Pencil, UserPlus, Save, Loader, CircleAlert } from '../../utils/icons';
import Modal from '../../components/shared/Modals/Modal';
import '../../components/shared/Modals/forms.css';
import './ClientForm.css';
import AddressAutocomplete from '../../components/shared/AdressAutocomplete/AddressAutocomplete';

// Valeurs vides du formulaire (état initial)
const INITIAL_DATA = {
  nom: '', prenom: '', telephone: '', email: '', adresse: '', notes: '',
};

const ClientForm = ({ editingClient, onClose, onSuccess }) => {

  // ── useForm gère : formData, errors, saving + reset ──────────────
  const { formData, setFormData, errors, setErrors, saving, setSaving }
    = useForm(
        INITIAL_DATA,
        editingClient,
        // Fonction qui pré-remplit le formulaire depuis le client existant
        (client) => ({
          nom:       client.nom       || '',
          prenom:    client.prenom    || '',
          telephone: client.telephone || '',
          email:     client.email     || '',
          adresse:   client.adresse   || '',
          notes:     client.notes     || '',
        })
      );

  // ── handleChange avec formatters automatiques ────────────────────
  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'nom')       value = formatNom(value);
    if (name === 'prenom')    value = formatPrenom(value);
    if (name === 'telephone') value = formatPhone(value);
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  // ── Validation via validators.js ─────────────────────────────────
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
      // Scroll vers le premier champ en erreur
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
        await addClient(formData);
      }
      onSuccess();
    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Rendu ────────────────────────────────────────────────────────
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
      {/* FORMULAIRE */}
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

          {/* Adresse avec autocomplétion (API Adresse du gouvernement) */}
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

      </form>
    </Modal>
  );
};

export default ClientForm;
