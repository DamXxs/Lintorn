// /frontend/src/components/Devis/DevisDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchDevisById,
  validerDevis,
  refuserDevis,
  creerFactureDepuisDevis,
} from '@/pages/Factures/Devis/devisService';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import Modal from '@/components/shared/Modals/Modal';
import DevisDocument from './DevisDocument';
import './DevisDetail.css';

const DevisDetail = ({ devisId, onBack, onFactureCreee, onEdit }) => {
  const [devis, setDevis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModalFacture, setShowModalFacture] = useState(false);
  const [notesFacture, setNotesFacture] = useState('');
  const [showDocument, setShowDocument] = useState(false);

  const loadDevis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDevisById(devisId);
      setDevis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [devisId]);

  useEffect(() => {
    loadDevis();
  }, [loadDevis]);

  const handleValider = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir valider ce devis ?')) return;
    try {
      await validerDevis(devisId);
      loadDevis();
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleRefuser = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir refuser ce devis ?')) return;
    try {
      await refuserDevis(devisId);
      loadDevis();
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleCreerFacture = async () => {
    try {
      // Date d'échéance automatique : aujourd'hui + 30 jours
      const echeance = new Date();
      echeance.setDate(echeance.getDate() + 30);
      const dateEcheance = echeance.toISOString().split('T')[0];
      const facture = await creerFactureDepuisDevis(devisId, dateEcheance, notesFacture);
      setShowModalFacture(false);
      onFactureCreee(facture);
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant) => {
    if (!montant) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(parseFloat(montant));
  };

  const getStatutLabel = (statut) => {
    const labelMap = {
      CREE: 'Créé',
      VALIDE: 'Validé',
      REFUSE: 'Refusé',
      EXPIRE: 'Expiré',
      FACTURE: 'Facturé',
    };
    return labelMap[statut] || statut;
  };

  const getStatutBadgeClass = (statut) => {
    const classMap = {
      CREE: 'badge-cree',
      VALIDE: 'badge-valide',
      REFUSE: 'badge-refuse',
      EXPIRE: 'badge-expire',
      FACTURE: 'badge-facture',
    };
    return classMap[statut] || 'badge-default';
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!devis) return <ErrorState error="Devis non trouvé" />;

  return (
    <div className="devis-detail">
      <div className="devis-detail__header">
        <button className="devis-detail__btn-back" onClick={onBack}>
          ← Retour
        </button>
        <h1 className="devis-detail__title">{devis.numero}</h1>
        <span className={`devis-detail__badge ${getStatutBadgeClass(devis.statut)}`}>
          {getStatutLabel(devis.statut)}
        </span>
      </div>

      <div className="devis-detail__container">
        {/* Section Infos Client */}
        <div className="devis-detail__section">
          <h2 className="devis-detail__section-title">Informations client</h2>
          <div className="devis-detail__info-grid">
            <div className="devis-detail__info-item">
              <span className="devis-detail__info-label">Nom :</span>
              <span className="devis-detail__info-value">
                {devis.client_nom} {devis.client_prenom}
              </span>
            </div>
            <div className="devis-detail__info-item">
              <span className="devis-detail__info-label">Téléphone :</span>
              <span className="devis-detail__info-value">{devis.client_telephone}</span>
            </div>
            <div className="devis-detail__info-item">
              <span className="devis-detail__info-label">Email :</span>
              <span className="devis-detail__info-value">{devis.client_email}</span>
            </div>
            <div className="devis-detail__info-item">
              <span className="devis-detail__info-label">Adresse :</span>
              <span className="devis-detail__info-value">{devis.client_adresse}</span>
            </div>
          </div>
        </div>

        {/* Section Véhicule si présent */}
        {devis.vehicule_info && (
          <div className="devis-detail__section">
            <h2 className="devis-detail__section-title">Véhicule</h2>
            <div className="devis-detail__info-grid">
              <div className="devis-detail__info-item">
                <span className="devis-detail__info-label">Marque :</span>
                <span className="devis-detail__info-value">{devis.vehicule_info.marque}</span>
              </div>
              <div className="devis-detail__info-item">
                <span className="devis-detail__info-label">Modèle :</span>
                <span className="devis-detail__info-value">{devis.vehicule_info.modele}</span>
              </div>
              <div className="devis-detail__info-item">
                <span className="devis-detail__info-label">Immatriculation :</span>
                <span className="devis-detail__info-value">{devis.vehicule_info.immatriculation}</span>
              </div>
            </div>
          </div>
        )}

        {/* Section Intervention si présente */}
        {devis.intervention_description && (
          <div className="devis-detail__section">
            <h2 className="devis-detail__section-title">Intervention</h2>
            <div className="devis-detail__info-grid">
              <div className="devis-detail__info-item">
                <span className="devis-detail__info-label">Date :</span>
                <span className="devis-detail__info-value">
                  {formatDate(devis.intervention_date)}
                </span>
              </div>
              <div className="devis-detail__info-item">
                <span className="devis-detail__info-label">Description :</span>
                <span className="devis-detail__info-value">{devis.intervention_description}</span>
              </div>
            </div>
          </div>
        )}

        {/* Section Devis */}
        <div className="devis-detail__section">
          <h2 className="devis-detail__section-title">Devis</h2>
          <div className="devis-detail__info-grid">
            <div className="devis-detail__info-item">
              <span className="devis-detail__info-label">Date création :</span>
              <span className="devis-detail__info-value">{formatDate(devis.date_creation)}</span>
            </div>
            <div className="devis-detail__info-item">
              <span className="devis-detail__info-label">Date validité :</span>
              <span className="devis-detail__info-value">{formatDate(devis.date_validite)}</span>
            </div>
          </div>
          {devis.notes && (
            <div className="devis-detail__notes">
              <strong>Notes :</strong>
              <p>{devis.notes}</p>
            </div>
          )}
        </div>

        {/* Section Lignes */}
        <div className="devis-detail__section">
          <h2 className="devis-detail__section-title">Lignes</h2>
          {devis.lignes_devis && devis.lignes_devis.length > 0 ? (
            <table className="devis-detail__table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {devis.lignes_devis.map((ligne) => (
                  <tr key={ligne.id}>
                    <td>{ligne.description}</td>
                    <td className="devis-detail__cell-center">{ligne.quantite}</td>
                    <td className="devis-detail__cell-right">
                      {formatMontant(ligne.prix_unitaire)}
                    </td>
                    <td className="devis-detail__cell-right">
                      {formatMontant(ligne.sous_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="devis-detail__empty-text">Aucune ligne</p>
          )}
        </div>

        {/* Section Totaux */}
        <div className="devis-detail__totals">
          <div className="devis-detail__total-row">
            <span>Montant HT :</span>
            <strong>{formatMontant(devis.montant_ht)}</strong>
          </div>
          <div className="devis-detail__total-row">
            <span>TVA (20%) :</span>
            <strong>{formatMontant(devis.tva)}</strong>
          </div>
          <div className="devis-detail__total-row devis-detail__total-ttc">
            <span>Montant TTC :</span>
            <strong>{formatMontant(devis.montant_ttc)}</strong>
          </div>
        </div>

        {/* Actions */}
        <div className="devis-detail__actions">
          <button
            className="devis-detail__btn-action devis-detail__btn-pdf"
            onClick={() => setShowDocument(true)}
          >
            🖨️ Aperçu PDF
          </button>

          {devis.statut === 'CREE' && (
            <>
              {onEdit && (
                <button
                  className="devis-detail__btn-action devis-detail__btn-edit"
                  onClick={() => onEdit(devisId)}
                >
                  ✏️ Modifier
                </button>
              )}
              <button
                className="devis-detail__btn-action devis-detail__btn-valider"
                onClick={handleValider}
              >
                ✅ Valider
              </button>
              <button
                className="devis-detail__btn-action devis-detail__btn-refuser"
                onClick={handleRefuser}
              >
                ❌ Refuser
              </button>
            </>
          )}

          {devis.statut === 'VALIDE' && (
            <>
              <button
                className="devis-detail__btn-action devis-detail__btn-facture"
                onClick={() => setShowModalFacture(true)}
              >
                📄 Créer facture
              </button>
              <button
                className="devis-detail__btn-action devis-detail__btn-refuser"
                onClick={handleRefuser}
              >
                ❌ Refuser
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal Créer Facture */}
      {showModalFacture && (
        <Modal
          title="Créer une facture"
          onClose={() => setShowModalFacture(false)}
          footer={
            <div className="devis-detail__modal-footer">
              <button
                className="devis-detail__btn-cancel"
                onClick={() => setShowModalFacture(false)}
              >
                Annuler
              </button>
              <button
                className="devis-detail__btn-confirm"
                onClick={handleCreerFacture}
              >
                Créer
              </button>
            </div>
          }
        >
          <div className="devis-detail__modal-form">
            <p className="devis-detail__modal-info">
              La facture sera créée à partir du devis <strong>{devis.numero}</strong>.
              L'échéance de paiement sera fixée à 30 jours.
            </p>
            <div className="devis-detail__form-group">
              <label className="devis-detail__form-label">Notes (optionnel)</label>
              <textarea
                value={notesFacture}
                onChange={(e) => setNotesFacture(e.target.value)}
                className="devis-detail__form-textarea"
                rows="3"
                placeholder="Notes pour la facture..."
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Affichage du document PDF */}
      {showDocument && (
        <div className="devis-detail__document-modal">
          <div className="devis-detail__document-container">
            <button
              className="devis-detail__document-close"
              onClick={() => setShowDocument(false)}
            >
              ✕
            </button>
            <DevisDocument devis={devis} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DevisDetail;
