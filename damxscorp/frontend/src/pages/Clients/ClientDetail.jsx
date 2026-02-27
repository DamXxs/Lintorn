// /frontend/src/pages/Clients/ClientDetail.jsx
import React from 'react';
import './ClientDetail.css';

const ClientDetail = ({ client, onClose, onEdit, onDelete }) => {

  if (!client) return null;

  // Formater la date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  // Initiales pour l'avatar
  const getInitiales = (nom, prenom) => {
    const n = nom?.charAt(0)?.toUpperCase() || '';
    const p = prenom?.charAt(0)?.toUpperCase() || '';
    return `${n}${p}` || '?';
  };

  return (
    // Overlay : cliquer à l'extérieur ferme la modale
    <div className="client-detail__overlay" onClick={onClose}>

      {/* Contenu : stoppe la propagation du clic */}
      <div
        className="client-detail__content"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="client-detail__header">
          <div className="client-detail__avatar">
            {getInitiales(client.nom, client.prenom)}
          </div>
          <div className="client-detail__header-info">
            <h2 className="client-detail__name">
              {client.nom} {client.prenom}
            </h2>
            <span className="client-detail__since">
              Client depuis {formatDate(client.date_creation)}
            </span>
          </div>
          <button className="client-detail__close" onClick={onClose}>✕</button>
        </div>

        {/* ── BODY ───────────────────────────────────────────── */}
        <div className="client-detail__body">

          {/* COORDONNÉES */}
          <div className="detail-section">
            <h3 className="detail-section__title">📋 Coordonnées</h3>
            <div className="detail-grid">

              <div className="detail-field">
                <span className="detail-field__key">Téléphone</span>
                {client.telephone ? (
                  <a
                    href={`tel:${client.telephone}`}
                    className="detail-field__value detail-field__link"
                  >
                    📞 {client.telephone}
                  </a>
                ) : (
                  <span className="detail-field__value detail-field__empty">Non renseigné</span>
                )}
              </div>

              <div className="detail-field">
                <span className="detail-field__key">Email</span>
                {client.email ? (
                  <a
                    href={`mailto:${client.email}`}
                    className="detail-field__value detail-field__link"
                  >
                    ✉️ {client.email}
                  </a>
                ) : (
                  <span className="detail-field__value detail-field__empty">Non renseigné</span>
                )}
              </div>

              {client.adresse && 
                <div className="detail-field" style={{gridColum: '1 / -1'}}>
                  <span className="detail-field__key">Adresse</span>
                  <span className="detail-field__value">
                    📍 {client.adresse}
                  </span>
                </div>
              }

            </div>
          </div>

          {/* NOTES */}
          {client.notes && (
            <div className="detail-section">
              <h3 className="detail-section__title">📝 Notes</h3>
              <div className="detail-notes">{client.notes}</div>
            </div>
          )}

          {/* VÉHICULES — placeholder pour plus tard */}
          <div className="detail-section">
            <h3 className="detail-section__title">
              🚗 Véhicules
              <span className="detail-section__badge">Bientôt</span>
            </h3>
            <div className="detail-placeholder">
              Les véhicules de ce client apparaîtront ici
            </div>
          </div>

          {/* HISTORIQUE RDV — placeholder pour plus tard */}
          <div className="detail-section">
            <h3 className="detail-section__title">
              📅 Historique RDV
              <span className="detail-section__badge">Bientôt</span>
            </h3>
            <div className="detail-placeholder">
              L'historique des rendez-vous apparaîtra ici
            </div>
          </div>

          {/* FACTURES — placeholder pour plus tard */}
          <div className="detail-section">
            <h3 className="detail-section__title">
              💰 Factures & Devis
              <span className="detail-section__badge">Bientôt</span>
            </h3>
            <div className="detail-placeholder">
              Les factures et devis apparaîtront ici
            </div>
          </div>

        </div>

        {/* ── FOOTER : BOUTONS ───────────────────────────────── */}
        <div className="client-detail__footer">
          <button
            className="detail-btn detail-btn--primary"
            onClick={() => onEdit(client)}
          >
            ✏️ Modifier
          </button>
          <button
            className="detail-btn detail-btn--danger"
            onClick={() => onDelete(client)}
          >
            🗑️ Supprimer
          </button>
        </div>

      </div>
    </div>
  );
};

export default ClientDetail;