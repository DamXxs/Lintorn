// /frontend/src/components/shared/Modals/Modal.jsx
//
// ══════════════════════════════════════════════════════════════════
//  MODAL — Coquille réutilisable pour TOUTES les modales de l'app
//
//  STRUCTURE INTERNE :
//  ┌─────────────────────────────────────┐
//  │  HEADER  (titre + icône + X fixe)  │ ← géré ici, X = 22px fixe
//  ├─────────────────────────────────────┤
//  │  CONTENU (modal-inner, scrollable) │ ← children du composant
//  ├─────────────────────────────────────┤
//  │  FOOTER  (boutons d'action)        │ ← prop footer du composant
//  └─────────────────────────────────────┘
//
//  PROPS :
//  title        → texte du titre (string)
//  titleIcon    → icône React avant le titre (optionnel)
//  onClose      → fonction au clic sur X ou l'overlay
//  children     → contenu principal scrollable
//  footer       → boutons d'action sticky en bas
//  customHeader → JSX complet qui remplace le header standard
//                 (ex: ClientDetail avec avatar + initiales)
//  boxClassName → classe CSS supplémentaire sur modal-box
//                 ex: "modal-box--wide" pour 780px max
//
//  BOUTONS FOOTER — classes disponibles dans Modal.css :
//  modal-btn                → base commune (toujours présente)
//  modal-btn--primary       → bleu  (Modifier, Enregistrer...)
//  modal-btn--danger        → rouge (Supprimer)
//  modal-btn--success       → vert  (Valider, Créer...)
//  modal-btn--cancel        → gris  (Annuler, Fermer)
//  modal-btn--ghost         → transparent avec bordure (Copier...)
//
//  MISE EN PAGE DU FOOTER — classes sur la div wrappant les boutons :
//  modal-footer--row        → boutons côte à côte (défaut)
//  modal-footer--col        → 2 rangées (ex: RDV en haut, Modifier/Supprimer en bas)
// ══════════════════════════════════════════════════════════════════

import React from 'react';
import { X } from '../../../utils/icons';
import './Modal.css';

const Modal = ({ title, titleIcon, onClose, children, footer, customHeader = null, boxClassName = '' }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-box${boxClassName ? ` ${boxClassName}` : ''}`}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── HEADER ───────────────────────────────────────────────
            Deux variantes :
            1. customHeader → JSX fourni par le composant parent
               (ex: ClientDetail avec avatar circulaire)
            2. Standard     → titre centré + icône + bouton X 22px
        ─────────────────────────────────────────────────────────── */}
        {customHeader ? (
          customHeader
        ) : (
          <div className="modal-header">
            {/* Spacer invisible = même largeur que le X pour centrer le titre */}
            <div className="modal-header__spacer" />
            <h2 className="modal-title">
              {titleIcon && <span className="modal-title__icon">{titleIcon}</span>}
              {title}
            </h2>
            {/* X fixé à 22px — ne pas passer de size en prop, c'est voulu */}
            <button className="modal-close" onClick={onClose} type="button">
              <X size={22} />
            </button>
          </div>
        )}

        {/* ── CONTENU ──────────────────────────────────────────────
            Zone scrollable — children = JSX spécifique à chaque modal
            (formulaires, fiches, tableaux...)
        ─────────────────────────────────────────────────────────── */}
        <div className="modal-inner">
          {children}
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────
            Sticky en bas — footer = boutons passés par le parent
            Classes disponibles sur les boutons : voir en-tête de fichier
            Classes de mise en page : modal-footer--row / modal-footer--col
        ─────────────────────────────────────────────────────────── */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}

      </div>
    </div>
  );
};

export default Modal;