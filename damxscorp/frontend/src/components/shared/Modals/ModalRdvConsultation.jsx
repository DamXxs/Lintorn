// /frontend/src/components/shared/ModalRdvConsultation.jsx
import React, { useState } from 'react';
import { getDepartementLabel, getStatutClass, STATUTS_RDV } from '../../../pages/RendezVous/rdvService';
import { formatDateFull, formatHeure } from '../../../utils/dataFormatters';
import './ModalRdvConsultation.css';
import Modal from './Modal';
import FrenchPlateInput from '../Frenchplate/FrenchPlateInput';
import IconChip, { CHIP_COLORS } from '../IconChip/IconChip';
import {
  CalendarClock, Pencil, Trash2,
  Car, User, Phone, Mail, FileText, Tag,
} from '../../../utils/icons';

/**
 * 📋 MODAL DE CONSULTATION D'UN RDV
 *
 * Mode lecture → affiche toutes les infos du RDV
 * Bouton "Modifier" → bascule vers ModalForm (édition)
 * Menu statut → met à jour le statut sans fermer
 * Bouton "Supprimer" → confirmation + suppression
 *
 * Utilise Modal.jsx pour l'overlay, le header (titre + ✕) et le footer.
 */

const ModalRdvConsultation = ({ event, onClose, onEdit, onDelete, onStatusChange }) => {

  const [statut, setStatut] = useState(event?.statut || 'PLANIFIE');
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  if (!event) return null;

  // Déstructuration des données du RDV
  const {
    id,
    type_rdv              = 'ATELIER',
    type_intervention     = '',
    client_nom            = 'Inconnu',
    client_prenom         = '',
    client_phone          = '',
    client_email          = '',
    client_adresse        = '',
    vehicule_type         = '',
    vehicule_marque       = '',
    vehicule_modele       = '',
    vehicule_annee        = '',
    vehicule_immatriculation = '',
    description           = '',
  } = event;

  // Les dates peuvent arriver sous date_debut/date_fin ou start/end
  const date_debut = event.date_debut || event.start;
  const date_fin   = event.date_fin   || event.end;

  // Changement de statut
  const handleStatusChange = async (newStatut) => {
    setIsChangingStatus(true);
    try {
      setStatut(newStatut);
      await onStatusChange(id, newStatut);
    } catch (err) {
      setStatut(statut); // Rollback si erreur API
    } finally {
      setIsChangingStatus(false);
    }
  };

  // Suppression avec confirmation
  const handleDelete = () => {
    if (window.confirm('🗑️ Supprimer ce rendez-vous définitivement ?')) {
      onDelete(id);
    }
  };

  return (
    <Modal
      title={getDepartementLabel(type_rdv)}
      titleIcon={<CalendarClock size={15} />}
      onClose={onClose}
      footer={
        <>
          <button className="consult-btn consult-btn--primary" onClick={() => onEdit(event)}>
            <Pencil size={14} /> Modifier
          </button>
          <button className="consult-btn consult-btn--danger" onClick={handleDelete}>
            <Trash2 size={14} /> Supprimer
          </button>
        </>
      }
    >

      {/* ── STATUT — menu déroulant ─────────────────────────────── */}
      <div className="consult-section">
        <label className="consult-label"><Tag size={12} /> Statut du rendez-vous</label>
        <select
          className={`consult-statut-select consult-statut-select--${getStatutClass(statut)}`}
          value={statut}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isChangingStatus}
        >
          {Object.values(STATUTS_RDV).map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <hr className="consult-separator" />

      {/* ── DATE ET HEURE ───────────────────────────────────────── */}
      <div className="consult-section">
        <label className="consult-label"><CalendarClock size={12} /> Planification</label>
        <div className="consult-grid-2">
          <div className="consult-field">
            <span className="consult-field__key">Début</span>
            <span className="consult-field__value">
              {formatDateFull(date_debut)} à {formatHeure(date_debut)}
            </span>
          </div>
          <div className="consult-field">
            <span className="consult-field__key">Fin</span>
            <span className="consult-field__value">
              {formatDateFull(date_fin)} à {formatHeure(date_fin)}
            </span>
          </div>
        </div>
      </div>

      <hr className="consult-separator" />

      {/* ── CLIENT ──────────────────────────────────────────────── */}
      <div className="consult-section">
        <label className="consult-label"><User size={12} /> Client</label>
        <div className="consult-grid-2">
          <div className="consult-field">
            <span className="consult-field__key">Nom</span>
            <span className="consult-field__value">{client_nom} {client_prenom}</span>
          </div>
          {client_phone && (
            <div className="consult-field">
              <span className="consult-field__key">Téléphone</span>
              <a href={`tel:${client_phone}`} className="consult-field__value consult-field__link">
                <IconChip icon={Phone} color={CHIP_COLORS.phone} size="sm" /> {client_phone}
              </a>
            </div>
          )}
          {client_email && (
            <div className="consult-field">
              <span className="consult-field__key">Email</span>
              <a href={`mailto:${client_email}`} className="consult-field__value consult-field__link">
                <IconChip icon={Mail} color={CHIP_COLORS.mail} size="sm" /> {client_email}
              </a>
            </div>
          )}
          {client_adresse && (
            <div className="consult-field">
              <span className="consult-field__key">Adresse</span>
              <span className="consult-field__value">{client_adresse}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── VÉHICULE (si ATELIER) ───────────────────────────────── */}
      {type_rdv === 'ATELIER' && (
        <>
          <hr className="consult-separator" />
          <div className="consult-section">
            <label className="consult-label"><Car size={12} /> Véhicule</label>
            <div className="consult-grid-2">
              {vehicule_immatriculation && (
                <div className="consult-field">
                  <span className="consult-field__key">Immatriculation</span>
                  <FrenchPlateInput value={vehicule_immatriculation} size="md" readOnly />
                </div>
              )}
              {(vehicule_marque || vehicule_modele) && (
                <div className="consult-field">
                  <span className="consult-field__key">Véhicule</span>
                  <span className="consult-field__value">
                    {vehicule_marque} {vehicule_modele} {vehicule_annee && `(${vehicule_annee})`}
                  </span>
                </div>
              )}
              {vehicule_type && (
                <div className="consult-field">
                  <span className="consult-field__key">Type</span>
                  <span className="consult-field__value">{vehicule_type}</span>
                </div>
              )}
              {type_intervention && (
                <div className="consult-field">
                  <span className="consult-field__key">Intervention</span>
                  <span className="consult-field__value">{type_intervention}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── DESCRIPTION ─────────────────────────────────────────── */}
      {description && (
        <>
          <hr className="consult-separator" />
          <div className="consult-section">
            <label className="consult-label">
              <FileText size={12} /> {type_rdv === 'ATELIER' ? 'Travaux à effectuer' : 'Description'}
            </label>
            <div className="consult-description">{description}</div>
          </div>
        </>
      )}

    </Modal>
  );
};

export default ModalRdvConsultation;