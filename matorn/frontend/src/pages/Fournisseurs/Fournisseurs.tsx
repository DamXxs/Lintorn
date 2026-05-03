// /frontend/src/pages/Fournisseurs/Fournisseurs.tsx
import React, { useState, useEffect, useCallback } from 'react';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import PageHeader   from '../../components/shared/PageHeader';
import { Factory } from '../../utils/icons';
import CardFournisseur    from './CardFournisseur';
import ModalFournisseur   from './ModalFournisseur';
import ModalEmailPreRempli from './ModalEmailPreRempli';
import {
  fetchFournisseurs,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
  patchFournisseur,
  Fournisseur,
  FournisseurFormData,
} from './fournisseurService';
import './Fournisseurs.css';
import '../../components/shared/list-page.css';

// ── TYPES LOCAUX ──────────────────────────────────────────────────

type Filtre = 'tous' | 'favoris' | 'inactifs';

interface ModalEmailState {
  fournisseurId:  number;
  fournisseurNom: string;
}

// ── COMPOSANT ─────────────────────────────────────────────────────

const Fournisseurs: React.FC = () => {

  // ── État principal ───────────────────────────────────────────────
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading]           = useState(true);
  const [erreur, setErreur]             = useState<string | null>(null);

  // ── Filtres & recherche ──────────────────────────────────────────
  const [filtre, setFiltre]       = useState<Filtre>('tous');
  const [recherche, setRecherche] = useState('');

  // ── Modales ──────────────────────────────────────────────────────
  const [modalForm, setModalForm]   = useState(false);
  const [fournisseurEdite, setFournisseurEdite] = useState<Fournisseur | null>(null);
  const [modalEmail, setModalEmail] = useState<ModalEmailState | null>(null);

  // ── Confirmation suppression ─────────────────────────────────────
  const [aSupprimer, setASupprimer] = useState<Fournisseur | null>(null);
  const [suppression, setSuppression] = useState(false);
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

  // ── Chargement ───────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    try {
      const data = await fetchFournisseurs();
      setFournisseurs(data);
    } catch (err: any) {
      setErreur(err.message || 'Impossible de charger les fournisseurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  // ── Filtrage ─────────────────────────────────────────────────────
  const fournisseursFiltres = fournisseurs
    .filter(f => {
      if (filtre === 'favoris')  return f.est_favori;
      if (filtre === 'inactifs') return !f.actif;
      return true; // 'tous'
    })
    .filter(f => {
      const q = recherche.toLowerCase();
      return (
        f.nom.toLowerCase().includes(q)         ||
        f.email.toLowerCase().includes(q)       ||
        f.contact_nom.toLowerCase().includes(q) ||
        f.categorie.toLowerCase().includes(q)
      );
    });

  // ── Handlers CRUD ────────────────────────────────────────────────
  const handleNouveauFournisseur = () => {
    setFournisseurEdite(null);
    setModalForm(true);
  };

  const handleEditer = (f: Fournisseur) => {
    setFournisseurEdite(f);
    setModalForm(true);
  };

  const handleSauvegarder = async (formData: FournisseurFormData) => {
    if (fournisseurEdite?.id) {
      await updateFournisseur(fournisseurEdite.id, formData);
    } else {
      await createFournisseur(formData);
    }
    await charger();
  };

  const handleToggleFavori = async (f: Fournisseur) => {
    try {
      await patchFournisseur(f.id, { est_favori: !f.est_favori });
      await charger();
    } catch (err: any) {
      setErreur(err.message);
    }
  };

  const handleDemandeSupprimer = (f: Fournisseur) => {
    setASupprimer(f);
    setErreurSuppression(null);
  };

  const handleConfirmerSuppression = async () => {
    if (!aSupprimer) return;
    setSuppression(true);
    setErreurSuppression(null);
    try {
      await deleteFournisseur(aSupprimer.id);
      setASupprimer(null);
      await charger();
    } catch (err: any) {
      setErreurSuppression(err.message);
    } finally {
      setSuppression(false);
    }
  };

  // ── Handler email de commande ────────────────────────────────────
  const handleEmail = (f: Fournisseur) => {
    setModalEmail({ fournisseurId: f.id, fournisseurNom: f.nom });
  };

  // ── Compteurs pour les onglets ───────────────────────────────────
  const nbFavoris  = fournisseurs.filter(f => f.est_favori).length;
  const nbInactifs = fournisseurs.filter(f => !f.actif).length;

  // ── Rendu ────────────────────────────────────────────────────────
  return (
    <div className="list-page">

      {/* En-tête */}
      <PageHeader
        title="Fournisseurs"
        count={fournisseursFiltres.length}
        countLabel="fournisseur"
        onAdd={handleNouveauFournisseur}
        addLabel="Nouveau fournisseur"
        addIcon={<Factory size={16} />}
      />

      {/* Barre de recherche */}
      <div className="fournisseurs-toolbar">
        <input
          className="fournisseurs-search"
          type="text"
          placeholder="🔍 Rechercher un fournisseur…"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
        />

        {/* Filtres */}
        <div className="fournisseurs-filtres">
          {(['tous', 'favoris', 'inactifs'] as Filtre[]).map(f => (
            <button
              key={f}
              className={`fournisseurs-filtre-btn ${filtre === f ? 'fournisseurs-filtre-btn--actif' : ''}`}
              onClick={() => setFiltre(f)}
            >
              {f === 'tous'     && `Tous (${fournisseurs.length})`}
              {f === 'favoris'  && `⭐ Favoris (${nbFavoris})`}
              {f === 'inactifs' && `Inactifs (${nbInactifs})`}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu principal */}
      {loading && <LoadingState message="Chargement des fournisseurs…" />}

      {!loading && erreur && (
        <ErrorState message={erreur} onRetry={charger} />
      )}

      {!loading && !erreur && fournisseursFiltres.length === 0 && (
        <div className="fournisseurs-vide">
          {recherche
            ? `Aucun fournisseur ne correspond à "${recherche}".`
            : filtre === 'favoris'
              ? 'Aucun fournisseur en favori.'
              : filtre === 'inactifs'
                ? 'Aucun fournisseur inactif.'
                : 'Aucun fournisseur. Commencez par en ajouter un !'}
        </div>
      )}

      {!loading && !erreur && fournisseursFiltres.length > 0 && (
        <div className="fournisseurs-grid">
          {fournisseursFiltres.map(f => (
            <CardFournisseur
              key={f.id}
              fournisseur={f}
              onEdit={handleEditer}
              onDelete={handleDemandeSupprimer}
              onToggleFavori={handleToggleFavori}
              onEmail={handleEmail}
            />
          ))}
        </div>
      )}

      {/* Modal formulaire (création / édition) */}
      {modalForm && (
        <ModalFournisseur
          fournisseur={fournisseurEdite}
          onSave={handleSauvegarder}
          onClose={() => setModalForm(false)}
        />
      )}

      {/* Modal email pré-rempli */}
      {modalEmail && (
        <ModalEmailPreRempli
          fournisseurId={modalEmail.fournisseurId}
          fournisseurNom={modalEmail.fournisseurNom}
          onClose={() => setModalEmail(null)}
        />
      )}

      {/* Modal confirmation suppression */}
      {aSupprimer && (
        <div className="fournisseurs-overlay" onClick={() => setASupprimer(null)}>
          <div className="fournisseurs-confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>🗑️ Supprimer ce fournisseur ?</h3>
            <p>
              <strong>{aSupprimer.nom}</strong> sera déplacé dans la corbeille.
              {aSupprimer.nb_pieces > 0 && (
                <span className="fournisseurs-confirm-warning">
                  {' '}⚠️ {aSupprimer.nb_pieces} pièce{aSupprimer.nb_pieces > 1 ? 's' : ''} liée{aSupprimer.nb_pieces > 1 ? 's' : ''} à ce fournisseur.
                </span>
              )}
            </p>
            {erreurSuppression && (
              <p className="fournisseurs-confirm-error">⚠️ {erreurSuppression}</p>
            )}
            <div className="fournisseurs-confirm-actions">
              <button
                className="form-btn form-btn--cancel"
                onClick={() => setASupprimer(null)}
                disabled={suppression}
              >
                Annuler
              </button>
              <button
                className="form-btn form-btn--danger"
                onClick={handleConfirmerSuppression}
                disabled={suppression}
              >
                {suppression ? 'Suppression…' : '🗑️ Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Fournisseurs;