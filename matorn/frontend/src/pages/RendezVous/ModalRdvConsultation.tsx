// /frontend/src/pages/RendezVous/ModalRdvConsultation.tsx
import React, { useState } from 'react';
import { getDepartementLabel, getStatutClass, STATUTS_RDV } from './rdvService';
import { formatDateFull, formatHeure } from '../../utils/dataFormatters';
import ConfirmModal from '../../components/shared/ConfirmModal/ConfirmModal';
import Modal from '../../components/shared/Modals/Modal';
import FrenchPlateInput from '../../components/shared/plates/FrenchPlateInput';
import IconChip, { CHIP_COLORS } from '../../components/shared/IconChip/IconChip';
import {
  CalendarClock, Pencil, Trash2,
  Car, User, Phone, Mail, FileText, Tag,
} from '../../utils/icons';
import './ModalRdvConsultation.css';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface RdvEvent {
  id:                      number;
  statut?:                 string;
  type_rdv?:               string;
  type_intervention?:      string;
  client_id?:              number;
  client_nom?:             string;
  client_prenom?:          string;
  client_phone?:           string;
  client_email?:           string;
  client_adresse?:         string;
  vehicule_id?:            number;
  vehicule_type?:          string;
  vehicule_marque?:        string;
  vehicule_modele?:        string;
  vehicule_annee?:         string | number;
  vehicule_immatriculation?: string;
  description?:            string;
  // FullCalendar peut envoyer start/end au lieu de date_debut/date_fin
  date_debut?:             string;
  date_fin?:               string;
  start?:                  string;
  end?:                    string;
}

interface ModalRdvConsultationProps {
  event:           RdvEvent;
  onClose:         () => void;
  onEdit:          (event: RdvEvent) => void;
  onDelete:        (id: number) => void;
  onStatusChange:  (id: number, statut: string) => Promise<void>;
  onCreateOr?:     (info: { rdvId: number; clientId: number; vehiculeId: number | null; description: string }) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

const ModalRdvConsultation: React.FC<ModalRdvConsultationProps> = ({
  event, onClose, onEdit, onDelete, onStatusChange, onCreateOr,
}) => {

  const [statut,          setStatut]          = useState(event?.statut || 'PLANIFIE');
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [confirmSuppr,    setConfirmSuppr]    = useState(false);

  if (!event) return null;

  // ── Déstructuration des données du RDV ───────────────────────
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

  // FullCalendar envoie start/end, l'API envoie date_debut/date_fin
  const date_debut = event.date_debut || event.start;
  const date_fin   = event.date_fin   || event.end;

  // ── Changement de statut ─────────────────────────────────────
  const handleStatusChange = async (newStatut: string) => {
    setIsChangingStatus(true);
    const previous = statut;
    try {
      setStatut(newStatut);
      await onStatusChange(id, newStatut);
    } catch {
      setStatut(previous); // rollback si erreur
    } finally {
      setIsChangingStatus(false);
    }
  };

  // ── Suppression ──────────────────────────────────────────────
  const handleDelete = () => setConfirmSuppr(true);

  const doDelete = () => {
    setConfirmSuppr(false);
    onDelete(id);
  };

  // ── Créer un OR depuis ce RDV ─────────────────────────────────
  const CAN_CREATE_OR_STATUTS = ['PLANIFIE', 'RECEPTIONNE', 'EN_COURS'];
  const canCreateOr = onCreateOr && event.client_id && CAN_CREATE_OR_STATUTS.includes(statut);

  const handleCreateOrClick = () => {
    onCreateOr?.({
      rdvId:       event.id,
      clientId:    event.client_id!,
      vehiculeId:  event.vehicule_id ?? null,
      description: description || '',
    });
  };

  // ─────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────

  return (
    <>
      <Modal
        title={getDepartementLabel(type_rdv)}
        titleIcon={<CalendarClock size={20} />}
        onClose={onClose}
        footer={
          <>
            {canCreateOr && (
              <button
                className="modal-btn modal-btn--success"
                onClick={handleCreateOrClick}
                title="Créer un ordre de réparation depuis ce RDV"
              >
                📋 Créer OR
              </button>
            )}
            <button className="modal-btn modal-btn--primary" onClick={() => onEdit(event)}>
              <Pencil size={14} /> Modifier
            </button>
            <button className="modal-btn modal-btn--danger" onClick={handleDelete}>
              <Trash2 size={14} /> Supprimer
            </button>
          </>
        }
      >

        {/* ── STATUT ──────────────────────────────────────────── */}
        <div className="consult-section">
          <label className="consult-label"><Tag size={12} /> Statut du rendez-vous</label>
          <select
            className={`consult-statut-select consult-statut-select--${getStatutClass(statut)}`}
            value={statut}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isChangingStatus}
          >
            {Object.values(STATUTS_RDV).map((s: any) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <hr className="consult-separator" />

        {/* ── DATE ET HEURE ────────────────────────────────────── */}
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

        {/* ── CLIENT ───────────────────────────────────────────── */}
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

        {/* ── VÉHICULE (ATELIER uniquement) ────────────────────── */}
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

        {/* ── DESCRIPTION ──────────────────────────────────────── */}
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

      {/* ConfirmModal DOIT être frère de Modal, tous deux dans le fragment <> */}
      <ConfirmModal
        isOpen={confirmSuppr}
        title="Supprimer ce rendez-vous ?"
        message="Cette action est irréversible."
        variant="danger"
        labelConfirm="Supprimer"
        onConfirm={doDelete}
        onCancel={() => setConfirmSuppr(false)}
      />
    </>
  );
};

export default ModalRdvConsultation;
