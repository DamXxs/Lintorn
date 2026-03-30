// /frontend/src/components/Devis/DevisList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchDevis, validerDevis, refuserDevis } from '../../services/devisService';
import LoadingState from '../shared/LoadingState';
import ErrorState from '../shared/ErrorState';
import './DevisList.css';

const DevisList = ({ onSelectDevis, onCreateDevis, onEditDevis }) => {
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState('');

  const loadDevis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filtres = filtreStatut ? { statut: filtreStatut } : {};
      const data = await fetchDevis(filtres);
      setDevis(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtreStatut]);

  useEffect(() => {
    loadDevis();
  }, [loadDevis]);

  const handleValider = async (devisId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir valider ce devis ?')) return;
    try {
      await validerDevis(devisId);
      loadDevis();
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleRefuser = async (devisId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir refuser ce devis ?')) return;
    try {
      await refuserDevis(devisId);
      loadDevis();
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant) => {
    if (!montant) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(montant));
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="devis-list">
      <div className="devis-list__header">
        <h1 className="devis-list__title">Devis</h1>
        <button className="devis-list__btn-new" onClick={onCreateDevis}>
          + Nouveau devis
        </button>
      </div>

      <div className="devis-list__filters">
        <select
          className="devis-list__select-filtre"
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="CREE">Créé</option>
          <option value="VALIDE">Validé</option>
          <option value="REFUSE">Refusé</option>
          <option value="EXPIRE">Expiré</option>
          <option value="FACTURE">Facturé</option>
        </select>
        <button className="devis-list__btn-refresh" onClick={loadDevis}>
          ↻ Actualiser
        </button>
      </div>

      {devis.length === 0 ? (
        <div className="devis-list__empty">
          <p>Aucun devis trouvé</p>
        </div>
      ) : (
        <table className="devis-list__table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Client</th>
              <th>Date création</th>
              <th>Date validité</th>
              <th>Montant TTC</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {devis.map((d) => (
              <tr
                key={d.id}
                className="devis-list__row devis-list__row--clickable"
                onClick={() => onSelectDevis(d)}
                title="Cliquer pour voir le détail"
              >
                <td className="devis-list__cell-numero">{d.numero}</td>
                <td className="devis-list__cell-client">
                  {d.client_nom} {d.client_prenom}
                </td>
                <td className="devis-list__cell-date">{formatDate(d.date_creation)}</td>
                <td className="devis-list__cell-date">{formatDate(d.date_validite)}</td>
                <td className="devis-list__cell-montant">{formatMontant(d.montant_ttc)}</td>
                <td className="devis-list__cell-statut">
                  <span className={`devis-list__badge ${getStatutBadgeClass(d.statut)}`}>
                    {getStatutLabel(d.statut)}
                  </span>
                </td>
                <td className="devis-list__cell-actions" onClick={(e) => e.stopPropagation()}>
                  {d.statut === 'CREE' && onEditDevis && (
                    <button
                      className="devis-list__btn-action devis-list__btn-edit"
                      onClick={() => onEditDevis(d.id)}
                      title="Modifier le devis"
                    >
                      ✏️
                    </button>
                  )}
                  {d.statut === 'CREE' && (
                    <>
                      <button
                        className="devis-list__btn-action devis-list__btn-valider"
                        onClick={() => handleValider(d.id)}
                        title="Valider le devis"
                      >
                        ✅
                      </button>
                      <button
                        className="devis-list__btn-action devis-list__btn-refuser"
                        onClick={() => handleRefuser(d.id)}
                        title="Refuser le devis"
                      >
                        ❌
                      </button>
                    </>
                  )}
                  {d.statut === 'VALIDE' && (
                    <button
                      className="devis-list__btn-action devis-list__btn-refuser"
                      onClick={() => handleRefuser(d.id)}
                      title="Refuser le devis"
                    >
                      ❌
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DevisList;
