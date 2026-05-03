// /frontend/src/components/shared/plates/MetalPlateInput.jsx
import React from 'react';
import './MetalPlateInput.css';

/**
 * 🔧 MetalPlateInput — Plaque d'identification métallique (alu brossé)
 *
 * Utilisée pour les véhicules sans plaque française standard :
 * motoculture, engins agricoles, tondeuses, etc.
 *
 * 🆕 Largeur adaptative : la plaque grandit avec le contenu tapé,
 * jusqu'à atteindre le bord du conteneur parent.
 * Technique : "ghost span" via display: inline-grid + ::after.
 *
 * Props :
 *   value       : string          — numéro d'identification
 *   name        : string          — attribut name
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
  if (readOnly && !value) return null;

  // 🆕 Valeur affichée (uppercase en readOnly)
  const displayValue = readOnly ? (value ? value.toUpperCase() : '') : (value || '');

  // 🆕 Le fantôme doit avoir au minimum le placeholder pour ne pas s'effondrer
  // quand l'input est vide. On utilise un espace insécable de la même largeur.
  const ghostValue = displayValue || placeholder || ' ';

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
      {/* Rivets décoratifs */}
      <span className="metal-plate__rivet metal-plate__rivet--tl" aria-hidden="true"></span>
      <span className="metal-plate__rivet metal-plate__rivet--tr" aria-hidden="true"></span>
      <span className="metal-plate__rivet metal-plate__rivet--bl" aria-hidden="true"></span>
      <span className="metal-plate__rivet metal-plate__rivet--br" aria-hidden="true"></span>

      {/*
        🆕 Wrapper adaptatif : data-value alimente le pseudo ::after
        qui dimensionne la cellule grid → l'input suit cette largeur
      */}
      <div
        className="metal-plate__input-wrapper"
        data-value={ghostValue}
      >
        <input
          type="text"
          name={name}
          value={displayValue}
          onChange={readOnly ? undefined : onChange}
          placeholder={readOnly ? undefined : placeholder}
          className="metal-plate__input"
          maxLength={50}            /* 🆕 augmenté pour les noms à rallonge */
          autoComplete="off"
          spellCheck={false}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
        />
      </div>
    </div>
  );
};

export default MetalPlateInput;