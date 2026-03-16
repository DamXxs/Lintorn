// /frontend/src/pages/Vehicles/VehicleDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVehiculeIcon, getVehiculeTypeLabel } from '../../utils/vehicleService';
import { fetchInterventionsByVehicule, patchIntervention } from '../../services/api';
import ModalRdvConsultation from '../../components/shared/ModalRdvConsultation';
import { Search, Plus, X } from 'lucide-react';
import './VehicleDetail.css';

// ── BADGE STATUT ──────────────────────────────────────────────────
const StatutBadge = ({ statut }) => {
  const config = {
    PLANIFIE: { label: 'Planifié',  color: '#2980b9' },
    EN_COURS: { label: 'En cours',  color: '#e67e22' },
    TERMINE:  { label: 'Terminé',   color: '#27ae60' },
    ANNULE:   { label: 'Annulé',    color: '#7f8c8d' },
  };
  const s = config[statut] || { label: statut, color: '#666' };
  return (
    <span className="vd-statut-badge" style={{ background: s.color }}>
      {s.label}
    </span>
  );
};

const VehicleDetail = ({ vehicule, onClose, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const [interventions, setInterventions]           = useState([]);
  const [loadingHistory, setLoadingHistory]         = useState(true);
  const [consultIntervention, setConsultIntervention] = useState(null);

  // ── CHARGEMENT HISTORIQUE ─────────────────────────────────────
  const loadHistory = async () => {
    if (!vehicule?.id) return;
    try {
      setLoadingHistory(true);
      const data = await fetchInterventionsByVehicule(vehicule.id);
      const sorted = [...data].sort(
        (a, b) => new Date(b.date_debut) - new Date(a.date_debut)
      );
      setInterventions(sorted);
    } catch (err) {
      setInterventions([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { loadHistory(); }, [vehicule?.id]);

  if (!vehicule) return null;

  // ── HELPERS ───────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const formatDateCourt = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

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

  // ── CHANGEMENT STATUT depuis la modal consultation ────────────
  const handleStatusChange = async (id, newStatut) => {
    try {
      await patchIntervention(id, { statut: newStatut });
      // Recharger l'historique pour refléter le nouveau statut
      await loadHistory();
      // Mettre à jour la modal ouverte
      setConsultIntervention(prev => ({ ...prev, statut: newStatut }));
    } catch (err) {
      alert('❌ Erreur lors du changement de statut');
      throw err;
    }
  };

  return (
    <>
      <div className="vehicle-detail__overlay" onClick={onClose}>
        <div className="vehicle-detail__content" onClick={(e) => e.stopPropagation()}>

          {/* HEADER */}
          <div className="vehicle-detail__header">
            <div className="vehicle-detail__header-icon">
              {getVehiculeIcon(vehicule.type_vehicule)}
            </div>
            <div className="vehicle-detail__header-info">
              <div className="vehicle-detail__plate">{vehicule.immatriculation}</div>
              <div className="vehicle-detail__marque-modele">
                {vehicule.marque} {vehicule.modele}
                {vehicule.annee && <span className="vehicle-detail__annee"> — {vehicule.annee}</span>}
              </div>
              <div className="vehicle-detail__type">
                {getVehiculeTypeLabel(vehicule.type_vehicule)}
              </div>
            </div>
            <button className="vehicle-detail__close" onClick={onClose}>✕</button>
          </div>

          {/* BODY */}
          <div className="vehicle-detail__body">

            {/* Propriétaire */}
            <div className="vd-section">
              <h3 className="vd-section__title">👤 Propriétaire</h3>
              {vehicule.proprietaire_nom ? (
                <div className="vd-field">
                  <span className="vd-field__value">{vehicule.proprietaire_nom}</span>
                  <button
                    className="vd-link-btn"
                    onClick={() => {
                      onClose();
                      navigate('/clients', {
                        state: { openClientId: vehicule.proprietaire_id }
                      });
                    }}
                  >
                    Voir la fiche client →
                  </button>
                </div>
              ) : (
                <div className="vd-empty">Aucun propriétaire renseigné</div>
              )}
            </div>

            {/* Infos véhicule */}
            <div className="vd-section">
              <h3 className="vd-section__title">🔧 Informations</h3>
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

            {/* Notes */}
            {vehicule.notes && (
              <div className="vd-section">
                <h3 className="vd-section__title">📝 Notes</h3>
                <div className="vd-notes">{vehicule.notes}</div>
              </div>
            )}

            {/* HISTORIQUE */}
            <div className="vd-section">
              <h3 className="vd-section__title">
                📅 Historique interventions
                {!loadingHistory && (
                  <span className="vd-badge">
                    {interventions.length} intervention{interventions.length > 1 ? 's' : ''}
                  </span>
                )}
              </h3>

              {loadingHistory ? (
                <div className="vd-history-loading">
                  <div className="vd-spinner"></div>
                </div>
              ) : interventions.length === 0 ? (
                <div className="vd-placeholder">
                  Aucune intervention enregistrée pour ce véhicule
                </div>
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

            {/* Factures — placeholder */}
            <div className="vd-section">
              <h3 className="vd-section__title">
                💰 Factures & Devis
                <span className="vd-badge">Bientôt</span>
              </h3>
              <div className="vd-placeholder">Les factures liées à ce véhicule apparaîtront ici</div>
            </div>

            <div className="vd-section">
              <div className="vd-meta">Ajouté le {formatDate(vehicule.date_creation)}</div>
            </div>

          </div>

          {/* FOOTER */}
          <div className="vehicle-detail__footer">
            <button className="vd-btn vd-btn--rdv" onClick={handleNewRdv}>
              📅 Nouveau RDV
            </button>
            <div className="vehicle-detail__footer-actions">
              <button className="vd-btn vd-btn--primary" onClick={() => onEdit(vehicule)}>
                ✏️ Modifier
              </button>
              <button className="vd-btn vd-btn--danger" onClick={() => onDelete(vehicule)}>
                🗑️ Supprimer
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL CONSULTATION — par dessus la fiche véhicule */}
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