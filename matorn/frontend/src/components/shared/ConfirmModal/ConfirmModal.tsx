// /frontend/src/components/shared/ConfirmModal/ConfirmModal.tsx

import React, { useEffect } from 'react';
import './ConfirmModal.css';

/**
 * 🔔 CONFIRMMODAL — Modale de confirmation réutilisable
 *
 * Remplace tous les window.confirm() de l'appli par une vraie modale stylée.
 *
 * Props :
 *   isOpen       {boolean}                        — Affiche ou cache la modale
 *   title        {string}                         — Titre principal
 *   message      {string}                         — Texte explicatif (optionnel)
 *   variant      {'danger' | 'warning' | 'info'}  — Couleur du bouton confirmer
 *   labelConfirm {string}                         — Texte bouton confirmer (défaut : "Confirmer")
 *   labelCancel  {string}                         — Texte bouton annuler  (défaut : "Annuler")
 *   onConfirm    {function}                       — Callback si confirmation
 *   onCancel     {function}                       — Callback si annulation / fermeture
 *
 * Exemple d'utilisation :
 *   <ConfirmModal
 *     isOpen={showConfirm}
 *     title="Déclôturer l'OR ?"
 *     message="L'OR repassera en statut En cours."
 *     variant="danger"
 *     labelConfirm="Déclôturer"
 *     onConfirm={handleDecloturer}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */

// ── Type des props ─────────────────────────────────────────────────────────
// TypeScript oblige à déclarer exactement ce que le composant accepte.
// Si on passe une prop inconnue ou du mauvais type → erreur immédiate.
type ConfirmModalProps = {
  isOpen:        boolean;
  title:         string;
  message?:      string;                        // optionnel (le ? le signifie)
  variant?:      'danger' | 'warning' | 'info'; // union de types : seulement ces 3 valeurs
  labelConfirm?: string;
  labelCancel?:  string;
  onConfirm:     () => void;                    // fonction qui ne retourne rien
  onCancel:      () => void;
};

// ── Composant ──────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  variant      = 'danger',
  labelConfirm = 'Confirmer',
  labelCancel  = 'Annuler',
  onConfirm,
  onCancel,
}) => {

  // ── Fermeture via touche Échap ───────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);

    // Nettoyage : retire l'écouteur quand la modale se ferme
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // ── Bloque le scroll du body quand la modale est ouverte ────
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ── Ne rien rendre si fermée ─────────────────────────────────
  if (!isOpen) return null;

  return (
    // Overlay sombre — clic dessus = fermeture
    <div
      className="confirm-modal__overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Boîte centrale — stopPropagation évite que le clic sur la boîte
          ne remonte jusqu'à l'overlay et ferme la modale par erreur */}
      <div
        className="confirm-modal__box"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── En-tête : titre + croix ── */}
        <div className="confirm-modal__header">
          <h2 className="confirm-modal__title" id="confirm-modal-title">
            {title}
          </h2>
          <button
            className="confirm-modal__close"
            onClick={onCancel}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* ── Corps : message (affiché seulement si fourni) ── */}
        {message && (
          <div className="confirm-modal__body">
            <p className="confirm-modal__message">{message}</p>
          </div>
        )}

        {/* ── Pied : boutons ── */}
        <div className="confirm-modal__footer">
          <button
            className="confirm-modal__btn confirm-modal__btn--cancel"
            onClick={onCancel}
          >
            {labelCancel}
          </button>
          <button
            className={`confirm-modal__btn confirm-modal__btn--confirm confirm-modal__btn--${variant}`}
            onClick={onConfirm}
          >
            {labelConfirm}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;