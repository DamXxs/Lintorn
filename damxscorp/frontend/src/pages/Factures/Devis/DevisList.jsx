// /frontend/src/pages/Factures/Devis/DevisList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchDevis, validerDevis, refuserDevis } from './devisService';
import PageHeader from '../../../components/shared/PageHeader';
import SearchBar from '../../../components/shared/SearchBar/SearchBar';
import LoadingState from '../../../components/shared/LoadingState';
import ErrorState from '../../../components/shared/ErrorState';
import './DevisList.css';

// ── Constantes statut ────────────────────────────────────────
const STATUTS = [
  { value: 'CREE',    label: 'Créé',      color: '#3498db' },
  { value: 'VALIDE',  label: 'Validé',    color: '#27ae60' },
  { value: 'REFUSE',  label: 'Refusé',    color: '#e74c3c' },
  { value: 'EXPIRE',  label: 'Expiré',    color: '#95a5a6' },
  { value: 'FACTURE', label: 'Facturé',   color: '#9b59b6' },
];

const getBadgeClass = (statut) => {
  const map = {
    CREE: 'devis-list__badge--cree',
    VALIDE: 'devis-list__badge--valide',
    REFUSE: 'devis-list__badge--refuse',
    EXPIRE: 'devis-list__badge--expire',
    FACTURE: 'devis-list__badge--facture',
  };
  return map[statut] || '';
};

const getStatutLabel = (statut) => {
  return STATUTS.find(s => s.value === statut)?.label || statut;
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('fr-FR');
};

const formatMontant = (montant) => {
  if (!montant) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(parseFloat(montant));
};

// ── Composant ────────────────────────────────────────────────
const DevisList = ({ onSelectDevis, onCreateDevis, onEditDevis, onViewPDF }) => {
  const [devis,        setDevis]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [filtreStatut, setFiltreStatut] = useState('ALL');

  const loadDevis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDevis();
      setDevis(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDevis(); }, [loadDevis]);

  // ── Filtrage local (statut + recherche texte) ─────────────
  const filtered = devis
    .filter(d => filtreStatut === 'ALL' || d.statut === filtreStatut)
    .filter(d => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.numero?.toLowerCase().includes(q)      ||
        d.client_nom?.toLowerCase().includes(q)  ||
        d.client_prenom?.toLowerCase().includes(q)
      );
    });

  // ── Actions rapides ───────────────────────────────────────
  const handleValider = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Valider ce devis ?')) return;
    try {
      await validerDevis(id);
      loadDevis();
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleRefuser = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Refuser ce devis ?')) return;
    try {
      await refuserDevis(id);
      loadDevis();
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
  };

  if (loading) return <LoadingState message="Chargement des devis..." />;
  if (error)   return <ErrorState message={error} onRetry={loadDevis} />;

  const filtresBtns = [
    { value: 'ALL', label: 'Tous' },
    ...STATUTS,
  ];

  return (
    <div className="devis-list">

      <PageHeader
        title="Devis"
        count={filtered.length}
        countLabel="devis"
        action={
          <button className="page-header__btn" onClick={onCreateDevis}>
            + Nouveau devis
          </button>
        }
      />

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Rechercher par numéro, client..."
      />

      {/* FILTRES STATUT */}
      <div className="devis-list__filters">
        {filtresBtns.map(f => (
          <button
            key={f.value}
            className={`devis-list__filter-btn ${filtreStatut === f.value ? 'devis-list__filter-btn--active' : ''}`}
            style={filtreStatut === f.value && f.value !== 'ALL'
              ? { background: f.color, borderColor: f.color }
              : {}
            }
            onClick={() => setFiltreStatut(f.value)}
          >
            {f.label}
            <span className="devis-list__filter-btn__count">
              {f.value === 'ALL'
                ? devis.length
                : devis.filter(d => d.statut === f.value).length
              }
            </span>
          </button>
        ))}
      </div>

      {/* TABLEAU */}
      {filtered.length === 0 ? (
        <div className="devis-list__empty">
          <p>Aucun devis trouvé</p>
          {(searchQuery || filtreStatut !== 'ALL') && (
            <button onClick={() => { setSearchQuery(''); setFiltreStatut('ALL'); }}>
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="devis-list__table-wrap">
          <table className="devis-list__table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Créé le</th>
                <th>Validité</th>
                <th style={{ textAlign: 'right' }}>Montant TTC</th>
                <th style={{ textAlign: 'center' }}>Statut</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} onClick={() => onSelectDevis(d)}>
                  <td className="devis-list__cell--numero">{d.numero}</td>
                  <td className="devis-list__cell--client">
                    {d.client_nom} {d.client_prenom}
                  </td>
                  <td className="devis-list__cell--date">{formatDate(d.date_creation)}</td>
                  <td className="devis-list__cell--date devis-list__cell--date-validite">
                    {formatDate(d.date_validite)}
                  </td>
                  <td className="devis-list__cell--montant">
                    {formatMontant(d.montant_ttc)}
                  </td>
                  <td className="devis-list__cell--statut">
                    <span className={`devis-list__badge ${getBadgeClass(d.statut)}`}>
                      {getStatutLabel(d.statut)}
                    </span>
                  </td>
                  <td
                    className="devis-list__cell--actions"
                    onClick={e => e.stopPropagation()} /* empêche l'ouverture du détail */
                  >
                    {/* Aperçu PDF — toujours dispo */}
                    {onViewPDF && (
                      <button
                        className="devis-list__btn-action"
                        onClick={() => onViewPDF(d.id)}
                        title="Aperçu PDF"
                      >
                        PDF
                      </button>
                    )}

                    {/* Modifier — uniquement si CREE */}
                    {d.statut === 'CREE' && onEditDevis && (
                      <button
                        className="devis-list__btn-action"
                        onClick={() => onEditDevis(d.id)}
                        title="Modifier"
                      >
                        Modifier
                      </button>
                    )}

                    {/* Valider / Refuser — si CREE */}
                    {d.statut === 'CREE' && (
                      <>
                        <button
                          className="devis-list__btn-action"
                          onClick={e => handleValider(e, d.id)}
                          title="Valider"
                        >
                          Valider
                        </button>
                        <button
                          className="devis-list__btn-action devis-list__btn-action--danger"
                          onClick={e => handleRefuser(e, d.id)}
                          title="Refuser"
                        >
                          Refuser
                        </button>
                      </>
                    )}

                    {/* Refuser — si VALIDE */}
                    {d.statut === 'VALIDE' && (
                      <button
                        className="devis-list__btn-action devis-list__btn-action--danger"
                        onClick={e => handleRefuser(e, d.id)}
                        title="Refuser"
                      >
                        Refuser
                      </button>
                    )}
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

export default DevisList;