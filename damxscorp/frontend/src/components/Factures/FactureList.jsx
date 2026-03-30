// /frontend/src/components/Factures/FactureList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchFactures } from '../../services/factureService';
import LoadingState from '../shared/LoadingState';
import ErrorState from '../shared/ErrorState';
import './FactureList.css';

const FactureList = ({ onSelectFacture, onCreateFacture }) => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState('');

  const loadFactures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filtres = filtreStatut ? { statut: filtreStatut } : {};
      const data = await fetchFactures(filtres);
      setFactures(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtreStatut]);

  useEffect(() => {
    loadFactures();
  }, [loadFactures]);

  const getStatutBadgeClass = (statut) => {
    const classMap = {
      EMISE: 'badge-emise',
      PAYEE: 'badge-payee',
      IMPAYEE: 'badge-impayee',
      PARTIELLEMENT_PAYEE: 'badge-partiellement-payee',
    };
    return classMap[statut] || 'badge-default';
  };

  const getStatutLabel = (statutDisplay) => {
    return statutDisplay || 'Inconnu';
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

  const getClientDisplayName = (facture) => {
    const nom = facture.client_nom || 'Client';
    const prenom = facture.client_prenom ? `${facture.client_prenom} ` : '';
    return `${prenom}${nom}`;
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="facture-list">
      <div className="facture-list__header">
        <h1 className="facture-list__title">Factures</h1>
        <button className="facture-list__btn-new" onClick={onCreateFacture}>
          + Nouvelle facture
        </button>
      </div>

      <div className="facture-list__filters">
        <select
          className="facture-list__filter-select"
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="EMISE">Émise</option>
          <option value="PAYEE">Payée</option>
          <option value="PARTIELLEMENT_PAYEE">Partiellement payée</option>
          <option value="IMPAYEE">Impayée</option>
        </select>
      </div>

      {factures.length === 0 ? (
        <div className="facture-list__empty">
          <p>Aucune facture à afficher</p>
        </div>
      ) : (
        <div className="facture-list__table-container">
          <table className="facture-list__table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Date émission</th>
                <th>Échéance</th>
                <th>Montant TTC</th>
                <th>Payé</th>
                <th>Solde</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {factures.map((facture) => (
                <tr key={facture.id} className="facture-list__row">
                  <td className="facture-list__numero">{facture.numero}</td>
                  <td className="facture-list__client">
                    {getClientDisplayName(facture)}
                  </td>
                  <td className="facture-list__date">
                    {formatDate(facture.date_emission)}
                  </td>
                  <td className="facture-list__date">
                    {formatDate(facture.date_echeance)}
                  </td>
                  <td className="facture-list__montant">
                    {formatMontant(facture.montant_ttc)}
                  </td>
                  <td className="facture-list__paye">
                    {formatMontant(facture.montant_paye)}
                  </td>
                  <td className="facture-list__solde">
                    {formatMontant(facture.solde_restant)}
                  </td>
                  <td className="facture-list__statut">
                    <span className={`badge ${getStatutBadgeClass(facture.statut)}`}>
                      {getStatutLabel(facture.statut_display)}
                    </span>
                  </td>
                  <td className="facture-list__actions">
                    <button
                      className="facture-list__btn-view"
                      onClick={() => onSelectFacture(facture)}
                      title="Voir la facture"
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FactureList;
