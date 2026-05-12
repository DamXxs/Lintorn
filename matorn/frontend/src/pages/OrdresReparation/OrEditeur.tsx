// /frontend/src/pages/OrdresReparation/OrEditeur.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Service API
import { fetchOrdre, OrdreReparationDetail, STATUT_OR_COLORS } from './orService';

// Composants partagés
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';

// Icônes
import { ArrowLeft, Wrench, User, Car, Save, Printer } from '../../utils/icons';

// Helpers
import { formatDateCourt } from '../../utils/dataFormatters';

// Styles
import './OrEditeur.css';

// =============================================================================
// COMPOSANT
// =============================================================================
const OrEditeur: React.FC = () => {
  // useParams = "récupère l'id depuis l'URL /ordres-reparation/:id"
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── État : données + UI ──────────────────────────────────────
  const [ordre, setOrdre]     = useState<OrdreReparationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // ── Chargement de l'OR ───────────────────────────────────────
  const loadOrdre = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrdre(parseInt(id));
      setOrdre(data);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger cet ordre de réparation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrdre();
  }, [loadOrdre]);

  // ── Retour à la liste ────────────────────────────────────────
  const handleRetour = () => {
    navigate('/ordres-reparation');
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return <LoadingState message="Chargement de l'ordre de réparation..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadOrdre} />;
  }

  if (!ordre) {
    return <ErrorState message="Ordre de réparation introuvable" />;
  }

  return (
    <div className="or-editeur">

      {/* === HEADER STICKY === */}
      <div className="or-editeur__header">
        <button className="or-editeur__btn-retour" onClick={handleRetour}>
          <ArrowLeft size={18} />
          Retour
        </button>

        <div className="or-editeur__header-info">
          <h1 className="or-editeur__numero">
            <Wrench size={20} /> {ordre.numero}
          </h1>
          <span
            className="or-editeur__statut"
            style={{ background: STATUT_OR_COLORS[ordre.statut] }}
          >
            {ordre.statut_display}
          </span>
        </div>

        <div className="or-editeur__header-actions">
          <button className="or-editeur__btn-pdf" disabled>
            <Printer size={16} /> Imprimer PDF
          </button>
          <button className="or-editeur__btn-save" disabled>
            <Save size={16} /> Enregistrer
          </button>
        </div>
      </div>

      {/* === CONTENU === */}
      <div className="or-editeur__content">

        {/* CARD : Client & Véhicule */}
        <div className="or-card">
          <h2 className="or-card__title">
            <User size={16} /> Client & véhicule
          </h2>
          <div className="or-card__body">
            <p>
              <strong>Client :</strong> {ordre.client_nom} {ordre.client_prenom}
              {ordre.client_telephone && ` — ${ordre.client_telephone}`}
            </p>
            <p>
              <Car size={14} /> <strong>Véhicule :</strong> {ordre.vehicule_marque} {ordre.vehicule_modele}
              {ordre.vehicule_immatriculation && ` — ${ordre.vehicule_immatriculation}`}
            </p>
            <p className="or-card__meta">
              Ouvert le {formatDateCourt(ordre.date_ouverture)}
            </p>
          </div>
        </div>

        {/* CARD : Informations */}
        <div className="or-card">
          <h2 className="or-card__title">📋 Informations</h2>
          <div className="or-card__body">
            <p><strong>Kilométrage :</strong> {ordre.kilometrage_entree ?? '—'} km</p>
            <p><strong>Description :</strong> {ordre.description_travaux || '—'}</p>
          </div>
        </div>

        {/* CARD : Pièces (placeholder) */}
        <div className="or-card">
          <h2 className="or-card__title">🔩 Pièces utilisées ({ordre.nombre_pieces})</h2>
          <div className="or-card__body">
            {ordre.pieces.length === 0 ? (
              <p className="or-empty-line">Aucune pièce ajoutée</p>
            ) : (
              <ul>
                {ordre.pieces.map(p => (
                  <li key={p.id}>
                    {p.designation_snapshot} (×{p.quantite})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* CARD : Interventions (placeholder) */}
        <div className="or-card">
          <h2 className="or-card__title">⏱️ Interventions</h2>
          <div className="or-card__body">
            {ordre.interventions.length === 0 ? (
              <p className="or-empty-line">Aucune intervention enregistrée</p>
            ) : (
              <ul>
                {ordre.interventions.map(i => (
                  <li key={i.id}>
                    {i.type_intervention_label} — {i.duree_formatee} (par {i.mecanicien_nom})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrEditeur;