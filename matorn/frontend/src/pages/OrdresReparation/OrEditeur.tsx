// /frontend/src/pages/OrdresReparation/OrEditeur.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  fetchOrdre,
  updateOrdre,
  OrdreReparationDetail,
  STATUT_OR_COLORS,
  STATUTS_OR,
  addPieceToOrdre,
  deleteLignePiece,
  addInterventionToOrdre,
  deleteLigneIntervention,
  cloturerOrdre,
  decloturerOrdre,
  LigneInterventionCreateData,
} from './orService';
import {
  fetchParametres, ParametresFacturation,
  fetchReferentiels, fetchCollaborateurs,
  searchPieces as apiSearchPieces,
  Referentiel, Collaborateur, Piece,
} from '../../services/api';
import { generateOrPdf } from './generateOrPdf';
import OrPdfTemplate from './OrPdfTemplate';
import { getApiError } from '../../utils/apiError';

import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { ArrowLeft, Wrench, User, Car, Save, Printer } from '../../utils/icons';
import { formatDateCourt } from '../../utils/dataFormatters';

import ConfirmModal from '../../components/shared/ConfirmModal/ConfirmModal';
import './OrEditeur.css';

// =============================================================================
// TYPES LOCAUX
// =============================================================================

type FormData = {
  kilometrage_entree: string;
  description_travaux: string;
  statut: OrdreReparationDetail['statut'];
  notes_internes: string;
  kilometrage_sortie: string;
  heure_sortie: string;
};

type NewIntervForm = {
  date: string;
  type_intervention: number;
  mecanicien: number;
  duree_minutes: string;
  detail: string;
};

function initFormData(ordre: OrdreReparationDetail): FormData {
  return {
    kilometrage_entree:  ordre.kilometrage_entree?.toString() ?? '',
    description_travaux: ordre.description_travaux ?? '',
    statut:              ordre.statut,
    notes_internes:      ordre.notes_internes ?? '',
    kilometrage_sortie:  ordre.kilometrage_sortie?.toString() ?? '',
    heure_sortie:        ordre.heure_sortie ?? '',
  };
}

const initNewInterv = (): NewIntervForm => ({
  date:              new Date().toISOString().slice(0, 10),
  type_intervention: 0,
  mecanicien:        0,
  duree_minutes:     '',
  detail:            '',
});

// =============================================================================
// COMPOSANT
// =============================================================================

const OrEditeur: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── Données principales ────────────────────────────────────
  const [ordre, setOrdre]     = useState<OrdreReparationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    kilometrage_entree: '',
    description_travaux: '',
    statut: 'OUVERT',
    notes_internes: '',
    kilometrage_sortie: '',
    heure_sortie: '',
  });

  const [parametres, setParametres] = useState<ParametresFacturation | null>(null);

  // ── États UI ───────────────────────────────────────────────
  const [saving, setSaving]               = useState(false);
  const [autoSaving, setAutoSaving]       = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [saveError, setSaveError]         = useState<string | null>(null);
  const [fieldErrors, setFieldErrors]     = useState<Record<string, boolean>>({});
  const [decloturing, setDecloturing]     = useState(false);
  const [confirmDecloturer, setConfirmDecloturer] = useState(false);

  // ── Pièces ─────────────────────────────────────────────────
  const [showAddPiece, setShowAddPiece]         = useState(false);
  const [pieceSearch, setPieceSearch]           = useState('');
  const [pieceResults, setPieceResults]         = useState<Piece[]>([]);
  const [pieceLoading, setPieceLoading]         = useState(false);
  const [addPieceQty, setAddPieceQty]           = useState<Record<number, string>>({});
  const [addingPieceId, setAddingPieceId]       = useState<number | null>(null);

  // ── Interventions ──────────────────────────────────────────
  const [showAddInterv, setShowAddInterv]       = useState(false);
  const [typeInterventions, setTypeInterventions] = useState<Referentiel[]>([]);
  const [collaborateurs, setCollaborateurs]     = useState<Collaborateur[]>([]);
  const [newInterv, setNewInterv]               = useState<NewIntervForm>(initNewInterv());
  const [addingInterv, setAddingInterv]         = useState(false);

  // ── Refs ───────────────────────────────────────────────────
  const autoSaveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pieceSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Chargement OR ──────────────────────────────────────────
  const loadOrdre = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrdre(parseInt(id));
      setOrdre(data);
      setFormData(initFormData(data));
    } catch (err: unknown) {
      setError(getApiError(err, 'Impossible de charger cet ordre de réparation'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadOrdre(); }, [loadOrdre]);

  // Paramètres garage (pour PDF)
  useEffect(() => {
    fetchParametres().then(setParametres).catch(() => {});
  }, []);

  // Types intervention + mécaniciens
  useEffect(() => {
    Promise.all([
      fetchReferentiels('TYPE_INTERVENTION', true),
      fetchCollaborateurs(true),
    ]).then(([types, mecas]) => {
      setTypeInterventions(types);
      setCollaborateurs(mecas);
    }).catch(() => {});
  }, []);

  // Nettoyage timers au démontage
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current)    clearTimeout(autoSaveTimer.current);
      if (pieceSearchTimer.current) clearTimeout(pieceSearchTimer.current);
    };
  }, []);

  // Scroll automatique vers le premier champ en erreur
  useEffect(() => {
    if (Object.values(fieldErrors).some(Boolean)) {
      setTimeout(() => {
        document.querySelector<HTMLElement>('.ore-input--error')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }, [fieldErrors]);

  // ── Dérivés ────────────────────────────────────────────────
  const isLocked = ordre?.statut === 'CLOTURE';

  const isDirty = ordre
    ? formData.kilometrage_entree  !== (ordre.kilometrage_entree?.toString() ?? '')
      || formData.description_travaux !== (ordre.description_travaux ?? '')
      || formData.statut              !== ordre.statut
      || formData.notes_internes      !== (ordre.notes_internes ?? '')
      || formData.kilometrage_sortie  !== (ordre.kilometrage_sortie?.toString() ?? '')
      || formData.heure_sortie        !== (ordre.heure_sortie ?? '')
    : false;

  // ── Handler générique ──────────────────────────────────────
  const handleFieldChange = (field: keyof FormData, value: string) => {
    setSaveError(null);
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: false }));
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ── Auto-save kilométrage (debounce 1.5s) ──────────────────
  const handleKilometrageChange = (value: string) => {
    setFormData(prev => ({ ...prev, kilometrage_entree: value }));
    if (isLocked || !ordre) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaving(true);
      try {
        const km = value ? parseInt(value) : null;
        const updated = await updateOrdre(ordre.id, { kilometrage_entree: km });
        setOrdre(updated);
        setFormData(prev => ({ ...prev, kilometrage_entree: updated.kilometrage_entree?.toString() ?? '' }));
      } catch { /* échec silencieux */ }
      finally { setAutoSaving(false); }
    }, 1500);
  };

  // ── Sauvegarde manuelle ────────────────────────────────────
  const handleSave = async () => {
    if (!ordre || !isDirty || isLocked) return;
    setSaving(true);
    setSaveError(null);

    const isCloturingNow = formData.statut === 'CLOTURE' && ordre.statut !== 'CLOTURE';

    if (isCloturingNow) {
      const errors: Record<string, boolean> = {};
      if (!formData.heure_sortie)       errors.heure_sortie = true;
      if (!formData.kilometrage_sortie) errors.kilometrage_sortie = true;
      if (Object.keys(errors).length > 0) {
        const missing = [];
        if (errors.heure_sortie)       missing.push('heure de sortie');
        if (errors.kilometrage_sortie) missing.push('kilométrage de sortie');
        setSaveError(`Clôture impossible — champs manquants : ${missing.join(', ')}`);
        setFieldErrors(errors);
        setSaving(false);
        return;
      }
    }

    try {
      let updated: OrdreReparationDetail;

      if (isCloturingNow) {
        // Sauvegarder d'abord les autres champs si besoin
        const needPatch =
          formData.description_travaux !== ordre.description_travaux ||
          formData.notes_internes      !== ordre.notes_internes      ||
          formData.kilometrage_entree  !== (ordre.kilometrage_entree?.toString() ?? '');

        if (needPatch) {
          await updateOrdre(ordre.id, {
            kilometrage_entree:  formData.kilometrage_entree ? parseInt(formData.kilometrage_entree) : null,
            description_travaux: formData.description_travaux,
            notes_internes:      formData.notes_internes,
          });
        }
        // Appel de l'action de clôture
        updated = await cloturerOrdre(ordre.id, {
          kilometrage_sortie: formData.kilometrage_sortie ? parseInt(formData.kilometrage_sortie) : undefined,
          heure_sortie:       formData.heure_sortie || undefined,
        });
      } else {
        const payload = {
          kilometrage_entree:  formData.kilometrage_entree ? parseInt(formData.kilometrage_entree) : null,
          description_travaux: formData.description_travaux,
          statut:              formData.statut,
          notes_internes:      formData.notes_internes,
          kilometrage_sortie:  formData.kilometrage_sortie ? parseInt(formData.kilometrage_sortie) : null,
          heure_sortie:        formData.heure_sortie || null,
        };
        updated = await updateOrdre(ordre.id, payload);
      }

      setOrdre(updated);
      setFormData(initFormData(updated));
    } catch (err: unknown) {
      setSaveError(getApiError(err, 'Erreur lors de la sauvegarde'));
    } finally {
      setSaving(false);
    }
  };

  // ── Annuler les modifications ──────────────────────────────
  const handleCancel = () => {
    if (!ordre) return;
    setFormData(initFormData(ordre));
    setSaveError(null);
  };

  // ── PDF ────────────────────────────────────────────────────
  const handleGeneratePdf = async () => {
    if (!parametres) return;
    setGeneratingPdf(true);
    try {
      await generateOrPdf('or-pdf-template', `${ordre?.numero ?? 'OR'}.pdf`);
    } catch (err: unknown) {
      setSaveError(`Erreur PDF : ${getApiError(err, 'Erreur inattendue')}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // ── PIÈCES : recherche ─────────────────────────────────────
  const handlePieceSearchChange = (q: string) => {
    setPieceSearch(q);
    setPieceResults([]);
    if (pieceSearchTimer.current) clearTimeout(pieceSearchTimer.current);
    if (q.length < 2) return;
    pieceSearchTimer.current = setTimeout(async () => {
      setPieceLoading(true);
      try {
        const results = await apiSearchPieces(q);
        setPieceResults(results);
      } catch { setPieceResults([]); }
      finally { setPieceLoading(false); }
    }, 300);
  };

  // ── PIÈCES : ajout ─────────────────────────────────────────
  const handleAddPiece = async (pieceId: number) => {
    if (!ordre) return;
    const qtyStr = addPieceQty[pieceId] ?? '1';
    const qty    = parseInt(qtyStr);
    if (!qty || qty < 1) return;

    setAddingPieceId(pieceId);
    try {
      await addPieceToOrdre(ordre.id, { piece: pieceId, quantite: qty });
      const updated = await fetchOrdre(ordre.id);
      setOrdre(updated);
      setFormData(prev => ({ ...prev })); // conserve le form
      setShowAddPiece(false);
      setPieceSearch('');
      setPieceResults([]);
      setAddPieceQty({});
    } catch (err: unknown) {
      setSaveError(getApiError(err, 'Erreur lors de l\'ajout de la pièce'));
    } finally {
      setAddingPieceId(null);
    }
  };

  // ── PIÈCES : suppression ───────────────────────────────────
  const handleDeletePiece = async (lignePieceId: number) => {
    try {
      await deleteLignePiece(lignePieceId);
      setOrdre(prev =>
        prev
          ? {
              ...prev,
              pieces: prev.pieces.filter(p => p.id !== lignePieceId),
              nombre_pieces: Math.max(0, prev.nombre_pieces - 1),
            }
          : prev
      );
    } catch (err: unknown) {
      setSaveError(getApiError(err, 'Erreur lors de la suppression de la pièce'));
    }
  };

  // ── INTERVENTIONS : ajout ──────────────────────────────────
  const handleAddInterv = async () => {
    if (!ordre) return;
    const intervErrors: Record<string, boolean> = {};
    if (!newInterv.date)               intervErrors.interv_date = true;
    if (!newInterv.type_intervention)  intervErrors.interv_type = true;
    if (!newInterv.mecanicien)         intervErrors.interv_meca = true;
    if (!newInterv.duree_minutes)      intervErrors.interv_duree = true;
    if (Object.keys(intervErrors).length > 0) {
      setFieldErrors(intervErrors);
      setSaveError('Tous les champs marqués * sont obligatoires');
      return;
    }
    setAddingInterv(true);
    setSaveError(null);
    try {
      const payload: LigneInterventionCreateData = {
        date:              newInterv.date,
        type_intervention: newInterv.type_intervention,
        mecanicien:        newInterv.mecanicien,
        duree_minutes:     parseInt(newInterv.duree_minutes),
        detail:            newInterv.detail || undefined,
      };
      await addInterventionToOrdre(ordre.id, payload);
      const updated = await fetchOrdre(ordre.id);
      setOrdre(updated);
      setShowAddInterv(false);
      setNewInterv(initNewInterv());
    } catch (err: unknown) {
      setSaveError(getApiError(err, 'Erreur lors de l\'ajout de l\'intervention'));
    } finally {
      setAddingInterv(false);
    }
  };

  // ── DÉCLÔTURE ──────────────────────────────────────────────
  const handleDecloturer = () => {
    if (!ordre) return;
    setConfirmDecloturer(true);
  };

  const doDecloturer = async () => {
    if (!ordre) return;
    setConfirmDecloturer(false);
    setDecloturing(true);
    setSaveError(null);
    try {
      const updated = await decloturerOrdre(ordre.id);
      setOrdre(updated);
      setFormData(initFormData(updated));
    } catch (err: unknown) {
      setSaveError(getApiError(err, 'Erreur lors de la déclôture'));
    } finally {
      setDecloturing(false);
    }
  };

  // ── INTERVENTIONS : suppression ────────────────────────────
  const handleDeleteInterv = async (ligneId: number) => {
    try {
      await deleteLigneIntervention(ligneId);
      setOrdre(prev =>
        prev
          ? { ...prev, interventions: prev.interventions.filter(i => i.id !== ligneId) }
          : prev
      );
    } catch (err: unknown) {
      setSaveError(getApiError(err, 'Erreur lors de la suppression de l\'intervention'));
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════

  if (loading) return <LoadingState message="Chargement de l'ordre de réparation..." />;
  if (error)   return <ErrorState message={error} onRetry={loadOrdre} />;
  if (!ordre)  return <ErrorState message="Ordre de réparation introuvable" onRetry={loadOrdre} />;

  return (
    <div className="ore">

      {/* ── HEADER STICKY ── */}
      <div className="ore__header">
        <button className="ore__btn-retour" onClick={() => navigate('/ordres-reparation')}>
          <ArrowLeft size={18} /> Retour
        </button>

        <div className="ore__header-center">
          <h1 className="ore__numero">
            <Wrench size={18} /> {ordre.numero}
          </h1>
          <span
            className="ore__statut-badge"
            style={{ background: STATUT_OR_COLORS[ordre.statut] }}
          >
            {ordre.statut_display}
          </span>
        </div>

        <div className="ore__header-actions">
          {isDirty && !isLocked && (
            <button className="ore__btn-secondary" onClick={handleCancel} disabled={saving}>
              Annuler
            </button>
          )}
          <button
            className="ore__btn-secondary"
            onClick={handleGeneratePdf}
            disabled={generatingPdf || !parametres}
          >
            <Printer size={15} /> {generatingPdf ? 'Génération...' : 'PDF'}
          </button>
          {isLocked && (
            <button
              className="ore__btn-secondary ore__btn-decloturer"
              onClick={handleDecloturer}
              disabled={decloturing}
              title="Repasser cet OR en cours (si facture non payée)"
            >
              {decloturing ? 'Déclôture...' : '🔓 Déclôturer'}
            </button>
          )}
          {!isLocked && (
            <button
              className="ore__btn-primary"
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              <Save size={15} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          )}
        </div>
      </div>

      {/* ── BANNER : OR CLÔTURÉ ── */}
      {isLocked && (
        <div className="ore__banner-lock">
          🔒 Cet OR est clôturé — consultation uniquement, aucune modification possible
        </div>
      )}

      {/* ── ERREUR DE SAUVEGARDE ── */}
      {saveError && (
        <div className="ore__save-error">⚠️ {saveError}</div>
      )}

      {/* ══════════════════════════════════════════════════════
          CONTENU
      ══════════════════════════════════════════════════════ */}
      <div className="ore__content">

        {/* ── 1. CLIENT + VÉHICULE (2 colonnes) ── */}
        <div className="ore__row-2">

          <div className="ore-card">
            <div className="ore-card__head">
              <User size={14} /> Client
            </div>
            <div className="ore-card__body">
              <dl className="ore-info-grid">
                <dt>Nom</dt>
                <dd>{ordre.client_nom} {ordre.client_prenom}</dd>
                <dt>Téléphone</dt>
                <dd>{ordre.client_telephone || '—'}</dd>
                <dt>Email</dt>
                <dd>{ordre.client_email || '—'}</dd>
                {ordre.client_adresse && (
                  <>
                    <dt>Adresse</dt>
                    <dd>{ordre.client_adresse}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>

          <div className="ore-card">
            <div className="ore-card__head">
              <Car size={14} /> Véhicule / Engin
            </div>
            <div className="ore-card__body">
              <dl className="ore-info-grid">
                <dt>Désignation</dt>
                <dd>
                  {ordre.vehicule_marque} {ordre.vehicule_modele}
                  {ordre.vehicule_annee && ` (${ordre.vehicule_annee})`}
                </dd>
                <dt>Identifiant</dt>
                <dd className="ore-mono">{ordre.vehicule_immatriculation || '—'}</dd>
                <dt>Type</dt>
                <dd>{ordre.vehicule_type || '—'}</dd>
                <dt>Ouvert le</dt>
                <dd>{formatDateCourt(ordre.date_ouverture)}</dd>
              </dl>
            </div>
          </div>

        </div>

        {/* ── 2. INFORMATIONS SAISIES ── */}
        <div className="ore-card">
          <div className="ore-card__head">Informations saisies</div>
          <div className="ore-card__body">
            <div className="ore-controls">

              <div className="ore-field">
                <label className="ore-field__label">
                  Kilométrage à l'entrée
                  {autoSaving && <span className="ore-autosave-indicator">✓ enregistrement...</span>}
                </label>
                <div className="ore-field__km-wrap">
                  <input
                    type="number"
                    className="ore-field__input"
                    value={formData.kilometrage_entree}
                    onChange={e => handleKilometrageChange(e.target.value)}
                    disabled={isLocked}
                    min="0"
                    placeholder="Ex : 142 500"
                  />
                  <span className="ore-field__suffix">km</span>
                </div>
              </div>

              <div className="ore-field">
                <label className="ore-field__label">Statut</label>
                <select
                  className="ore-field__input ore-field__select"
                  value={formData.statut}
                  onChange={e => handleFieldChange('statut', e.target.value as FormData['statut'])}
                  disabled={isLocked}
                >
                  {Object.values(STATUTS_OR).map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* ── 3. DESCRIPTION DES TRAVAUX ── */}
        <div className="ore-card">
          <div className="ore-card__head">Description des travaux</div>
          <div className="ore-card__body ore-card__body--description">
            {ordre.rdv_description && (
              <div className="ore-rdv-hint">
                <span className="ore-rdv-hint__label">Depuis le RDV :</span> {ordre.rdv_description}
              </div>
            )}
            <textarea
              className="ore-description"
              value={formData.description_travaux}
              onChange={e => handleFieldChange('description_travaux', e.target.value)}
              disabled={isLocked}
              placeholder="Description des travaux à effectuer ou effectués..."
              rows={6}
            />
          </div>
        </div>

        {/* ── 4. PIÈCES SORTIES ── */}
        <div className="ore-card">
          <div className="ore-card__head-row">
            <span className="ore-card__head-label">Pièces sorties du stock ({ordre.nombre_pieces})</span>
            {!isLocked && (
              <button
                className="ore-btn-add"
                onClick={() => { setShowAddPiece(v => !v); setPieceSearch(''); setPieceResults([]); }}
              >
                {showAddPiece ? '✕ Fermer' : '+ Ajouter'}
              </button>
            )}
          </div>

          {/* ── Panneau recherche pièce ── */}
          {showAddPiece && (
            <div className="ore-add-panel">
              <p className="ore-add-panel__title">Rechercher une pièce dans le stock</p>
              <input
                className="ore-search-input"
                type="text"
                placeholder="Nom, référence… (min. 2 car.)"
                value={pieceSearch}
                onChange={e => handlePieceSearchChange(e.target.value)}
                autoFocus
              />

              {pieceLoading && (
                <div className="ore-search-empty">Recherche en cours…</div>
              )}

              {!pieceLoading && pieceSearch.length >= 2 && pieceResults.length === 0 && (
                <div className="ore-search-empty">Aucune pièce trouvée pour « {pieceSearch} »</div>
              )}

              {pieceResults.length > 0 && (
                <div className="ore-search-results">
                  {pieceResults.map(p => {
                    const qty = addPieceQty[p.id] ?? '1';
                    const statusClass =
                      p.stock_status === 'RUPTURE' ? 'rupture' :
                      p.stock_status === 'ALERTE'  ? 'alerte'  : 'ok';
                    return (
                      <div key={p.id} className="ore-search-result">
                        <div className="ore-search-result__info">
                          <div className="ore-search-result__nom">{p.nom}</div>
                          <div className="ore-search-result__ref">{p.reference}</div>
                        </div>
                        <span className={`ore-stock-badge ore-stock-badge--${statusClass}`}>
                          {p.stock_status === 'RUPTURE' ? 'Rupture' : `Dispo : ${p.stock_disponible}`}
                        </span>
                        <div className="ore-search-result__qty">
                          <input
                            type="number"
                            className="ore-qty-input"
                            value={qty}
                            min="1"
                            onChange={e => setAddPieceQty(prev => ({ ...prev, [p.id]: e.target.value }))}
                          />
                          <button
                            className="ore-btn-confirm"
                            onClick={() => handleAddPiece(p.id)}
                            disabled={addingPieceId === p.id || p.stock_disponible <= 0}
                            title={p.stock_disponible <= 0 ? 'Stock insuffisant' : 'Ajouter'}
                          >
                            {addingPieceId === p.id ? '…' : 'Ajouter'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="ore-card__body ore-card__body--table">
            {ordre.pieces.length === 0 ? (
              <p className="ore-empty">Aucune pièce ajoutée</p>
            ) : (
              <table className="ore-table">
                <thead>
                  <tr>
                    <th className="ore-table__col-qte">Qté</th>
                    <th>Désignation</th>
                    <th className="ore-table__col-ref">Référence</th>
                    {!isLocked && <th className="ore-table__col-action"></th>}
                  </tr>
                </thead>
                <tbody>
                  {ordre.pieces.map(p => (
                    <tr key={p.id}>
                      <td className="ore-table__center">{p.quantite}</td>
                      <td>{p.designation_snapshot}</td>
                      <td className="ore-table__mono">{p.reference_snapshot}</td>
                      {!isLocked && (
                        <td className="ore-table__center">
                          <button
                            className="ore-btn-danger"
                            onClick={() => handleDeletePiece(p.id)}
                            title="Retirer cette pièce"
                          >×</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── 5. INTERVENTIONS / MAIN D'ŒUVRE ── */}
        <div className="ore-card">
          <div className="ore-card__head-row">
            <span className="ore-card__head-label">Temps passé / Interventions</span>
            {!isLocked && (
              <button
                className="ore-btn-add"
                onClick={() => { setShowAddInterv(v => !v); setNewInterv(initNewInterv()); setSaveError(null); }}
              >
                {showAddInterv ? '✕ Fermer' : '+ Ajouter'}
              </button>
            )}
          </div>

          {/* ── Formulaire ajout intervention ── */}
          {showAddInterv && (
            <div className="ore-add-panel">
              <p className="ore-add-panel__title">Nouvelle intervention</p>
              <div className="ore-interv-form">

                <div className="ore-form-field">
                  <label className="ore-form-label">Date *</label>
                  <input
                    type="date"
                    className={`ore-form-input${fieldErrors.interv_date ? ' ore-input--error' : ''}`}
                    value={newInterv.date}
                    onChange={e => { setFieldErrors(p => ({ ...p, interv_date: false })); setNewInterv(p => ({ ...p, date: e.target.value })); }}
                  />
                </div>

                <div className="ore-form-field">
                  <label className="ore-form-label">Durée (minutes) *</label>
                  <input
                    type="number"
                    className={`ore-form-input${fieldErrors.interv_duree ? ' ore-input--error' : ''}`}
                    placeholder="Ex : 90"
                    min="1"
                    value={newInterv.duree_minutes}
                    onChange={e => { setFieldErrors(p => ({ ...p, interv_duree: false })); setNewInterv(p => ({ ...p, duree_minutes: e.target.value })); }}
                  />
                </div>

                <div className="ore-form-field">
                  <label className="ore-form-label">Type d'intervention *</label>
                  <select
                    className={`ore-form-input${fieldErrors.interv_type ? ' ore-input--error' : ''}`}
                    value={newInterv.type_intervention}
                    onChange={e => { setFieldErrors(p => ({ ...p, interv_type: false })); setNewInterv(p => ({ ...p, type_intervention: parseInt(e.target.value) })); }}
                  >
                    <option value={0}>— Choisir —</option>
                    {typeInterventions.map(t => (
                      <option key={t.id} value={t.id}>{t.icone} {t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="ore-form-field">
                  <label className="ore-form-label">Mécanicien *</label>
                  <select
                    className={`ore-form-input${fieldErrors.interv_meca ? ' ore-input--error' : ''}`}
                    value={newInterv.mecanicien}
                    onChange={e => { setFieldErrors(p => ({ ...p, interv_meca: false })); setNewInterv(p => ({ ...p, mecanicien: parseInt(e.target.value) })); }}
                  >
                    <option value={0}>— Choisir —</option>
                    {collaborateurs.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>

                <div className="ore-form-field ore-interv-form--full">
                  <label className="ore-form-label">Détail / Notes (optionnel)</label>
                  <input
                    type="text"
                    className="ore-form-input"
                    placeholder="Description courte de l'intervention…"
                    value={newInterv.detail}
                    onChange={e => setNewInterv(p => ({ ...p, detail: e.target.value }))}
                  />
                </div>

              </div>
              <div className="ore-add-panel__actions">
                <button
                  className="ore-btn-cancel-sm"
                  onClick={() => { setShowAddInterv(false); setNewInterv(initNewInterv()); setSaveError(null); }}
                >
                  Annuler
                </button>
                <button
                  className="ore-btn-confirm-sm"
                  onClick={handleAddInterv}
                  disabled={addingInterv}
                >
                  {addingInterv ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}

          <div className="ore-card__body ore-card__body--table">
            {ordre.interventions.length === 0 ? (
              <p className="ore-empty">Aucune intervention enregistrée</p>
            ) : (
              <table className="ore-table">
                <thead>
                  <tr>
                    <th className="ore-table__col-date">Date</th>
                    <th className="ore-table__col-type">Type</th>
                    <th className="ore-table__col-meca">Mécanicien</th>
                    <th className="ore-table__col-duree">Durée</th>
                    <th>Détail</th>
                    {!isLocked && <th className="ore-table__col-action"></th>}
                  </tr>
                </thead>
                <tbody>
                  {ordre.interventions.map(i => (
                    <tr key={i.id}>
                      <td className="ore-table__center">{formatDateCourt(i.date)}</td>
                      <td>
                        <span
                          className="ore-type-badge"
                          style={{ borderLeftColor: i.type_intervention_couleur }}
                        >
                          {i.type_intervention_icone} {i.type_intervention_label}
                        </span>
                      </td>
                      <td>{i.mecanicien_nom}</td>
                      <td className="ore-table__center ore-table__mono">{i.duree_formatee}</td>
                      <td>{i.detail || '—'}</td>
                      {!isLocked && (
                        <td className="ore-table__center">
                          <button
                            className="ore-btn-danger"
                            onClick={() => handleDeleteInterv(i.id)}
                            title="Supprimer cette intervention"
                          >×</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── 6. CLÔTURE ── */}
        <div className="ore-card">
          <div className="ore-card__head">Clôture de l'intervention</div>
          <div className="ore-card__body">

            <div className="ore-cloture-grid">

              {/* Date de fin — auto-définie par Django lors de la clôture */}
              <div className="ore-cloture-field">
                <span className="ore-cloture-field__label">Date de fin</span>
                {ordre.date_cloture ? (
                  <span className="ore-cloture-readonly">{formatDateCourt(ordre.date_cloture)}</span>
                ) : (
                  <span className="ore-cloture-field__value">—</span>
                )}
              </div>

              {/* Km sortie — éditable */}
              <div className="ore-cloture-field">
                <span className="ore-cloture-field__label">Km sortie</span>
                <input
                  type="number"
                  className={`ore-cloture-field__input${fieldErrors.kilometrage_sortie ? ' ore-input--error' : ''}`}
                  value={formData.kilometrage_sortie}
                  onChange={e => handleFieldChange('kilometrage_sortie', e.target.value)}
                  disabled={isLocked}
                  placeholder="Ex : 143 200"
                  min="0"
                />
              </div>

              {/* Heure sortie — éditable */}
              <div className="ore-cloture-field">
                <span className="ore-cloture-field__label">Heure sortie</span>
                <input
                  type="time"
                  className={`ore-cloture-field__input${fieldErrors.heure_sortie ? ' ore-input--error' : ''}`}
                  value={formData.heure_sortie}
                  onChange={e => handleFieldChange('heure_sortie', e.target.value)}
                  disabled={isLocked}
                />
              </div>

            </div>

            <div className="ore-field ore-field--full">
              <label className="ore-field__label">Notes internes (non imprimées sur l'OR)</label>
              <textarea
                className="ore-field__input ore-field__textarea"
                value={formData.notes_internes}
                onChange={e => handleFieldChange('notes_internes', e.target.value)}
                disabled={isLocked}
                placeholder="Notes mécanicien, observations internes..."
                rows={3}
              />
            </div>

          </div>
        </div>

      </div>

      {/* ── TEMPLATE PDF CACHÉ (hors écran, capturé par html2canvas) ── */}
      {parametres && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
          <OrPdfTemplate ordre={ordre} parametres={parametres} />
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDecloturer}
        title="Déclôturer cet OR ?"
        message={'L\'OR repassera en statut "En cours".'}
        variant="warning"
        labelConfirm="Déclôturer"
        onConfirm={doDecloturer}
        onCancel={() => setConfirmDecloturer(false)}
      />

    </div>
  );
};

export default OrEditeur;
