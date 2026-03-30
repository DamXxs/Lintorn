// /frontend/src/components/Factures/FactureDetail.jsx
import React, { useState, useEffect } from 'react';
import { fetchFactureById, enregistrerPaiement } from '../../services/factureService';
import LoadingState from '../shared/LoadingState';
import ErrorState from '../shared/ErrorState';
import './FactureDetail.css';

const FactureDetail = ({ factureId, onBack }) => {
  const [facture, setFacture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paiementForm, setPaiementForm] = useState('');
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

  useEffect(() => {
    const loadFacture = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFactureById(factureId);
        setFacture(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadFacture();
  }, [factureId]);

  const handleEnregistrerPaiement = async (e) => {
    e.preventDefault();

    const montant = parseFloat(paiementForm);
    if (isNaN(montant) || montant <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }

    if (montant > facture.solde_restant) {
      alert(
        `Le montant ne peut pas dépasser le solde restant (${formatMontant(
          facture.solde_restant
        )})`
      );
      return;
    }

    setEnregistrementEnCours(true);
    try {
      const factureMaj = await enregistrerPaiement(factureId, montant);
      setFacture(factureMaj);
      setPaiementForm('');
      alert('Paiement enregistré avec succès');
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setEnregistrementEnCours(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant) => {
    if (!montant && montant !== 0) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(parseFloat(montant));
  };

  const getStatutBadgeClass = (statut) => {
    const classMap = {
      EMISE: 'badge-emise',
      PAYEE: 'badge-payee',
      IMPAYEE: 'badge-impayee',
      PARTIELLEMENT_PAYEE: 'badge-partiellement-payee',
    };
    return classMap[statut] || 'badge-default';
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!facture) return <ErrorState error="Facture introuvable" />;

  const isPaiee = facture.statut === 'PAYEE';

  return (
    <div className="facture-detail">
      <div className="facture-detail__header">
        <button className="facture-detail__btn-back" onClick={onBack}>
          ← Retour
        </button>
        <h1 className="facture-detail__title">{facture.numero}</h1>
        <span className={`badge ${getStatutBadgeClass(facture.statut)}`}>
          {facture.statut_display}
        </span>
      </div>

      {/* Infos générales */}
      <div className="facture-detail__section">
        <h2>Informations</h2>
        <div className="facture-detail__grid">
          <div className="facture-detail__item">
            <label>Date d'émission</label>
            <p>{formatDate(facture.date_emission)}</p>
          </div>
          <div className="facture-detail__item">
            <label>Date d'échéance</label>
            <p>{formatDate(facture.date_echeance)}</p>
          </div>
          <div className="facture-detail__item">
            <label>Origine</label>
            <p>
              {facture.devis_numero && (
                <>
                  Devis : <strong>{facture.devis_numero}</strong>
                </>
              )}
              {facture.intervention && (
                <>
                  Intervention : <strong>#{facture.intervention}</strong>
                </>
              )}
              {!facture.devis_numero && !facture.intervention && 'Directe'}
            </p>
          </div>
        </div>
      </div>

      {/* Infos client */}
      <div className="facture-detail__section">
        <h2>Client</h2>
        <div className="facture-detail__client-info">
          <div className="facture-detail__item">
            <label>Nom</label>
            <p>
              {facture.client_prenom} {facture.client_nom}
            </p>
          </div>
          <div className="facture-detail__item">
            <label>Téléphone</label>
            <p>{facture.client_telephone || '-'}</p>
          </div>
          <div className="facture-detail__item">
            <label>Email</label>
            <p>{facture.client_email || '-'}</p>
          </div>
          <div className="facture-detail__item">
            <label>Adresse</label>
            <p>{facture.client_adresse || '-'}</p>
          </div>
        </div>
      </div>

      {/* Infos véhicule */}
      {facture.vehicule_info && (
        <div className="facture-detail__section">
          <h2>Véhicule</h2>
          <div className="facture-detail__grid">
            <div className="facture-detail__item">
              <label>Marque</label>
              <p>{facture.vehicule_info.marque}</p>
            </div>
            <div className="facture-detail__item">
              <label>Modèle</label>
              <p>{facture.vehicule_info.modele}</p>
            </div>
            <div className="facture-detail__item">
              <label>Immatriculation</label>
              <p>{facture.vehicule_info.immatriculation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lignes */}
      {facture.lignes_facture && facture.lignes_facture.length > 0 && (
        <div className="facture-detail__section">
          <h2>Lignes</h2>
          <table className="facture-detail__table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {facture.lignes_facture.map((ligne) => (
                <tr key={ligne.id}>
                  <td>{ligne.description}</td>
                  <td className="facture-detail__cell-number">
                    {ligne.quantite}
                  </td>
                  <td className="facture-detail__cell-number">
                    {formatMontant(ligne.prix_unitaire)}
                  </td>
                  <td className="facture-detail__cell-number">
                    {formatMontant(ligne.montant)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totaux */}
      <div className="facture-detail__section">
        <h2>Totaux</h2>
        <div className="facture-detail__totaux">
          <div className="facture-detail__total-row">
            <span>Montant HT</span>
            <strong>{formatMontant(facture.montant_ht)}</strong>
          </div>
          <div className="facture-detail__total-row">
            <span>TVA</span>
            <strong>{formatMontant(facture.tva)}</strong>
          </div>
          <div className="facture-detail__total-row facture-detail__total-ttc">
            <span>Montant TTC</span>
            <strong>{formatMontant(facture.montant_ttc)}</strong>
          </div>
        </div>
      </div>

      {/* Paiement */}
      <div className="facture-detail__section">
        <h2>Paiement</h2>
        <div className="facture-detail__paiement">
          <div className="facture-detail__paiement-info">
            <div className="facture-detail__item">
              <label>Montant payé</label>
              <p className="facture-detail__paiement-montant">
                {formatMontant(facture.montant_paye)}
              </p>
            </div>
            <div className="facture-detail__item">
              <label>Solde restant</label>
              <p className="facture-detail__solde">
                {formatMontant(facture.solde_restant)}
              </p>
            </div>
          </div>

          {!isPaiee && (
            <form
              onSubmit={handleEnregistrerPaiement}
              className="facture-detail__paiement-form"
            >
              <h3>Enregistrer un paiement</h3>
              <div className="facture-detail__paiement-groupe">
                <label htmlFor="montant-paiement">Montant (€)</label>
                <input
                  type="number"
                  id="montant-paiement"
                  value={paiementForm}
                  onChange={(e) => setPaiementForm(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <button
                type="submit"
                className="facture-detail__btn-enregistrer"
                disabled={enregistrementEnCours}
              >
                {enregistrementEnCours ? 'Enregistrement...' : 'Enregistrer paiement'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Notes */}
      {facture.notes && (
        <div className="facture-detail__section">
          <h2>Notes</h2>
          <p className="facture-detail__notes">{facture.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="facture-detail__actions">
        <button className="facture-detail__btn-pdf" title="Aperçu PDF">
          🖨️ Aperçu PDF
        </button>
      </div>
    </div>
  );
};

export default FactureDetail;
