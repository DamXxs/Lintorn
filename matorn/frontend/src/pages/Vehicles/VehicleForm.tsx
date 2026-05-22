// /frontend/src/pages/Vehicles/VehicleForm.tsx
import React, { useState, useEffect } from 'react';
import { addVehicule, editVehicule } from './vehicleService';
import { useReferentiels } from '../../context/ReferentielsContext';
import { fetchClients } from '../../services/api';
import { validateImmatriculation, validateAnnee, formatImmatriculation } from '../../utils/validators';
import useForm from '../../hooks/useForm';
import { Key, Car, User, FileText, Pencil, Save, Loader, CircleAlert, UserPlus } from '../../utils/icons';
import Modal             from '../../components/shared/Modals/Modal';
import PlateSelector     from '../../components/shared/plates/PlateSelector';
import ClientFormInLine  from '../../components/shared/inline/ClientFormInLine';
import { ClientLite }    from '../../components/shared/ClientSearchInput/ClientSearchInput';
import ClientSearchInput from '../../components/shared/ClientSearchInput/ClientSearchInput';
import SivButton, { SivResult } from '../../components/shared/SivButton/SivButton';
import '../../components/shared/Modals/forms.css';
import './VehicleForm.css';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface EditingVehicule {
  id:              number;
  immatriculation: string;
  marque:          string;
  modele:          string;
  annee:           number | null;
  vin?:            string;
  type_vehicule:   string;
  proprietaire_id: number | null;
  notes:           string;
}

interface VehicleFormProps {
  editingVehicule?: EditingVehicule | null;
  onClose:          () => void;
  onSuccess:        () => void;
}

interface FormData {
  immatriculation: string;
  marque:          string;
  modele:          string;
  annee:           string;
  vin:             string;
  type_vehicule:   string;
  proprietaire:    string;
  notes:           string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES INITIALES
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_DATA: FormData = {
  immatriculation: '',
  marque:          '',
  modele:          '',
  annee:           '',
  vin:             '',
  type_vehicule:   'VOITURE',
  proprietaire:    '',
  notes:           '',
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

const VehicleForm: React.FC<VehicleFormProps> = ({ editingVehicule, onClose, onSuccess }) => {

  const { getTypeVehicules } = useReferentiels();

  // ── Client sélectionné ────────────────────────────────────────
  const [clientSelected, setClientSelected] = useState<ClientLite | null>(null);
  const [showNewClient,  setShowNewClient]  = useState(false);

  // Pré-remplir le client en mode édition
  useEffect(() => {
    if (editingVehicule?.proprietaire_id) {
      fetchClients().then((data: any[]) => {
        const found = (data as ClientLite[]).find(c => c.id === editingVehicule.proprietaire_id);
        if (found) {
          setClientSelected(found);
          setFormData(prev => ({ ...prev, proprietaire: String(found.id) }));
        }
      }).catch(() => {});
    } else {
      setClientSelected(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingVehicule]);

  const handleClientSelect = (client: ClientLite) => {
    setClientSelected(client);
    setFormData(prev => ({ ...prev, proprietaire: String(client.id) }));
  };

  const handleClearClient = () => {
    setClientSelected(null);
    setFormData(prev => ({ ...prev, proprietaire: '' }));
  };

  // ── Callback après création client inline ──────────────────────
  const handleClientCreated = (client: ClientLite) => {
    handleClientSelect(client);
    setShowNewClient(false);
  };

  // ── Formulaire véhicule ────────────────────────────────────────
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    saving,
    setSaving,
  } = useForm(
    INITIAL_DATA,
    editingVehicule,
    (v: EditingVehicule) => ({
      immatriculation: v.immatriculation || '',
      marque:          v.marque          || '',
      modele:          v.modele          || '',
      annee:           v.annee           ? String(v.annee) : '',
      vin:             v.vin             || '',
      type_vehicule:   v.type_vehicule   || 'VOITURE',
      proprietaire:    v.proprietaire_id ? String(v.proprietaire_id) : '',
      notes:           v.notes           || '',
    })
  ) as {
    formData:    FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    errors:      Record<string, string>;
    setErrors:   React.Dispatch<React.SetStateAction<Record<string, string>>>;
    saving:      boolean;
    setSaving:   React.Dispatch<React.SetStateAction<boolean>>;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === 'immatriculation') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value = (formatImmatriculation as any)(value, { vehicleType: formData.type_vehicule });
    }
    if (name === 'type_vehicule') {
      setFormData(prev => ({ ...prev, [name]: value, immatriculation: '' }));
      setErrors(prev => ({ ...prev, immatriculation: '' }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!formData.marque.trim()) newErrors.marque = 'Marque obligatoire';
    if (!formData.modele.trim()) newErrors.modele = 'Modèle obligatoire';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const immatError = (validateImmatriculation as any)(formData.immatriculation, { vehicleType: formData.type_vehicule });
    if (immatError) newErrors.immatriculation = immatError;
    const anneeError = validateAnnee(formData.annee);
    if (anneeError) newErrors.annee = anneeError;
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        vin:             formData.vin?.trim()  || null,
      };
      if (editingVehicule) {
        await editVehicule(editingVehicule.id, data);
      } else {
        await addVehicule(data);
      }
      onSuccess();
    } catch (err: any) {
      setErrors({ global: err.message });
    } finally {
      setSaving(false);
    }
  };

  // SIV → pré-remplir depuis l'API
  const handleSivResult = (data: SivResult) => {
    setFormData(prev => ({
      ...prev,
      ...(data.marque        && { marque:       data.marque }),
      ...(data.modele        && { modele:        data.modele }),
      ...(data.annee         && { annee:         data.annee }),
      ...(data.type_vehicule && { type_vehicule: data.type_vehicule }),
      ...(data.vin           && { vin:           data.vin }),
    }));
  };

  // ── Rendu ──────────────────────────────────────────────────────
  return (
    <Modal
      title={editingVehicule ? 'Modifier le véhicule' : 'Nouveau véhicule'}
      titleIcon={editingVehicule ? <Pencil size={15} /> : <Car size={15} />}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="form-btn form-btn--cancel" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="submit" form="vehicle-form" className="form-btn form-btn--save" disabled={saving}>
            {saving
              ? <><Loader size={14} /> Enregistrement...</>
              : editingVehicule ? <><Save size={14} /> Modifier</> : <><Save size={14} /> Créer</>
            }
          </button>
        </>
      }
    >
      <form id="vehicle-form" className="vehicle-form__body" onSubmit={handleSubmit} noValidate>

        {errors.global && (
          <div className="form-error-global"><CircleAlert size={14} /> {errors.global}</div>
        )}

        {/* IDENTIFICATION */}
        <div className="form-section">
          <div className="form-section__title"><Key size={14} /> Identification</div>
          <div className="form-group">
            <label className="form-label required">Type de véhicule</label>
            <select name="type_vehicule" value={formData.type_vehicule} onChange={handleChange} className="form-input">
              {getTypeVehicules().map((t: { valeur: string; label: string }) => (
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
              <SivButton
                immatriculation={formData.immatriculation}
                vehicleType={formData.type_vehicule}
                onResult={handleSivResult}
              />
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
          <div className="form-row-2col">
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
            <div className="form-group">
              <label className="form-label">VIN</label>
              <input
                type="text" name="vin" value={formData.vin}
                onChange={handleChange} placeholder="VF1XXXXXXXXXXXXXX"
                maxLength={17}
                className={`form-input ${errors.vin ? 'form-input--error' : ''}`}
              />
              {errors.vin && <span className="form-error">{errors.vin}</span>}
            </div>
          </div>
        </div>

        {/* PROPRIÉTAIRE — autocomplete partagé + création inline */}
        <div className="form-section">
          <div className="form-section__title"><User size={14} /> Propriétaire</div>

          <div className="form-group">
            <label className="form-label">Rechercher un client existant</label>
            <ClientSearchInput
              selected={clientSelected}
              onSelect={handleClientSelect}
              onClear={handleClearClient}
              placeholder="Nom, prénom ou téléphone..."
            />
          </div>

          {!showNewClient && (
            <button
              type="button"
              className="vf-btn-new-client"
              onClick={() => setShowNewClient(true)}
            >
              <UserPlus size={13} /> Créer un nouveau client
            </button>
          )}

          {showNewClient && (
            <ClientFormInLine
              onCreated={handleClientCreated}
              onCancel={() => setShowNewClient(false)}
            />
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
              className="form-input form-textarea" rows={2}
            />
          </div>
        </div>

      </form>
    </Modal>
  );
};

export default VehicleForm;
