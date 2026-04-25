// /frontend/src/components/shared/plates/MetalPlateInput.jsx
import React from 'react';
import './MetalPlateInput.css';

/**
 * 🔧 MetalPlateInput — Plaque d'identification métallique (alu brossé)
 *
 * Utilisée pour les véhicules sans plaque française standard :
 * motoculture, tracteurs, engins agricoles.
 *
 * Même API que FrenchPlateInput pour être interchangeable dans PlateSelector.
 *
 * Props :
 *   value       : string          — numéro d'identification
 *   name        : string          — attribut name (utile en mode saisie)
 *   onChange    : func            — handler de changement
 *   size        : 'sm'|'md'|'lg'  — taille d'affichage (défaut: 'md')
 *   placeholder : string          — texte indicatif
 *   hasError    : bool            — bordure rouge si erreur
 *   readOnly    : bool            — true = affichage pur (défaut: false)
 */
const MetalPlateInput = ({
  value,
  name,
  onChange,
  size        = 'md',
  placeholder = 'N° SÉRIE',
  hasError    = false,
  readOnly    = false,
}) => {
  // En mode affichage sans valeur, on n'affiche rien
  if (readOnly && !value) return null;

  return (
    <div
      className={[
        'metal-plate',
        `metal-plate--${size}`,
        !readOnly ? 'metal-plate--editable' : '',
        hasError   ? 'metal-plate--error'    : '',
      ].filter(Boolean).join(' ')}
      title={readOnly && value ? `N° d'identification : ${value.toUpperCase()}` : undefined}
    >
      {/* ── Rivets décoratifs aux 4 coins ── */}
      <span className="metal-plate__rivet metal-plate__rivet--tl" aria-hidden="true"></span>
      <span className="metal-plate__rivet metal-plate__rivet--tr" aria-hidden="true"></span>
      <span className="metal-plate__rivet metal-plate__rivet--bl" aria-hidden="true"></span>
      <span className="metal-plate__rivet metal-plate__rivet--br" aria-hidden="true"></span>

      {/* ── Zone de saisie / affichage ── */}
      <input
        type="text"
        name={name}
        value={readOnly ? (value ? value.toUpperCase() : '') : (value || '')}
        onChange={readOnly ? undefined : onChange}
        placeholder={readOnly ? undefined : placeholder}
        className="metal-plate__input"
        maxLength={20}
        autoComplete="off"
        spellCheck={false}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
      />
    </div>
  );
};

export default MetalPlateInput;