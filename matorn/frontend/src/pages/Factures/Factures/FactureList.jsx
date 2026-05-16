// /frontend/src/pages/Factures/Factures/FactureList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchFactures } from './factureService';
import PageHeader from '../../../components/shared/PageHeader';
import SearchBar from '../../../components/shared/SearchBar/SearchBar';
import LoadingState from '../../../components/shared/LoadingState';
import ErrorState from '../../../components/shared/ErrorState';
import './FactureList.css';

// ── Constantes statut ────────────────────────────────────────
const STATUTS = [
  { value: 'EMISE',               label: 'Émise',               color: '#3498db' },
  { value: 'PAYEE',               label: 'Payée',               color: '#27ae60' },
  { value: 'PARTIELLEMENT_PAYEE', label: 'Partiellement payée', color: '#f39c12' },
  { value: 'IMPAYEE',             label: 'Impayée',             color: '#e74c3c' },
];

const getBadgeClass = (statut) => {
  const map = {
    EMISE:               'facture-list__badge--emise',
    PAYEE:               'facture-list__badge--payee',
    IMPAYEE:             'facture-list__badge--impayee',
    PARTIELLEMENT_PAYEE: 'facture-list__badge--partiellement-payee',
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
  if (!montant && montant !== 0) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(parseFloat(montant));
};

// ── Composant ────────────────────────────────────────────────
const FactureList = ({ onSelectFacture, onCreateFacture }) => {
  const [factures,     setFactures]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [filtreStatut, setFiltreStatut] = useState('ALL');
  const [menuOpenId,   setMenuOpenId]   = useState(null);

  const loadFactures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFactures();
      setFactures(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFactures(); }, [loadFactures]);

  useEffect(() => {
    const close = () => setMenuOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // ── Filtrage local ────────────────────────────────────────
  const filtered = factures
    .filter(f => filtreStatut === 'ALL' || f.statut === filtreStatut)
    .filter(f => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        f.numero?.toLowerCase().includes(q)      ||
        f.client_nom?.toLowerCase().includes(q)  ||
        f.client_prenom?.toLowerCase().includes(q)
      );
    });

  if (loading) return <LoadingState message="Chargement des factures..." />;
  if (error)   return <ErrorState message={error} onRetry={loadFactures} />;

  const filtresBtns = [
    { value: 'ALL', label: 'Toutes' },
    ...STATUTS,
  ];

  return (
    <div className="facture-list">

      <PageHeader
        title="Factures"
        count={filtered.length}
        countLabel="factures"
        onAdd={onCreateFacture}
        addLabel="Nouvelle facture"
      />

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Rechercher par numéro, client..."
      />

      {/* FILTRES STATUT */}
      <div className="facture-list__filters">
        {filtresBtns.map(f => (
          <button
            key={f.value}
            className={`facture-list__filter-btn ${filtreStatut === f.value ? 'facture-list__filter-btn--active' : ''}`}
            style={filtreStatut === f.value && f.value !== 'ALL'
              ? { background: f.color, borderColor: f.color }
              : {}
            }
            onClick={() => setFiltreStatut(f.value)}
          >
            {f.label}
            <span className="facture-list__filter-btn__count">
              {f.value === 'ALL'
                ? factures.length
                : factures.filter(fa => fa.statut === f.value).length
              }
            </span>
          </button>
        ))}
      </div>

      {/* TABLEAU */}
      {filtered.length === 0 ? (
        <div className="facture-list__empty">
          <p>Aucune facture trouvée</p>
          {(searchQuery || filtreStatut !== 'ALL') && (
            <button onClick={() => { setSearchQuery(''); setFiltreStatut('ALL'); }}>
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="facture-list__table-wrap">
          <table className="facture-list__table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Émise le</th>
                <th>Échéance</th>
                <th style={{ textAlign: 'right' }}>Montant TTC</th>
                <th style={{ textAlign: 'right' }}>Payé</th>
                <th style={{ textAlign: 'right' }}>Solde</th>
                <th style={{ textAlign: 'center' }}>Statut</th>
                <th style={{ textAlign: 'center', width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => {
                const soldeNul = parseFloat(f.solde_restant || 0) === 0;
                return (
                  <tr key={f.id} onClick={() => onSelectFacture(f)}>
                    <td className="facture-list__cell--numero">{f.numero}</td>
                    <td className="facture-list__cell--client">
                      {f.client_prenom} {f.client_nom}
                    </td>
                    <td className="facture-list__cell--date">
                      {formatDate(f.date_emission)}
                    </td>
                    <td className="facture-list__cell--date">
                      {formatDate(f.date_echeance)}
                    </td>
                    <td className="facture-list__cell--montant">
                      {formatMontant(f.montant_ttc)}
                    </td>
                    <td className="facture-list__cell--paye">
                      {formatMontant(f.montant_paye)}
                    </td>
                    <td className={`facture-list__cell--solde ${soldeNul ? 'facture-list__cell--solde-ok' : ''}`}>
                      {formatMontant(f.solde_restant)}
                    </td>
                    <td className="facture-list__cell--statut">
                      <span className={`facture-list__badge ${getBadgeClass(f.statut)}`}>
                        {getStatutLabel(f.statut)}
                      </span>
                    </td>
                    <td
                      className="facture-list__cell--actions"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="fv-action-wrap">
                        <button
                          className="fv-action-trigger"
                          onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === f.id ? null : f.id); }}
                          title="Actions"
                        >⋯</button>
                        {menuOpenId === f.id && (
                          <div className="fv-action-menu">
                            <button
                              className="fv-action-item"
                              onClick={() => { setMenuOpenId(null); onSelectFacture(f); }}
                            >
                              👁️ Ouvrir
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default FactureList;