// /frontend/src/pages/Vehicles/VehicleDetail.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getVehiculeIcon, getVehiculeTypeLabel } from '../../utils/vehicleService';
import './VehicleDetail.css';

const VehicleDetail = ({ vehicule, onClose, onEdit, onDelete }) => {
  const navigate = useNavigate();

  if (!vehicule) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  // Nouveau RDV pré-rempli avec les infos véhicule
  const handleNewRdv = () => {
    onClose();
    navigate('/planning', {
      state: {
        clientPrefill: {
          plate:        vehicule.immatriculation || '',
          vehicleBrand: vehicule.marque          || '',
          vehicleModel: vehicule.modele          || '',
          vehicleYear:  vehicule.annee           ? String(vehicule.annee) : '',
          vehicleType:  vehicule.type_vehicule   || 'VOITURE',
        }
      }
    });
  };

  return (
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
                  onClick={() => navigate('/clients')}
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

          {/* Historique — placeholder */}
          <div className="vd-section">
            <h3 className="vd-section__title">
              📅 Historique interventions
              <span className="vd-badge">Bientôt</span>
            </h3>
            <div className="vd-placeholder">
              L'historique des interventions sur ce véhicule apparaîtra ici
            </div>
          </div>

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
  );
};

export default VehicleDetail;