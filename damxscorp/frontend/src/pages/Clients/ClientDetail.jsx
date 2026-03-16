// /frontend/src/pages/Clients/ClientDetail.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getInitiales, formatDateLong } from '../../utils/dataFormatters';
import {
  Phone, Mail, MapPin, FileText,
  Car, CalendarDays, Receipt,
  Pencil, Trash2, X, CalendarPlus
} from '../../utils/icons';
import IconChip, { CHIP_COLORS } from '../../components/shared/IconChip';
import './ClientDetail.css';

const ClientDetail = ({ client, onClose, onEdit, onDelete }) => {
  const navigate = useNavigate();

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

  return (
    <div className="client-detail__overlay" onClick={onClose}>
      <div className="client-detail__content" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
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
          <button className="client-detail__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="client-detail__body">

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

          {client.notes && (
            <div className="detail-section">
              <h3 className="detail-section__title"><FileText size={14} /> Notes</h3>
              <div className="detail-notes">{client.notes}</div>
            </div>
          )}

          <div className="detail-section">
            <h3 className="detail-section__title">
              <Car size={14} /> Véhicules
              <span className="detail-section__badge">Bientôt</span>
            </h3>
            <div className="detail-placeholder">Les véhicules de ce client apparaîtront ici</div>
          </div>

          <div className="detail-section">
            <h3 className="detail-section__title">
              <CalendarDays size={14} /> Historique RDV
              <span className="detail-section__badge">Bientôt</span>
            </h3>
            <div className="detail-placeholder">L'historique des rendez-vous apparaîtra ici</div>
          </div>

          <div className="detail-section">
            <h3 className="detail-section__title">
              <Receipt size={14} /> Factures & Devis
              <span className="detail-section__badge">Bientôt</span>
            </h3>
            <div className="detail-placeholder">Les factures et devis apparaîtront ici</div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="client-detail__footer">
          <button className="detail-btn detail-btn--rdv" onClick={handleNewRdv}>
            <IconChip icon={CalendarPlus} color={CHIP_COLORS.calendar} size="sm" /> Nouveau RDV
          </button>
          <div className="client-detail__footer-actions">
            <button className="detail-btn detail-btn--primary" onClick={() => onEdit(client)}>
              <Pencil size={14} /> Modifier
            </button>
            <button className="detail-btn detail-btn--danger" onClick={() => onDelete(client)}>
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientDetail;
