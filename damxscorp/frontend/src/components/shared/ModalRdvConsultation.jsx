// /frontend/src/components/shared/ModalRdvConsultation.jsx
import React, { useState } from 'react';
import { getDepartementLabel, getStatutLabel, getStatutClass, STATUTS_RDV } from '../../utils/constants';
import './ModalRdvConsultation.css';

/**
 * 📋 MODAL DE CONSULTATION D'UN RDV
 *
 * Mode lecture → affiche toutes les infos du RDV
 * Bouton "Modifier" → bascule vers ModalForm (édition)
 * Menu statut → met à jour le statut sans fermer
 * Bouton "Supprimer" → confirmation + suppression
 */

const ModalRdvConsultation = ({ event, onClose, onEdit, onDelete, onStatusChange }) => {

  // Statut local (permet de changer sans recharger toute la page)
  const [statut, setStatut] = useState(event?.statut || 'PLANIFIE');
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  if (!event) return null;

  // Déstructuration des données du RDV
  const {
    id,
    type_rdv         = 'ATELIER',
    type_intervention = '',
    client_nom        = 'Inconnu',
    client_prenom     = '',
    client_phone      = '',
    client_email      = '',
    client_adresse    = '',
    vehicule_type     = '',
    vehicule_marque   = '',
    vehicule_modele   = '',
    vehicule_annee    = '',
    vehicule_immatriculation = '',
    description       = '',
  } = event;

  // Les dates peuvent arriver sous date_debut/date_fin ou start/end
  const date_debut = event.date_debut || event.start;
  const date_fin   = event.date_fin   || event.end;

  // Formatage des dates pour affichage
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatHeure = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Changement de statut
  const handleStatusChange = async (newStatut) => {
    setIsChangingStatus(true);
    try {
      setStatut(newStatut);
      await onStatusChange(id, newStatut); // Appel API dans Planning.jsx
    } catch (err) {
      setStatut(statut); // Rollback si erreur
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
    // Overlay : cliquer à l'extérieur ferme la modal
    <div className="modal-consultation__overlay" onClick={onClose}>

      {/* Contenu : stoppe la propagation du clic pour ne pas fermer */}
      <div
        className="modal-consultation__content"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div className="modal-consultation__header">
          <div className="modal-consultation__header-left">
            <span className="modal-consultation__type-badge">
              {getDepartementLabel(type_rdv)}
            </span>
          </div>
          <button className="modal-consultation__close" onClick={onClose}>✕</button>
        </div>

        {/* ── BODY ─────────────────────────────────────────────── */}
        <div className="modal-consultation__body">

          {/* STATUT — menu déroulant */}
          <div className="consult-section">
            <label className="consult-label">📌 Statut du rendez-vous</label>
            <select
              className={`consult-statut-select consult-statut-select--${getStatutClass(statut)}`}
              value={statut}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isChangingStatus}
            >
              {Object.values(STATUTS_RDV).map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <hr className="consult-separator" />

          {/* DATE ET HEURE */}
          <div className="consult-section">
            <label className="consult-label">📅 Planification</label>
            <div className="consult-grid-2">
              <div className="consult-field">
                <span className="consult-field__key">Début</span>
                <span className="consult-field__value">
                  {formatDate(date_debut)} à {formatHeure(date_debut)}
                </span>
              </div>
              <div className="consult-field">
                <span className="consult-field__key">Fin</span>
                <span className="consult-field__value">
                  {formatDate(date_fin)} à {formatHeure(date_fin)}
                </span>
              </div>
            </div>
          </div>

          <hr className="consult-separator" />

          {/* CLIENT */}
          <div className="consult-section">
            <label className="consult-label">👤 Client</label>
            <div className="consult-grid-2">
              <div className="consult-field">
                <span className="consult-field__key">Nom</span>
                <span className="consult-field__value">
                  {client_nom} {client_prenom}
                </span>
              </div>
              {client_phone && (
                <div className="consult-field">
                  <span className="consult-field__key">Téléphone</span>
                  {/* Lien tel:// pour appeler directement sur mobile */}
                  <a href={`tel:${client_phone}`} className="consult-field__value consult-field__link">
                    📞 {client_phone}
                  </a>
                </div>
              )}
              {client_email && (
                <div className="consult-field">
                  <span className="consult-field__key">Email</span>
                  <a href={`mailto:${client_email}`} className="consult-field__value consult-field__link">
                    ✉️ {client_email}
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

          {/* VÉHICULE (si ATELIER) */}
          {type_rdv === 'ATELIER' && (
            <>
              <hr className="consult-separator" />
              <div className="consult-section">
                <label className="consult-label">🚗 Véhicule</label>
                <div className="consult-grid-2">
                  {vehicule_immatriculation && (
                    <div className="consult-field">
                      <span className="consult-field__key">Immatriculation</span>
                      <span className="consult-field__value consult-field__plate">
                        {vehicule_immatriculation}
                      </span>
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

          {/* DESCRIPTION */}
          {description && (
            <>
              <hr className="consult-separator" />
              <div className="consult-section">
                <label className="consult-label">
                  📝 {type_rdv === 'ATELIER' ? 'Travaux à effectuer' : 'Description'}
                </label>
                <div className="consult-description">{description}</div>
              </div>
            </>
          )}

        </div>

        {/* ── FOOTER : BOUTONS D'ACTION ─────────────────────────── */}
        <div className="modal-consultation__footer">
          
          <button className="consult-btn consult-btn--primary" onClick={() => onEdit(event)}>
            ✏️ Modifier
          </button>
          
          <button className="consult-btn consult-btn--danger" onClick={handleDelete}>
            🗑️ Supprimer
          </button>
          
        </div>

      </div>
    </div>
  );
};

export default ModalRdvConsultation;