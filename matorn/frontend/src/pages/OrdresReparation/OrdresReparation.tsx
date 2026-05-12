// /frontend/src/pages/OrdresReparation/OrdresReparation.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Service API
import { fetchOrdres, OrdreReparationListItem, OrdreReparationDetail, STATUTS_OR } from './orService';

// Composants partagés
import PageHeader from '../../components/shared/PageHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import SearchBar from '../../components/shared/SearchBar/SearchBar';
import ModalOrCreation from './ModalOrCreation';

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
const OrdresReparation: React.FC = () => {
  const navigate = useNavigate();

  // ── État : données + UI ──────────────────────────────────────
  const [ordres, setOrdres]   = useState<OrdreReparationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  
  // ── État : modale création ───────────────────────────────────
  const [modalCreationOuverte, setModalCreationOuverte] = useState(false);

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
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les ordres de réparation');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrdres();
  }, [loadOrdres]);

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
  // ── Ouverture modale création ────────────────────────────────
  const handleNouveauOr = () => {
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
              onClick={() => handleOpenOr(or.id)}
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
            </div>
          ))}
        </div>
      )}
      {/* === MODALE DE CRÉATION === */}
      {modalCreationOuverte && (
        <ModalOrCreation
          onCreated={handleOrCreated}
          onClose={() => setModalCreationOuverte(false)}
        />
      )}
    </div>
  );
};

export default OrdresReparation;