// /frontend/src/components/shared/Modal.jsx
import React from 'react';
import { X } from '../../utils/icons';
import './Modal.css';

/**
 * 🪟 Modal — Coquille vide réutilisable
 *
 * Gère : overlay (fond flou), boîte centrée (taille dans Modal.css),
 *        header (titre + bouton fermer), zone scrollable, footer sticky.
 *
 * La taille (max-width, max-height) est définie UNE SEULE FOIS dans Modal.css.
 * Pour changer la taille de toutes les modales → modifier Modal.css.
 *
 * Props :
 *   title      : texte du titre (string)
 *   titleIcon  : icône React avant le titre (optionnel)
 *   onClose    : fonction au clic sur X ou l'overlay
 *   children   : contenu principal (scrollable) — les champs du formulaire
 *   footer     : boutons d'action (Annuler / Enregistrer) — sticky en bas
 *
 * Usage :
 *   <Modal
 *     title="Nouveau client"
 *     titleIcon={<UserPlus size={15}/>}
 *     onClose={onClose}
 *     footer={<>
 *       <button className="form-btn form-btn--cancel" onClick={onClose}>Annuler</button>
 *       <button className="form-btn form-btn--save" type="submit">Créer</button>
 *     </>}
 *   >
 *     <form onSubmit={handleSubmit} noValidate>
 *       ... champs spécifiques à ce formulaire ...
 *     </form>
 *   </Modal>
 */
const Modal = ({ title, titleIcon, onClose, children, footer }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="modal-header">
          <h2 className="modal-title">
            {titleIcon && <span className="modal-title__icon">{titleIcon}</span>}
            {title}
          </h2>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        {/* CONTENU (scrollable) — children = JSX spécifique à chaque formulaire */}
        <div className="modal-inner">
          {children}
        </div>

        {/* FOOTER sticky — footer = boutons spécifiques à chaque formulaire */}
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
