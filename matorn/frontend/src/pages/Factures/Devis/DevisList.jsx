// /frontend/src/pages/Factures/Devis/DevisList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchDevis, validerDevis, refuserDevis } from './devisService';
import PageHeader from '../../../components/shared/PageHeader';
import SearchBar from '../../../components/shared/SearchBar/SearchBar';
import LoadingState from '../../../components/shared/LoadingState';
import ErrorState from '../../../components/shared/ErrorState';
import { getApiError } from '../../../utils/apiError';
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
  const [menuOpenId,   setMenuOpenId]   = useState(null);

  const loadDevis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDevis();
      setDevis(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiError(err, 'Impossible de charger les devis'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDevis(); }, [loadDevis]);

  // Fermer le menu au clic hors du tableau
  useEffect(() => {
    const close = () => setMenuOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

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
      alert(`Erreur : ${getApiError(err, 'Erreur lors de la validation')}`);
    }
  };

  const handleRefuser = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Refuser ce devis ?')) return;
    try {
      await refuserDevis(id);
      loadDevis();
    } catch (err) {
      alert(`Erreur : ${getApiError(err, 'Erreur lors du refus')}`);
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
        onAdd={onCreateDevis}
        addLabel="Nouveau devis"
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
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="dv-action-wrap">
                      <button
                        className="dv-action-trigger"
                        onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === d.id ? null : d.id); }}
                        title="Actions"
                      >⋯</button>
                      {menuOpenId === d.id && (
                        <div className="dv-action-menu">
                          {onViewPDF && (
                            <button className="dv-action-item" onClick={() => { setMenuOpenId(null); onViewPDF(d.id); }}>
                              📄 Aperçu PDF
                            </button>
                          )}
                          {d.statut === 'CREE' && onEditDevis && (
                            <button className="dv-action-item" onClick={() => { setMenuOpenId(null); onEditDevis(d.id); }}>
                              ✏️ Modifier
                            </button>
                          )}
                          {d.statut === 'CREE' && (
                            <button className="dv-action-item" onClick={e => { setMenuOpenId(null); handleValider(e, d.id); }}>
                              ✅ Valider
                            </button>
                          )}
                          {(d.statut === 'CREE' || d.statut === 'VALIDE') && (
                            <button className="dv-action-item dv-action-item--danger" onClick={e => { setMenuOpenId(null); handleRefuser(e, d.id); }}>
                              ❌ Refuser
                            </button>
                          )}
                        </div>
                      )}
                    </div>
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