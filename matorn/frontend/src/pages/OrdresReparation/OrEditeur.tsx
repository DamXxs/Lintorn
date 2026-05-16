// /frontend/src/pages/OrdresReparation/OrEditeur.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  fetchOrdre,
  updateOrdre,
  OrdreReparationDetail,
  STATUT_OR_COLORS,
  STATUTS_OR,
} from './orService';
import { fetchParametres, ParametresFacturation } from '../../services/api';
import { generateOrPdf } from './generateOrPdf';
import OrPdfTemplate from './OrPdfTemplate';

import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { ArrowLeft, Wrench, User, Car, Save, Printer } from '../../utils/icons';
import { formatDateCourt } from '../../utils/dataFormatters';

import './OrEditeur.css';

// =============================================================================
// TYPES LOCAUX
// =============================================================================

type FormData = {
  kilometrage_entree: string;
  description_travaux: string;
  statut: OrdreReparationDetail['statut'];
  notes_internes: string;
};

function initFormData(ordre: OrdreReparationDetail): FormData {
  return {
    kilometrage_entree: ordre.kilometrage_entree?.toString() ?? '',
    description_travaux: ordre.description_travaux ?? '',
    statut: ordre.statut,
    notes_internes: ordre.notes_internes ?? '',
  };
}

// =============================================================================
// COMPOSANT
// =============================================================================

const OrEditeur: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ordre, setOrdre]     = useState<OrdreReparationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    kilometrage_entree: '',
    description_travaux: '',
    statut: 'OUVERT',
    notes_internes: '',
  });

  const [parametres, setParametres] = useState<ParametresFacturation | null>(null);

  const [saving, setSaving]               = useState(false);
  const [autoSaving, setAutoSaving]       = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [saveError, setSaveError]         = useState<string | null>(null);

  // Ref pour le timer d'auto-save du kilométrage
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Chargement ────────────────────────────────────────────
  const loadOrdre = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrdre(parseInt(id));
      setOrdre(data);
      setFormData(initFormData(data));
    } catch (err: any) {
      setError(err.message || 'Impossible de charger cet ordre de réparation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadOrdre(); }, [loadOrdre]);

  useEffect(() => {
    fetchParametres().then(setParametres).catch(() => {});
  }, []);

  // Nettoyage du timer au démontage
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  // ── OR clôturé = lecture seule ─────────────────────────────
  const isLocked = ordre?.statut === 'CLOTURE';

  // ── Détection modifications non sauvées ───────────────────
  const isDirty = ordre
    ? formData.kilometrage_entree !== (ordre.kilometrage_entree?.toString() ?? '')
      || formData.description_travaux !== (ordre.description_travaux ?? '')
      || formData.statut !== ordre.statut
      || formData.notes_internes !== (ordre.notes_internes ?? '')
    : false;

  // ── Handler générique ──────────────────────────────────────
  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ── Auto-save du kilométrage (debounce 1.5s) ───────────────
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
      } catch {
        // Echec silencieux pour l'auto-save
      } finally {
        setAutoSaving(false);
      }
    }, 1500);
  };

  // ── Sauvegarde manuelle ────────────────────────────────────
  const handleSave = async () => {
    if (!ordre || !isDirty || isLocked) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        kilometrage_entree: formData.kilometrage_entree ? parseInt(formData.kilometrage_entree) : null,
        description_travaux: formData.description_travaux,
        statut: formData.statut,
        notes_internes: formData.notes_internes,
      };
      const updated = await updateOrdre(ordre.id, payload);
      setOrdre(updated);
      setFormData(initFormData(updated));
    } catch (err: any) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ── Génération PDF ─────────────────────────────────────────
  const handleGeneratePdf = async () => {
    if (!parametres) return;
    setGeneratingPdf(true);
    try {
      await generateOrPdf('or-pdf-template', `${ordre?.numero ?? 'OR'}.pdf`);
    } catch (err: any) {
      setSaveError(`Erreur PDF : ${err.message}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // ── Annuler les modifications ──────────────────────────────
  const handleCancel = () => {
    if (!ordre) return;
    setFormData(initFormData(ordre));
    setSaveError(null);
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

        {/* ── 2. INFORMATIONS SAISIES (kilométrage + statut) ── */}
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
          <div className="ore-card__head">Description des travaux demandés / effectués</div>
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
          <div className="ore-card__head">Pièces sorties du stock ({ordre.nombre_pieces})</div>
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
                  </tr>
                </thead>
                <tbody>
                  {ordre.pieces.map(p => (
                    <tr key={p.id}>
                      <td className="ore-table__center">{p.quantite}</td>
                      <td>{p.designation_snapshot}</td>
                      <td className="ore-table__mono">{p.reference_snapshot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── 5. INTERVENTIONS / MAIN D'ŒUVRE ── */}
        <div className="ore-card">
          <div className="ore-card__head">Temps passé / Interventions</div>
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
              <div className="ore-cloture-field">
                <span className="ore-cloture-field__label">Date de fin</span>
                <span className="ore-cloture-field__value">
                  {ordre.date_cloture ? formatDateCourt(ordre.date_cloture) : '—'}
                </span>
              </div>
              <div className="ore-cloture-field">
                <span className="ore-cloture-field__label">Km / h sortie</span>
                <span className="ore-cloture-field__value">
                  {ordre.kilometrage_sortie ? `${ordre.kilometrage_sortie.toLocaleString('fr-FR')} km` : '—'}
                </span>
              </div>
              <div className="ore-cloture-field">
                <span className="ore-cloture-field__label">Heure sortie</span>
                <span className="ore-cloture-field__value">
                  {ordre.heure_sortie || '—'}
                </span>
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

    </div>
  );
};

export default OrEditeur;
