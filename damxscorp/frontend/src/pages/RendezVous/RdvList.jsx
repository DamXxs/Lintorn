// /frontend/src/pages/RendezVous/RdvList.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getAllRdvs,
  searchRdvs,
  patchRdv,
  removeRdv,
  STATUTS_RDV,
} from './rdvService';
import { formatDateCourt, formatHeure } from '../../utils/dataFormatters';
import StatutBadge from '../../components/shared/StatutBadge';
import FrenchPlateInput from '../../components/shared/Frenchplate/FrenchPlateInput';
import ModalRdvConsultation from '../../components/shared/Modals/ModalRdvConsultation';
import PageHeader from '../../components/shared/PageHeader';
import SearchBar from '../../components/shared/SearchBar/SearchBar';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { CalendarClock, User, FileText } from '../../utils/icons';
import './RdvList.css';

// Couleurs des filtres (cohérent avec StatutBadge)
const FILTRE_COLORS = {
  PLANIFIE: '#2980b9',
  EN_COURS: '#e67e22',
  TERMINE:  '#27ae60',
  ANNULE:   '#7f8c8d',
};

const RdvList = () => {
  const location = useLocation();

  const [rdvs, setRdvs]               = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatut, setActiveStatut] = useState('ALL');
  const [consultRdv, setConsultRdv]   = useState(null);

  // ── Chargement ──────────────────────────────────────────────
  const loadRdvs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllRdvs();
      const sorted = [...data].sort(
        (a, b) => new Date(b.date_debut) - new Date(a.date_debut)
      );
      setRdvs(sorted);
      setFiltered(sorted);
    } catch {
      setError('Impossible de charger les rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRdvs(); }, []);

  // ── Ouvre automatiquement un RDV depuis la recherche globale ─
  useEffect(() => {
    const openRdvId = location.state?.openRdvId;
    if (openRdvId && rdvs.length > 0) {
      const rdv = rdvs.find(r => r.id === openRdvId);
      if (rdv) setConsultRdv(rdv);
      window.history.replaceState({}, '');
    }
  }, [location.state, rdvs]);

  // ── Filtrage (statut + recherche texte) ──────────────────────
  useEffect(() => {
    let result = rdvs;
    if (activeStatut !== 'ALL') {
      result = result.filter(r => r.statut === activeStatut);
    }
    setFiltered(searchRdvs(result, searchQuery));
  }, [searchQuery, activeStatut, rdvs]);

  // ── Changement de statut ─────────────────────────────────────
  const handleStatusChange = async (id, newStatut) => {
    try {
      await patchRdv(id, { statut: newStatut });
      setRdvs(prev => prev.map(r => r.id === id ? { ...r, statut: newStatut } : r));
      setConsultRdv(prev => ({ ...prev, statut: newStatut }));
    } catch (err) {
      alert('Erreur lors du changement de statut');
      throw err;
    }
  };

  // ── Suppression ──────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await removeRdv(id);
      setConsultRdv(null);
      await loadRdvs();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) return <LoadingState message="Chargement des rendez-vous..." />;
  if (error)   return <ErrorState message={error} onRetry={loadRdvs} />;

  // Filtres statut construits dynamiquement depuis STATUTS_RDV
  const filtresStatut = [
    { value: 'ALL', label: 'Tous' },
    ...Object.values(STATUTS_RDV).map(s => ({ value: s.value, label: s.label })),
  ];

  return (
    <div className="rdv-page">

      <PageHeader
        title={<><CalendarClock size={18} /> Rendez-vous</>}
        count={filtered.length}
        countLabel="rendez-vous"
      />

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Rechercher par client, description, type, immatriculation..."
      />

      {/* FILTRES STATUT */}
      <div className="rdv-filters">
        {filtresStatut.map(f => (
          <button
            key={f.value}
            className={`rdv-filter-btn ${activeStatut === f.value ? 'rdv-filter-btn--active' : ''}`}
            style={activeStatut === f.value && f.value !== 'ALL'
              ? { background: FILTRE_COLORS[f.value], borderColor: FILTRE_COLORS[f.value] }
              : {}
            }
            onClick={() => setActiveStatut(f.value)}
          >
            {f.label}
            <span className="rdv-filter-btn__count">
              {f.value === 'ALL'
                ? rdvs.length
                : rdvs.filter(r => r.statut === f.value).length
              }
            </span>
          </button>
        ))}
      </div>

      {/* LISTE */}
      {filtered.length === 0 ? (
        <div className="rdv-empty">
          <CalendarClock size={32} />
          <p>Aucun rendez-vous{activeStatut !== 'ALL' ? ' pour ce statut' : ''}</p>
          {(searchQuery || activeStatut !== 'ALL') && (
            <button onClick={() => { setSearchQuery(''); setActiveStatut('ALL'); }}>
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="rdv-list">
          {filtered.map(rdv => (
            <div key={rdv.id} className="rdv-row" onClick={() => setConsultRdv(rdv)}>
              <div className="rdv-row__date">
                <span className="rdv-row__date-day">{formatDateCourt(rdv.date_debut)}</span>
                <span className="rdv-row__date-hour">{formatHeure(rdv.date_debut)}</span>
              </div>
              <div className="rdv-row__statut">
                <StatutBadge statut={rdv.statut} />
              </div>
              <div className="rdv-row__info">
                <span className="rdv-row__type">
                  <CalendarClock size={11} /> {rdv.type_rdv}
                  {rdv.type_intervention && ` — ${rdv.type_intervention}`}
                </span>
                {rdv.description && (
                  <span className="rdv-row__desc">
                    <FileText size={11} />
                    {rdv.description.slice(0, 50)}{rdv.description.length > 50 ? '…' : ''}
                  </span>
                )}
              </div>
              {rdv.client_nom && (
                <div className="rdv-row__client">
                  <User size={11} />
                  {rdv.client_nom} {rdv.client_prenom || ''}
                </div>
              )}
              {rdv.vehicule_immatriculation && (
                <div className="rdv-row__plate">
                  <FrenchPlateInput value={rdv.vehicule_immatriculation} size="sm" readOnly />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {consultRdv && (
        <ModalRdvConsultation
          event={consultRdv}
          onClose={() => setConsultRdv(null)}
          onEdit={() => setConsultRdv(null)}
          onDelete={(id) => handleDelete(id)}
          onStatusChange={handleStatusChange}
        />
      )}

    </div>
  );
};

export default RdvList;