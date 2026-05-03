// /frontend/src/pages/Archives/ArchivesPage.tsx
//
// ══════════════════════════════════════════════════════════════════
//  PAGE ARCHIVES & CORBEILLE
//
//  Deux onglets :
//    🗑️ Corbeille  → éléments soft-deleted (purge auto dans 8 jours)
//    📦 Archives   → éléments archivés (conservation longue durée)
//
//  Actions disponibles :
//    ♻️  Restaurer  → remet l'élément dans les vues normales
//    💀 Purger     → suppression DÉFINITIVE (avec double confirmation)
//
//  TODO: Vérifier le rôle utilisateur avant d'autoriser la purge.
//        (Système de permissions à implémenter ultérieurement)
// ══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchArchives,
  fetchTypesArchivables,
  restaurerElement,
  purgerElement,
  ElementArchive,
  TypeArchivable,
} from './archiveService';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import './ArchivesPage.css';
import '../../components/shared/list-page.css';

// ── TYPES LOCAUX ──────────────────────────────────────────────────

type OngletActif = 'corbeille' | 'archive';

interface ConfirmPurge {
  element: ElementArchive;
}

// ── HELPERS ───────────────────────────────────────────────────────

/**
 * Calcule les jours restants avant purge automatique (8 jours).
 * Retourne null si l'élément est en archives (pas de purge auto).
 */
const calcJoursRestants = (deletedAt: string | null): number | null => {
  if (!deletedAt) return null;
  const msParJour = 1000 * 60 * 60 * 24;
  const joursPasses = Math.floor(
    (Date.now() - new Date(deletedAt).getTime()) / msParJour
  );
  return Math.max(0, 8 - joursPasses);
};

/**
 * Formate une date ISO en "12 jan. 2026 à 14h30"
 */
const formatDate = (isoString: string | null): string => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ── COMPOSANT BADGE JOURS RESTANTS ────────────────────────────────

const JoursRestantsBadge: React.FC<{ jours: number | null }> = ({ jours }) => {
  if (jours === null) {
    return <span className="arc-jours arc-jours--none">—</span>;
  }
  if (jours === 0) {
    return <span className="arc-jours arc-jours--urgent">⏰ À purger</span>;
  }
  if (jours <= 2) {
    return <span className="arc-jours arc-jours--urgent">⚠️ {jours}j restants</span>;
  }
  if (jours <= 4) {
    return <span className="arc-jours arc-jours--warn">{jours}j restants</span>;
  }
  return <span className="arc-jours arc-jours--ok">{jours}j restants</span>;
};

// ── COMPOSANT MODAL CONFIRMATION PURGE ────────────────────────────

interface ModalConfirmPurgeProps {
  element: ElementArchive;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const ModalConfirmPurge: React.FC<ModalConfirmPurgeProps> = ({
  element,
  onConfirm,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="arc-confirm-overlay" onClick={onCancel}>
      <div
        className="arc-confirm-box"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="arc-confirm-icon">💀</span>
        <h2 className="arc-confirm-title">Suppression définitive</h2>
        <p className="arc-confirm-text">
          Cette action est <strong>irréversible</strong>. L'élément sera
          supprimé définitivement de la base de données, sans possibilité de récupération.
        </p>
        <div className="arc-confirm-element">
          {element.type_libelle} — {element.libelle_principal}
          {element.libelle_secondaire && (
            <><br /><small>{element.libelle_secondaire}</small></>
          )}
        </div>
        <p className="arc-confirm-text" style={{ fontSize: '12px', color: '#c0392b' }}>
          ⚠️ Êtes-vous absolument certain ? Cette action ne peut pas être annulée.
        </p>
        <div className="arc-confirm-actions">
          <button
            className="arc-confirm-btn arc-confirm-btn--cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className="arc-confirm-btn arc-confirm-btn--confirm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Suppression...' : '💀 Supprimer définitivement'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── COMPOSANT PRINCIPAL ────────────────────────────────────────────

const ArchivesPage: React.FC = () => {
  // ── État ────────────────────────────────────────────────────────
  const [onglet, setOnglet] = useState<OngletActif>('corbeille');
  const [elements, setElements] = useState<ElementArchive[]>([]);
  const [types, setTypes] = useState<TypeArchivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtreType, setFiltreType] = useState<string>('TOUS');
  const [confirmPurge, setConfirmPurge] = useState<ConfirmPurge | null>(null);
  const [actionEnCours, setActionEnCours] = useState<number | null>(null);

  // ── Chargement ───────────────────────────────────────────────────
  const charger = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dataElements, dataTypes] = await Promise.all([
        fetchArchives({ etat: onglet }),
        fetchTypesArchivables(),
      ]);
      setElements(dataElements.results);
      setTypes(dataTypes);
    } catch {
      setError('Impossible de charger les données. Vérifie que le backend tourne.');
    } finally {
      setLoading(false);
    }
  }, [onglet]);

  useEffect(() => {
    charger();
    setFiltreType('TOUS'); // Reset filtre au changement d'onglet
  }, [charger]);

  // ── Filtrage local par type ───────────────────────────────────────
  const elementsFiltres = filtreType === 'TOUS'
    ? elements
    : elements.filter(e => e.type === filtreType);

  // ── Compteurs pour les onglets ────────────────────────────────────
  const nbCorbeille = elements.filter(e => e.etat === 'corbeille').length;
  const nbArchives  = elements.filter(e => e.etat === 'archive').length;

  // ── Action : Restaurer ────────────────────────────────────────────
  const handleRestaurer = async (element: ElementArchive) => {
    setActionEnCours(element.id);
    try {
      await restaurerElement(element.type, element.id);
      await charger();
    } catch {
      alert('❌ Erreur lors de la restauration');
    } finally {
      setActionEnCours(null);
    }
  };

  // ── Action : Purger (avec confirmation) ───────────────────────────
  const handlePurger = async () => {
    if (!confirmPurge) return;
    const { element } = confirmPurge;
    setActionEnCours(element.id);
    try {
      await purgerElement(element.type, element.id);
      setConfirmPurge(null);
      await charger();
    } catch {
      alert('❌ Erreur lors de la purge');
      setConfirmPurge(null);
    } finally {
      setActionEnCours(null);
    }
  };

  // ── Rendu ─────────────────────────────────────────────────────────
  return (
    <div className="list-page">

      {/* ── ONGLETS ──────────────────────────────────────────────── */}
      <div className="archives-tabs">
        <button
          className={`archives-tab archives-tab--corbeille ${onglet === 'corbeille' ? 'archives-tab--active' : ''}`}
          onClick={() => setOnglet('corbeille')}
        >
          🗑️ Corbeille
          {nbCorbeille > 0 && (
            <span className="archives-tab__count">{nbCorbeille}</span>
          )}
        </button>
        <button
          className={`archives-tab archives-tab--archives ${onglet === 'archive' ? 'archives-tab--active' : ''}`}
          onClick={() => setOnglet('archive')}
        >
          📦 Archives
          {nbArchives > 0 && (
            <span className="archives-tab__count">{nbArchives}</span>
          )}
        </button>
      </div>

      {/* ── CONTENU ──────────────────────────────────────────────── */}
      <div className="archives-content">

        {/* Bandeau informatif selon l'onglet */}
        <div className={`archives-banner archives-banner--${onglet}`}>
          <span className="archives-banner__icon">
            {onglet === 'corbeille' ? '⏳' : 'ℹ️'}
          </span>
          <span>
            {onglet === 'corbeille'
              ? 'Les éléments en corbeille sont supprimés définitivement après 8 jours. Réstauration ou purge possible manuellement !.'
              : 'Les archives conservent les données pour consultation. Les factures et documents légaux sont archivés automatiquement après 13 mois.'
            }
          </span>
        </div>

        {/* États chargement / erreur */}
        {loading && <LoadingState message="Chargement des données..." />}
        {error && !loading && <ErrorState message={error} onRetry={charger} />}

        {!loading && !error && (
          <>
            {/* ── FILTRES PAR TYPE ─────────────────────────────── */}
            {types.length > 0 && (
              <div className="archives-filters">
                <button
                  className={`archives-filter-btn ${filtreType === 'TOUS' ? 'archives-filter-btn--active' : ''}`}
                  onClick={() => setFiltreType('TOUS')}
                >
                  Tous ({elements.length})
                </button>
                {types.map(t => {
                  const nb = elements.filter(e => e.type === t.cle).length;
                  if (nb === 0) return null;
                  return (
                    <button
                      key={t.cle}
                      className={`archives-filter-btn ${filtreType === t.cle ? 'archives-filter-btn--active' : ''}`}
                      onClick={() => setFiltreType(t.cle)}
                    >
                      {t.libelle} ({nb})
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── TABLEAU ─────────────────────────────────────── */}
            {elementsFiltres.length === 0 ? (
              <div className="archives-empty">
                <span className="archives-empty__icon">
                  {onglet === 'corbeille' ? '🗑️' : '📦'}
                </span>
                <p className="archives-empty__title">
                  {onglet === 'corbeille' ? 'Corbeille vide' : 'Aucune archive'}
                </p>
                <p className="archives-empty__sub">
                  {filtreType !== 'TOUS'
                    ? 'Aucun élément de ce type ici.'
                    : onglet === 'corbeille'
                      ? 'Aucun élément en attente de suppression.'
                      : 'Aucun document archivé pour le moment.'
                  }
                </p>
              </div>
            ) : (
              <div className="archives-table-wrap">
                <table className="archives-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Élément</th>
                      <th>Date</th>
                      {onglet === 'corbeille' && <th>Purge auto</th>}
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elementsFiltres.map(element => {
                      const dateAction = element.deleted_at || element.archived_at;
                      const jours = onglet === 'corbeille'
                        ? calcJoursRestants(element.deleted_at)
                        : null;
                      const enCours = actionEnCours === element.id;

                      return (
                        <tr key={`${element.type}-${element.id}`}>
                          {/* Type */}
                          <td className="arc-cell--type">
                            <span className="arc-type-badge">
                              {element.type_libelle}
                            </span>
                          </td>

                          {/* Libellé principal + secondaire */}
                          <td className="arc-cell--libelle">
                            <span className="arc-libelle-principal">
                              {element.libelle_principal}
                            </span>
                            {element.libelle_secondaire && (
                              <span className="arc-libelle-secondaire">
                                {element.libelle_secondaire}
                              </span>
                            )}
                          </td>

                          {/* Date de mise en corbeille / archives */}
                          <td className="arc-cell--date">
                            {formatDate(dateAction)}
                          </td>

                          {/* Jours restants (corbeille uniquement) */}
                          {onglet === 'corbeille' && (
                            <td>
                              <JoursRestantsBadge jours={jours} />
                            </td>
                          )}

                          {/* Actions */}
                          <td className="arc-cell--actions">
                            <div className="arc-actions">

                              {/* Restaurer — disponible dans les deux onglets */}
                              <button
                                className="arc-btn arc-btn--restore"
                                onClick={() => handleRestaurer(element)}
                                disabled={enCours}
                                title={`Restaurer ${element.libelle_principal}`}
                              >
                                {enCours ? '⏳' : '♻️'} Restaurer
                              </button>

                              {/* Purger — uniquement depuis la corbeille */}
                              {/* TODO: Restreindre au rôle SUPERUSER */}
                              {onglet === 'corbeille' && (
                                <button
                                  className="arc-btn arc-btn--purge"
                                  onClick={() => setConfirmPurge({ element })}
                                  disabled={enCours}
                                  title={`Supprimer définitivement ${element.libelle_principal}`}
                                >
                                  💀 Purger
                                </button>
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
          </>
        )}
      </div>

      {/* ── MODAL CONFIRMATION PURGE ──────────────────────────────── */}
      {confirmPurge && (
        <ModalConfirmPurge
          element={confirmPurge.element}
          onConfirm={handlePurger}
          onCancel={() => setConfirmPurge(null)}
        />
      )}

    </div>
  );
};

export default ArchivesPage;