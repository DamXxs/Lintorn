// /frontend/src/pages/OrdresReparation/OrEditeur.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Service API
import {
  fetchOrdre,
  updateOrdre,
  OrdreReparationDetail,
  STATUT_OR_COLORS,
  STATUTS_OR,
} from './orService';

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

  // ── État : formulaire d'édition ──────────────────────────────
  // formData = "brouillon local" qu'on modifie sans toucher au serveur
  const [formData, setFormData] = useState({
    kilometrage_entree: '',
    description_travaux: '',
    statut: 'OUVERT',
  });

  // État de sauvegarde
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Chargement de l'OR ───────────────────────────────────────
  const loadOrdre = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrdre(parseInt(id));
      setOrdre(data);
      // On initialise le brouillon avec les valeurs serveur
      setFormData({
        kilometrage_entree: data.kilometrage_entree?.toString() || '',
        description_travaux: data.description_travaux || '',
        statut: data.statut,
      });
    } catch (err: any) {
      setError(err.message || 'Impossible de charger cet ordre de réparation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrdre();
  }, [loadOrdre]);

  // ── Détection des modifications non sauvées ──────────────────
  // On compare formData vs ordre. Si différent → isDirty = true
  const isDirty = ordre ? (
    formData.kilometrage_entree !== (ordre.kilometrage_entree?.toString() || '') ||
    formData.description_travaux !== (ordre.description_travaux || '') ||
    formData.statut !== ordre.statut
  ) : false;

  // ── Handler de changement de champ ───────────────────────────
  // Une seule fonction pour gérer TOUS les champs (pattern courant React)
  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ── Sauvegarde des modifications ─────────────────────────────
  const handleSave = async () => {
    if (!ordre || !isDirty) return;

    setSaving(true);
    setSaveError(null);

    try {
      const payload = {
        kilometrage_entree: formData.kilometrage_entree
          ? parseInt(formData.kilometrage_entree)
          : null,
        description_travaux: formData.description_travaux,
        statut: formData.statut,
      };

      // PATCH vers Django
      const updated = await updateOrdre(ordre.id, payload);

      // Succès : on met à jour ordre (qui devient la nouvelle "vérité serveur")
      setOrdre(updated);
    } catch (err: any) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ── Annuler les modifications ────────────────────────────────
  const handleCancel = () => {
    if (!ordre) return;
    setFormData({
      kilometrage_entree: ordre.kilometrage_entree?.toString() || '',
      description_travaux: ordre.description_travaux || '',
      statut: ordre.statut,
    });
    setSaveError(null);
  };

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
    return <ErrorState message="Ordre de réparation introuvable" onRetry={loadOrdre} />;
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
          {isDirty && (
            <button
              className="or-editeur__btn-cancel"
              onClick={handleCancel}
              disabled={saving}
            >
              Annuler
            </button>
          )}
          <button className="or-editeur__btn-pdf" disabled>
            <Printer size={16} /> Imprimer PDF
          </button>
          <button
            className="or-editeur__btn-save"
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            <Save size={16} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* === ERREUR DE SAUVEGARDE === */}
      {saveError && (
        <div className="or-editeur__save-error">
          ⚠️ {saveError}
        </div>
      )}

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

        {/* CARD : Informations (ÉDITABLE) */}
        <div className="or-card">
          <h2 className="or-card__title">📋 Informations</h2>
          <div className="or-card__body or-card__body--form">

            <div className="or-field">
              <label className="or-field__label">Kilométrage à l'entrée</label>
              <div className="or-field__input-wrapper">
                <input
                  type="number"
                  className="or-field__input"
                  value={formData.kilometrage_entree}
                  onChange={(e) => handleFieldChange('kilometrage_entree', e.target.value)}
                  placeholder="Ex : 142500"
                  min="0"
                />
                <span className="or-field__suffix">km</span>
              </div>
            </div>

            <div className="or-field">
              <label className="or-field__label">Description des travaux</label>
              <textarea
                className="or-field__input or-field__textarea"
                value={formData.description_travaux}
                onChange={(e) => handleFieldChange('description_travaux', e.target.value)}
                placeholder="Décrivez les travaux à effectuer..."
                rows={3}
              />
            </div>

            <div className="or-field">
              <label className="or-field__label">Statut</label>
              <select
                className="or-field__input or-field__select"
                value={formData.statut}
                onChange={(e) => handleFieldChange('statut', e.target.value)}
              >
                {Object.values(STATUTS_OR).map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

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