// /frontend/src/components/shared/inline/ClientFormInLine.tsx
//
// Formulaire de création rapide d'un client, intégrable dans n'importe quelle modale.
// Auto-contenu : gère son propre état, sa validation et l'appel API.
// Usage : <ClientFormInLine onCreated={(client) => ...} onCancel={() => ...} />

import React, { useState, useEffect, useRef } from 'react';
import { addClient } from '../../../pages/Clients/clientService';
import { fetchClients } from '../../../services/api';
import {
  validateNom, validatePhone, validateEmail,
  formatNom, formatPrenom, formatPhone,
} from '../../../utils/validators';
import AddressAutocomplete from '../AdressAutocomplete/AddressAutocomplete';
import { User, Phone, Save, Loader, CircleAlert, CircleCheck, X } from '../../../utils/icons';
import './ClientFormInLine.css';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ClientLite {
  id:         number;
  nom:        string;
  prenom:     string;
  telephone:  string;
  email?:     string;
  adresse?:   string;
}

interface Props {
  onCreated: (client: ClientLite) => void;
  onCancel:  () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — Normalisation pour comparaison floue
// ─────────────────────────────────────────────────────────────────────────────

const normalizeStr = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const normalizePhone = (s: string) => s.replace(/\D/g, '');

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

const ClientFormInLine: React.FC<Props> = ({ onCreated, onCancel }) => {

  const [formData,   setFormData]   = useState({
    nom: '', prenom: '', telephone: '', email: '', adresse: '',
  });
  const [errors,     setErrors]     = useState<Record<string, string | null>>({});
  const [saving,     setSaving]     = useState(false);
  const [allClients, setAllClients] = useState<ClientLite[]>([]);
  const [duplicate,  setDuplicate]  = useState<ClientLite | null>(null);
  const [forcedCreate, setForcedCreate] = useState(false);
  const dupCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Charger tous les clients au montage pour la détection de doublons
  useEffect(() => {
    fetchClients().then((data: any[]) => setAllClients(data as ClientLite[])).catch(() => {});
  }, []);

  // ── Détection de doublons ──────────────────────────────────────
  const checkDuplicate = (nom: string, telephone: string) => {
    if (dupCheckTimeout.current) clearTimeout(dupCheckTimeout.current);
    dupCheckTimeout.current = setTimeout(() => {
      const normNom   = normalizeStr(nom);
      const normPhone = normalizePhone(telephone);
      if (!normNom && !normPhone) { setDuplicate(null); return; }

      const found = allClients.find(c => {
        const cNom   = normalizeStr(c.nom);
        const cPhone = normalizePhone(c.telephone || '');
        const nomMatch   = normNom.length >= 2 && cNom.startsWith(normNom);
        const phoneMatch = normPhone.length >= 6 && cPhone === normPhone;
        return nomMatch || phoneMatch;
      });
      setDuplicate(found || null);
    }, 400);
  };

  // ── Changements avec formatters ────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'nom')       value = formatNom(value);
    if (name === 'prenom')    value = formatPrenom(value);
    if (name === 'telephone') value = formatPhone(value);
    const next = { ...formData, [name]: value };
    setFormData(next);
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    // Vérifier doublons sur nom ou téléphone
    if (name === 'nom' || name === 'telephone') {
      setForcedCreate(false);
      checkDuplicate(
        name === 'nom' ? value : formData.nom,
        name === 'telephone' ? value : formData.telephone,
      );
    }
  };

  // ── Validation ─────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const nomErr   = validateNom(formData.nom);
    const phoneErr = validatePhone(formData.telephone);
    const emailErr = validateEmail(formData.email);
    if (nomErr)   errs.nom       = nomErr;
    if (phoneErr) errs.telephone = phoneErr;
    if (emailErr) errs.email     = emailErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Soumission ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const nouveau = await addClient(formData) as ClientLite;
      onCreated(nouveau);
    } catch (err: any) {
      setErrors({ global: err.message || 'Erreur lors de la création' });
    } finally {
      setSaving(false);
    }
  };

  // ── Rendu ──────────────────────────────────────────────────────
  return (
    <div className="cfi-wrapper">

      {/* En-tête */}
      <div className="cfi-header">
        <span className="cfi-header__title"><User size={13} /> Nouveau client</span>
        <button type="button" className="cfi-header__close" onClick={onCancel} title="Annuler">
          <X size={14} />
        </button>
      </div>

      {errors.global && (
        <div className="cfi-error-global">
          <CircleAlert size={12} /> {errors.global}
        </div>
      )}

      {/* Bandeau doublon */}
      {duplicate && !forcedCreate && (
        <div className="cfi-duplicate-warning">
          <span className="cfi-duplicate-warning__text">
            <CircleAlert size={12} />
            Client similaire&nbsp;: <strong>{duplicate.nom} {duplicate.prenom || ''}</strong>
            {duplicate.telephone && <> — {duplicate.telephone}</>}
          </span>
          <div className="cfi-duplicate-warning__actions">
            <button
              type="button"
              className="cfi-btn-dup cfi-btn-dup--use"
              onClick={() => onCreated(duplicate)}
            >
              <CircleCheck size={12} /> Utiliser ce client
            </button>
            <button
              type="button"
              className="cfi-btn-dup cfi-btn-dup--force"
              onClick={() => setForcedCreate(true)}
            >
              Créer quand même
            </button>
          </div>
        </div>
      )}

      {/* Nom + Prénom */}
      <div className="cfi-row-2">
        <div className="cfi-group">
          <label className="cfi-label">Nom <span className="cfi-required">*</span></label>
          <input
            type="text" name="nom" value={formData.nom}
            onChange={handleChange} placeholder="DUPONT"
            className={`cfi-input ${errors.nom ? 'cfi-input--error' : ''}`}
          />
          {errors.nom && <span className="cfi-field-error">{errors.nom}</span>}
        </div>
        <div className="cfi-group">
          <label className="cfi-label">Prénom</label>
          <input
            type="text" name="prenom" value={formData.prenom}
            onChange={handleChange} placeholder="Jean"
            className="cfi-input"
          />
        </div>
      </div>

      {/* Téléphone + Email */}
      <div className="cfi-row-2">
        <div className="cfi-group">
          <label className="cfi-label"><Phone size={11} /> Téléphone</label>
          <input
            type="tel" name="telephone" value={formData.telephone}
            onChange={handleChange} placeholder="06 12 34 56 78"
            className={`cfi-input ${errors.telephone ? 'cfi-input--error' : ''}`}
          />
          {errors.telephone && <span className="cfi-field-error">{errors.telephone}</span>}
        </div>
        <div className="cfi-group">
          <label className="cfi-label">Email</label>
          <input
            type="text" name="email" value={formData.email}
            onChange={handleChange} placeholder="jean@mail.fr"
            className={`cfi-input ${errors.email ? 'cfi-input--error' : ''}`}
          />
          {errors.email && <span className="cfi-field-error">{errors.email}</span>}
        </div>
      </div>

      {/* Adresse avec autocomplétion */}
      <div className="cfi-group">
        <label className="cfi-label">Adresse</label>
        <AddressAutocomplete
          value={formData.adresse}
          onChange={(val: string) => setFormData(prev => ({ ...prev, adresse: val }))}
          onSelect={(obj: { adresse: string }) =>
            setFormData(prev => ({ ...prev, adresse: obj.adresse }))
          }
        />
      </div>

      {/* Actions */}
      <div className="cfi-actions">
        <button type="button" className="cfi-btn cfi-btn--cancel" onClick={onCancel} disabled={saving}>
          Annuler
        </button>
        <button type="button" className="cfi-btn cfi-btn--save" onClick={handleSubmit} disabled={saving}>
          {saving
            ? <><Loader size={13} /> Création...</>
            : <><Save size={13} /> Créer et sélectionner</>
          }
        </button>
      </div>

    </div>
  );
};

export default ClientFormInLine;
