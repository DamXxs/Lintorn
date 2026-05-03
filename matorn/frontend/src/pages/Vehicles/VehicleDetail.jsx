// /frontend/src/pages/Vehicles/VehicleDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useVehiculeHelpers from '../../hooks/useVehiculeHelpers'; // ← hook dynamique
import { fetchInterventionsByVehicule, patchIntervention } from '../../services/api';
import { formatDateLong, formatDateCourt } from '../../utils/dataFormatters';
import ModalRdvConsultation from '../RendezVous/ModalRdvConsultation';
import Modal from '../../components/shared/Modals/Modal';
import PlateSelector from '../../components/shared/plates/PlateSelector';
import StatutBadge from '../../components/shared/StatutBadge';
import IconChip, { CHIP_COLORS } from '../../components/shared/IconChip/IconChip';
import {
  User, Wrench, FileText, CalendarDays, Receipt,
  CalendarPlus, Pencil, Trash2,
} from '../../utils/icons';
import './VehicleDetail.css';

const VehicleDetail = ({ vehicule, onClose, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { getVehiculeIcon, getVehiculeTypeLabel } = useVehiculeHelpers(); // ← hook dynamique

  const [interventions, setInterventions]             = useState([]);
  const [loadingHistory, setLoadingHistory]           = useState(true);
  const [consultIntervention, setConsultIntervention] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!vehicule?.id) return;
    try {
      setLoadingHistory(true);
      const data = await fetchInterventionsByVehicule(vehicule.id);
      const sorted = [...data].sort(
        (a, b) => new Date(b.date_debut) - new Date(a.date_debut)
      );
      setInterventions(sorted);
    } catch {
      setInterventions([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [vehicule?.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  if (!vehicule) return null;

  const handleNewRdv = () => {
    onClose();
    navigate('/planning', {
      state: {
        clientPrefill: {
          plate:        vehicule.immatriculation || '',
          vehicleBrand: vehicule.marque          || '',
          vehicleModel: vehicule.modele          || '',
          vehicleYear:  vehicule.annee ? String(vehicule.annee) : '',
          vehicleType:  vehicule.type_vehicule   || 'VOITURE',
        }
      }
    });
  };

  const handleStatusChange = async (id, newStatut) => {
    try {
      await patchIntervention(id, { statut: newStatut });
      await loadHistory();
      setConsultIntervention(prev => ({ ...prev, statut: newStatut }));
    } catch {
      alert('❌ Erreur lors du changement de statut');
      throw new Error('Erreur statut');
    }
  };

  const titleText = [vehicule.marque, vehicule.modele, vehicule.annee && `(${vehicule.annee})`]
    .filter(Boolean).join(' ');

  return (
    <>
      <Modal
        title={titleText}
        titleIcon={getVehiculeIcon(vehicule.type_vehicule)}
        onClose={onClose}
        footer={
          <div className="modal-footer--col" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="modal-btn modal-btn--success" onClick={handleNewRdv}>
              <IconChip icon={CalendarPlus} color={CHIP_COLORS.calendar} size="sm" /> Nouveau RDV
            </button>
              <div className="modal-footer__actions">
                <button className="modal-btn modal-btn--primary" onClick={() => onEdit(vehicule)}>
                  <Pencil size={14} /> Modifier
                </button>
                <button className="modal-btn modal-btn--danger" onClick={() => onDelete(vehicule)}>
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          }
      >
        <div className="vehicle-detail__body">

          <div className="vd-plate-hero">
            <PlateSelector
              vehicleType={vehicule.type_vehicule}
              value={vehicule.immatriculation}
              size="lg"
              readOnly
            />
            <span className="vd-type-label">
              {getVehiculeTypeLabel(vehicule.type_vehicule)}
            </span>
          </div>

          <div className="vd-section">
            <h3 className="vd-section__title"><User size={14} /> Propriétaire</h3>
            {vehicule.proprietaire_nom ? (
              <div className="vd-proprietaire">
                <div className="vd-proprietaire__avatar">
                  {vehicule.proprietaire_nom.charAt(0).toUpperCase()}
                </div>
                <span className="vd-proprietaire__nom">{vehicule.proprietaire_nom}</span>
                <button
                  className="vd-btn-client"
                  onClick={() => {
                    onClose();
                    navigate('/clients', {
                      state: { openClientId: vehicule.proprietaire_id }
                    });
                  }}
                >
                  <Pencil size={11} />
                  Voir la fiche client
                </button>
              </div>
            ) : (
              <div className="vd-empty">Aucun propriétaire renseigné</div>
            )}
          </div>

          <div className="vd-section">
            <h3 className="vd-section__title"><Wrench size={14} /> Informations</h3>
            <div className="vd-grid">
              <div className="vd-field">
                <span className="vd-field__key">Marque</span>
                <span className="vd-field__value">{vehicule.marque || '—'}</span>
              </div>
              <div className="vd-field">
                <span className="vd-field__key">Modèle</span>
                <span className="vd-field__value">{vehicule.modele || '—'}</span>
              </div>
              <div className="vd-field">
                <span className="vd-field__key">Année</span>
                <span className="vd-field__value">{vehicule.annee || '—'}</span>
              </div>
              <div className="vd-field">
                <span className="vd-field__key">Type</span>
                <span className="vd-field__value">{getVehiculeTypeLabel(vehicule.type_vehicule)}</span>
              </div>
            </div>
          </div>

          {vehicule.notes && (
            <div className="vd-section">
              <h3 className="vd-section__title"><FileText size={14} /> Notes</h3>
              <div className="vd-notes">{vehicule.notes}</div>
            </div>
          )}

          <div className="vd-section">
            <h3 className="vd-section__title">
              <CalendarDays size={14} /> Historique interventions
              {!loadingHistory && (
                <span className="vd-badge">
                  {interventions.length} intervention{interventions.length !== 1 ? 's' : ''}
                </span>
              )}
            </h3>
            {loadingHistory ? (
              <div className="vd-history-loading"><div className="vd-spinner" /></div>
            ) : interventions.length === 0 ? (
              <div className="vd-placeholder">Aucune intervention enregistrée pour ce véhicule</div>
            ) : (
              <div className="vd-history-list">
                {interventions.map(intervention => (
                  <div
                    key={intervention.id}
                    className="vd-history-row vd-history-row--clickable"
                    onClick={() => setConsultIntervention(intervention)}
                  >
                    <span className="vd-history-date">
                      {formatDateCourt(intervention.date_debut)}
                    </span>
                    <span className="vd-history-type">
                      {intervention.description
                        ? intervention.description.slice(0, 40) + (intervention.description.length > 40 ? '…' : '')
                        : intervention.type_rdv}
                    </span>
                    <StatutBadge statut={intervention.statut} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="vd-section">
            <h3 className="vd-section__title">
              <Receipt size={14} /> Factures & Devis
              <span className="vd-badge">Disponible(s)</span>
            </h3>
            <div className="vd-placeholder">Les factures liées à ce véhicule apparaîtront ici</div>
          </div>

          <div className="vd-section">
            <div className="vd-meta">Ajouté le {formatDateLong(vehicule.date_creation)}</div>
          </div>

        </div>
      </Modal>

      {consultIntervention && (
        <ModalRdvConsultation
          event={consultIntervention}
          onClose={() => setConsultIntervention(null)}
          onEdit={() => setConsultIntervention(null)}
          onDelete={() => setConsultIntervention(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
};

export default VehicleDetail;