// /frontend/src/pages/OrdresReparation/OrdresReparation.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Service API
import { fetchOrdres, updateOrdre, deleteOrdre, OrdreReparationListItem, OrdreReparationDetail, STATUTS_OR } from './orService';

// Composants partagés
import PageHeader from '../../components/shared/PageHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import SearchBar from '../../components/shared/SearchBar/SearchBar';
import ModalOrCreation from './ModalOrCreation';
import { getApiError } from '../../utils/apiError';

// Icônes
import { Wrench, User, Car } from '../../utils/icons';

// Helpers
import { formatDateCourt } from '../../utils/dataFormatters';

// Styles
import '../../components/shared/list-page.css';
import './OrdresReparation.css';

// =============================================================================
// CONSTANTES
// =============================================================================

// Type union pour les filtres de statut
// 'ALL' = pseudo-statut pour "tous afficher"
type StatutFiltre = 'ALL' | 'OUVERT' | 'EN_COURS' | 'CLOTURE' | 'ANNULE';

// Couleurs des boutons de filtre (cohérent avec STATUT_OR_COLORS du service)
const FILTRE_COLORS: Record<string, string> = {
  OUVERT:   '#2980b9',
  EN_COURS: '#e67e22',
  CLOTURE:  '#27ae60',
  ANNULE:   '#7f8c8d',
};

// =============================================================================
// COMPOSANT
// =============================================================================
// Type pour le prefill depuis un RDV
interface OrPrefill {
  rdvId:       number;
  clientId:    number;
  vehiculeId:  number | null;
  description: string;
}

const OrdresReparation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── État : données + UI ──────────────────────────────────────
  const [ordres, setOrdres]   = useState<OrdreReparationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // ── État : modale création ───────────────────────────────────
  const [modalCreationOuverte, setModalCreationOuverte] = useState(false);
  const [orPrefill, setOrPrefill]                       = useState<OrPrefill | null>(null);

  // ── État : menu d'action rapide ──────────────────────────────
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  // ── État : filtres ───────────────────────────────────────────
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeStatut, setActiveStatut] = useState<StatutFiltre>('ALL');

  // ── Chargement initial ───────────────────────────────────────
  const loadOrdres = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrdres();
      setOrdres(data);
    } catch (err: unknown) {
      setError(getApiError(err, 'Impossible de charger les ordres de réparation'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrdres(); }, [loadOrdres]);

  // Détecte un prefill depuis Planning ou ClientDetail (RDV → OR)
  useEffect(() => {
    if (location.state?.prefillFromRdv) {
      setOrPrefill(location.state.prefillFromRdv);
      setModalCreationOuverte(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Fermer le menu action au clic hors de la ligne
  useEffect(() => {
    const close = () => setMenuOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // ── Filtrage combiné (statut + texte) ────────────────────────
  // useMemo = "ne recalcule que si ordres/activeStatut/searchQuery change"
  // → optimisation, évite de refiltrer à chaque render inutile
  const ordresFiltres = useMemo(() => {
    let result = ordres;

    // Étape 1 : filtre par statut
    if (activeStatut !== 'ALL') {
      result = result.filter(or => or.statut === activeStatut);
    }

    // Étape 2 : filtre par recherche texte
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(or =>
        or.numero.toLowerCase().includes(q) ||
        or.client_nom.toLowerCase().includes(q) ||
        or.client_prenom?.toLowerCase().includes(q) ||
        or.vehicule_marque.toLowerCase().includes(q) ||
        or.vehicule_modele.toLowerCase().includes(q) ||
        or.vehicule_immatriculation?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [ordres, activeStatut, searchQuery]);

  // ── Compteurs par statut (pour les badges des boutons) ───────
  // useMemo pour éviter de recompter à chaque render
  const compteurs = useMemo(() => ({
    ALL:      ordres.length,
    OUVERT:   ordres.filter(or => or.statut === 'OUVERT').length,
    EN_COURS: ordres.filter(or => or.statut === 'EN_COURS').length,
    CLOTURE:  ordres.filter(or => or.statut === 'CLOTURE').length,
    ANNULE:   ordres.filter(or => or.statut === 'ANNULE').length,
  }), [ordres]);

  // ── Navigation vers l'éditeur ────────────────────────────────
  const handleOpenOr = (ordreId: number) => {
    navigate(`/ordres-reparation/${ordreId}`);
  };
  // ── Ouverture modale création (sans prefill) ─────────────────
  const handleNouveauOr = () => {
    setOrPrefill(null);
    setModalCreationOuverte(true);
  };

  // ── Callback après création réussie ──────────────────────────
  const handleOrCreated = (nouveau: OrdreReparationDetail) => {
    setModalCreationOuverte(false);
    // Redirection automatique vers l'éditeur du nouveau OR
    navigate(`/ordres-reparation/${nouveau.id}`);
    };

  // ── Réinitialisation des filtres ─────────────────────────────
  const handleResetFiltres = () => {
    setSearchQuery('');
    setActiveStatut('ALL');
  };

  // ── Action rapide : mettre en Annulé ─────────────────────────
  const handleAnnuler = async (e: React.MouseEvent, or: OrdreReparationListItem) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (!window.confirm(`Mettre l'OR ${or.numero} en Annulé ?`)) return;
    try {
      await updateOrdre(or.id, { statut: 'ANNULE' } as any);
      setOrdres(prev => prev.map(o => o.id === or.id ? { ...o, statut: 'ANNULE', statut_display: 'Annulé' } : o));
    } catch (err: unknown) {
      alert(`Erreur : ${getApiError(err, 'Erreur inattendue')}`);
    }
  };

  // ── Action rapide : supprimer ─────────────────────────────────
  const handleSupprimer = async (e: React.MouseEvent, or: OrdreReparationListItem) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (!window.confirm(`Supprimer définitivement l'OR ${or.numero} ?`)) return;
    try {
      await deleteOrdre(or.id);
      setOrdres(prev => prev.filter(o => o.id !== or.id));
    } catch (err: unknown) {
      alert(`Erreur : ${getApiError(err, 'Erreur inattendue')}`);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return <LoadingState message="Chargement des ordres de réparation..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadOrdres} />;
  }

  // Construction de la liste des filtres (ALL + tous les statuts)
  const filtresStatut: { value: StatutFiltre; label: string }[] = [
    { value: 'ALL', label: 'Tous' },
    ...Object.values(STATUTS_OR).map(s => ({
      value: s.value as StatutFiltre,
      label: s.label,
    })),
  ];

  

  return (
    <div className="list-page">

      <PageHeader
        title={<><Wrench size={18} /> Ordres de Réparation</>}
        count={ordresFiltres.length}
        countLabel="OR"
        onAdd={handleNouveauOr}
        addLabel="Nouvel OR"
        addIcon={<Wrench size={16} />}
      />

      {/* Barre de recherche */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Rechercher par N° OR, client, véhicule, immatriculation..."
      />

      {/* Filtres par statut */}
      <div className="or-filters">
        {filtresStatut.map(f => (
          <button
            key={f.value}
            className={`or-filter-btn ${activeStatut === f.value ? 'or-filter-btn--active' : ''}`}
            style={
              activeStatut === f.value && f.value !== 'ALL'
                ? { background: FILTRE_COLORS[f.value], borderColor: FILTRE_COLORS[f.value] }
                : {}
            }
            onClick={() => setActiveStatut(f.value)}
          >
            {f.label}
            <span className="or-filter-btn__count">
              {compteurs[f.value]}
            </span>
          </button>
        ))}
      </div>

    

      {/* État vide */}
      {ordresFiltres.length === 0 && (
        <div className="or-empty">
          <Wrench size={32} />
          <p>
            {searchQuery || activeStatut !== 'ALL'
              ? 'Aucun OR ne correspond aux filtres'
              : 'Aucun ordre de réparation pour l\'instant'}
          </p>
          {(searchQuery || activeStatut !== 'ALL') && (
            <button onClick={handleResetFiltres}>
              Effacer les filtres
            </button>
          )}
        </div>
      )}

      {/* Liste des OR */}
      {ordresFiltres.length > 0 && (
        <div className="or-list">
          {ordresFiltres.map(or => (
            <div
              key={or.id}
              className="or-row"
              onClick={() => { if (menuOpenId === or.id) setMenuOpenId(null); else handleOpenOr(or.id); }}
            >
              <div className="or-row__numero">
                <span className="or-row__numero-text">{or.numero}</span>
                <span className="or-row__date">
                  {formatDateCourt(or.date_ouverture)}
                </span>
              </div>

              <div className="or-row__info">
                <span className="or-row__client">
                  <User size={11} /> {or.client_nom} {or.client_prenom}
                </span>
                <span className="or-row__vehicule">
                  <Car size={11} /> {or.vehicule_marque} {or.vehicule_modele}
                  {or.vehicule_immatriculation && ` — ${or.vehicule_immatriculation}`}
                </span>
              </div>

              <div className="or-row__meta">
                <span className={`or-row__statut or-row__statut--${or.statut.toLowerCase()}`}>
                  {or.statut_display}
                </span>
                <span className="or-row__counters">
                  {or.nombre_pieces > 0 && `🔩 ${or.nombre_pieces}`}
                  {or.duree_totale_minutes > 0 && ` · ⏱️ ${Math.floor(or.duree_totale_minutes / 60)}h${String(or.duree_totale_minutes % 60).padStart(2, '0')}`}
                </span>
              </div>

              {/* ── Menu actions rapides ── */}
              <div
                className="or-row__actions"
                onClick={e => e.stopPropagation()}
              >
                <button
                  className="or-action-trigger"
                  onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === or.id ? null : or.id); }}
                  title="Actions"
                >
                  ⋯
                </button>
                {menuOpenId === or.id && (
                  <div className="or-action-menu">
                    {or.statut !== 'ANNULE' && or.statut !== 'CLOTURE' && (
                      <button
                        className="or-action-item"
                        onClick={e => handleAnnuler(e, or)}
                      >
                        ❌ Mettre en Annulé
                      </button>
                    )}
                    <button
                      className="or-action-item or-action-item--danger"
                      onClick={e => handleSupprimer(e, or)}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* === MODALE DE CRÉATION === */}
      {modalCreationOuverte && (
        <ModalOrCreation
          onCreated={handleOrCreated}
          onClose={() => { setModalCreationOuverte(false); setOrPrefill(null); }}
          prefill={orPrefill ?? undefined}
        />
      )}
    </div>
  );
};

export default OrdresReparation;