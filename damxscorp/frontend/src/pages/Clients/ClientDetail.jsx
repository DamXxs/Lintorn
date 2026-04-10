// /frontend/src/pages/Clients/ClientDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInitiales, formatDateLong, formatDateCourt } from '../../utils/dataFormatters';
import { fetchInterventionsByClient, fetchVehiculesByClient, patchIntervention } from '../../services/api';
import { removeVehicule } from '../Vehicles/vehicleService';
import useVehiculeHelpers from '../../hooks/useVehiculeHelpers'; // ← hook dynamique
import VehicleForm from '../Vehicles/VehicleForm';
import FrenchPlateInput from '../../components/shared/Frenchplate/FrenchPlateInput';
import StatutBadge from '../../components/shared/StatutBadge';
import ModalRdvConsultation from '../RendezVous/ModalRdvConsultation';
import VehicleDetail from '../Vehicles/VehicleDetail';
import Modal from '../../components/shared/Modals/Modal';
import {
  Phone, Mail, MapPin, FileText,
  Car, CalendarDays, Receipt,
  Pencil, Trash2, X, CalendarPlus, Loader, Plus
} from '../../utils/icons';
import IconChip, { CHIP_COLORS } from '../../components/shared/IconChip/IconChip';
import './ClientDetail.css';

const ClientDetail = ({ client, onClose, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { getVehiculeIcon } = useVehiculeHelpers(); // ← hook dynamique

  const [vehicules, setVehicules]                     = useState([]);
  const [interventions, setInterventions]             = useState([]);
  const [loadingVehicules, setLoadingVehicules]       = useState(true);
  const [loadingHistory, setLoadingHistory]           = useState(true);
  const [consultIntervention, setConsultIntervention] = useState(null);
  const [selectedVehicule, setSelectedVehicule]       = useState(null);
  const [editingVehicule, setEditingVehicule]         = useState(null);
  const [isVehicleFormOpen, setIsVehicleFormOpen]     = useState(false);

  // ── Chargement des véhicules ───────────────────────────────────
  const loadVehicules = useCallback(async () => {
    if (!client?.id) return;
    setLoadingVehicules(true);
    fetchVehiculesByClient(client.id)
      .then(data => setVehicules(data))
      .catch(() => setVehicules([]))
      .finally(() => setLoadingVehicules(false));
  }, [client?.id]);

  useEffect(() => { loadVehicules(); }, [loadVehicules]);

  // ── Chargement historique RDV ──────────────────────────────────
  useEffect(() => {
    if (!client?.id) return;
    setLoadingHistory(true);
    fetchInterventionsByClient(client.id)
      .then(data => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.date_debut) - new Date(a.date_debut)
        );
        setInterventions(sorted);
      })
      .catch(() => setInterventions([]))
      .finally(() => setLoadingHistory(false));
  }, [client?.id]);

  if (!client) return null;

  const handleNewRdv = () => {
    onClose();
    navigate('/planning', {
      state: {
        clientPrefill: {
          clientName:      client.nom       || '',
          clientFirstName: client.prenom    || '',
          clientPhone:     client.telephone || '',
          clientEmail:     client.email     || '',
          clientAddress:   client.adresse   || '',
        }
      }
    });
  };

  // ── Changement de statut depuis la modal consultation ──────────
  const handleStatusChange = async (id, newStatut) => {
    try {
      await patchIntervention(id, { statut: newStatut });
      setInterventions(prev =>
        prev.map(i => i.id === id ? { ...i, statut: newStatut } : i)
      );
      setConsultIntervention(prev => ({ ...prev, statut: newStatut }));
    } catch (err) {
      alert('Erreur lors du changement de statut');
      throw err;
    }
  };

  // ── Header custom avec avatar ──────────────────────────────────
  const customHeader = (
    <div className="client-detail__header">
      <div className="client-detail__avatar">
        {getInitiales(client.nom, client.prenom)}
      </div>
      <div className="client-detail__header-info">
        <h2 className="client-detail__name">{client.nom} {client.prenom}</h2>
        <span className="client-detail__since">
          Client depuis {formatDateLong(client.date_creation)}
        </span>
      </div>
      <button className="modal-close" onClick={onClose} type="button">
        <X size={18} />
      </button>
    </div>
  );

  // ── Footer avec 2 rangées ──────────────────────────────────────
  const footer = (
    <div className="cd-footer-wrap">
      <button className="detail-btn detail-btn--rdv" onClick={handleNewRdv}>
        <IconChip icon={CalendarPlus} color={CHIP_COLORS.calendar} size="sm" /> Nouveau RDV
      </button>
      <div className="cd-footer-actions">
        <button className="detail-btn detail-btn--primary" onClick={() => onEdit(client)}>
          <Pencil size={14} /> Modifier
        </button>
        <button className="detail-btn detail-btn--danger" onClick={() => onDelete(client)}>
          <Trash2 size={14} /> Supprimer
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Modal onClose={onClose} customHeader={customHeader} footer={footer}>

        {/* COORDONNÉES */}
        <div className="detail-section">
          <h3 className="detail-section__title">
            <FileText size={14} /> Coordonnées
          </h3>
          <div className="detail-grid">
            <div className="detail-field">
              <span className="detail-field__key">Téléphone</span>
              {client.telephone ? (
                <a href={`tel:${client.telephone}`} className="detail-field__value detail-field__link">
                  <IconChip icon={Phone} color={CHIP_COLORS.phone} size="sm" /> {client.telephone}
                </a>
              ) : (
                <span className="detail-field__value detail-field__empty">Non renseigné</span>
              )}
            </div>
            <div className="detail-field">
              <span className="detail-field__key">Email</span>
              {client.email ? (
                <a href={`mailto:${client.email}`} className="detail-field__value detail-field__link">
                  <IconChip icon={Mail} color={CHIP_COLORS.mail} size="sm" /> {client.email}
                </a>
              ) : (
                <span className="detail-field__value detail-field__empty">Non renseigné</span>
              )}
            </div>
            {client.adresse && (
              <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                <span className="detail-field__key">Adresse</span>
                <span className="detail-field__value">
                  <IconChip icon={MapPin} color={CHIP_COLORS.location} size="sm" /> {client.adresse}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* NOTES */}
        {client.notes && (
          <div className="detail-section">
            <h3 className="detail-section__title"><FileText size={14} /> Notes</h3>
            <div className="detail-notes">{client.notes}</div>
          </div>
        )}

        {/* VÉHICULES */}
        <div className="detail-section">
          <h3 className="detail-section__title">
            <Car size={14} /> Véhicules
            {!loadingVehicules && vehicules.length > 0 && (
              <span className="detail-section__badge">{vehicules.length}</span>
            )}
            {/* ── Bouton Ajouter un véhicule ── */}
            <button
              className="cd-add-vehicle-btn"
              onClick={() => { setEditingVehicule(null); setIsVehicleFormOpen(true); }}
              title="Ajouter un véhicule à ce client"
            >
              <Plus size={12} /> Ajouter
            </button>
          </h3>

          {loadingVehicules ? (
            <div className="cd-loading"><Loader size={16} /> Chargement...</div>
          ) : vehicules.length === 0 ? (
            <div className="detail-placeholder">
              Aucun véhicule enregistré —{' '}
              <button
                className="cd-placeholder-link"
                onClick={() => { setEditingVehicule(null); setIsVehicleFormOpen(true); }}
              >
                ajouter maintenant
              </button>
            </div>
          ) : (
            <div className="cd-vehicle-list">
              {vehicules.map(v => (
                <div key={v.id} className="cd-vehicle-card" onClick={() => setSelectedVehicule(v)}>
                  <span className="cd-vehicle-card__icon">
                    {getVehiculeIcon(v.type_vehicule)}
                  </span>
                  <div className="cd-vehicle-card__info">
                    <FrenchPlateInput value={v.immatriculation} size="sm" readOnly />
                    <span className="cd-vehicle-card__label">
                      {v.marque} {v.modele}
                      {v.annee && <span className="cd-vehicle-card__year"> — {v.annee}</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HISTORIQUE RDV */}
        <div className="detail-section">
          <h3 className="detail-section__title">
            <CalendarDays size={14} /> Historique RDV
            {!loadingHistory && interventions.length > 0 && (
              <span className="detail-section__badge">{interventions.length}</span>
            )}
          </h3>

          {loadingHistory ? (
            <div className="cd-loading"><Loader size={16} /> Chargement...</div>
          ) : interventions.length === 0 ? (
            <div className="detail-placeholder">Aucun rendez-vous enregistré pour ce client</div>
          ) : (
            <div className="cd-history-list">
              {interventions.map(intervention => (
                <div
                  key={intervention.id}
                  className="cd-history-row"
                  onClick={() => setConsultIntervention(intervention)}
                >
                  <span className="cd-history-date">
                    {formatDateCourt(intervention.date_debut)}
                  </span>
                  <span className="cd-history-desc">
                    {intervention.description
                      ? intervention.description.slice(0, 35) + (intervention.description.length > 35 ? '…' : '')
                      : intervention.type_rdv}
                  </span>
                  <StatutBadge statut={intervention.statut} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FACTURES — placeholder */}
        <div className="detail-section">
          <h3 className="detail-section__title">
            <Receipt size={14} /> Factures & Devis
            <span className="detail-section__badge">Bientôt</span>
          </h3>
          <div className="detail-placeholder">Les factures et devis apparaîtront ici</div>
        </div>

      </Modal>

      {/* MODAL CONSULTATION RDV — par dessus la fiche client */}
      {consultIntervention && (
        <ModalRdvConsultation
          event={consultIntervention}
          onClose={() => setConsultIntervention(null)}
          onEdit={() => setConsultIntervention(null)}
          onDelete={() => setConsultIntervention(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* FICHE VÉHICULE — par dessus la fiche client */}
      {selectedVehicule && (
        <VehicleDetail
          vehicule={selectedVehicule}
          onClose={() => setSelectedVehicule(null)}
          onEdit={(v) => {
            setSelectedVehicule(null);
            setEditingVehicule(v);
            setIsVehicleFormOpen(true);
          }}
          onDelete={async (v) => {
            if (window.confirm(`Supprimer "${v.marque} ${v.modele}" ?`)) {
              try {
                await removeVehicule(v.id);
                setSelectedVehicule(null);
                await loadVehicules();
              } catch {
                alert('❌ Erreur lors de la suppression');
              }
            }
          }}
        />
      )}

      {/* FORMULAIRE VÉHICULE — création ou modification */}
      {isVehicleFormOpen && (
        <VehicleForm
          editingVehicule={editingVehicule}
          onClose={() => { setIsVehicleFormOpen(false); setEditingVehicule(null); }}
          onSuccess={async () => {
            setIsVehicleFormOpen(false);
            setEditingVehicule(null);
            await loadVehicules();
          }}
        />
      )}
    </>
  );
};

export default ClientDetail;
