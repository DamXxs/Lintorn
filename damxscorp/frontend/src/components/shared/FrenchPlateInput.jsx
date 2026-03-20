// /frontend/src/components/shared/FrenchPlateInput.jsx
import React from 'react';
import './FrenchPlate.css'; // Réutilise le CSS de FrenchPlate

/**
 * 🚗 FrenchPlateInput — Version interactive de FrenchPlate pour les formulaires
 *
 * Même visuel qu'une vraie plaque française SIV, mais la zone du numéro
 * est un <input> : l'utilisateur tape directement "dans" la plaque.
 * Plus besoin d'un champ séparé + d'un aperçu en dessous.
 *
 * Props :
 *   name        : string          — attribut name de l'input (obligatoire)
 *   value       : string          — valeur contrôlée
 *   onChange    : func            — handler de changement
 *   size        : 'sm'|'md'|'lg'  — taille (défaut: 'md')
 *   placeholder : string          — texte indicatif (défaut: 'AB-123-CD')
 *   hasError    : bool            — bordure rouge si erreur de validation
 */
const FrenchPlateInput = ({
  name,
  value,
  onChange,
  size        = 'md',
  placeholder = 'AB-123-CD',
  hasError    = false,
}) => {
  return (
    <div
      className={[
        'french-plate',
        `french-plate--${size}`,
        'french-plate--editable',
        hasError ? 'french-plate--error' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* ── Bande bleue EU à gauche ── */}
      <div className="french-plate__eu">
        <span className="french-plate__eu-stars" aria-hidden="true">★★★</span>
        <span className="french-plate__eu-letter">F</span>
      </div>

      {/* ── Zone de saisie ── */}
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="french-plate__input"
        maxLength={10}
        autoComplete="off"
        spellCheck={false}
      />

      {/* ── Bande bleue à droite ── */}
      <div className="french-plate__region"></div>
    </div>
  );
};

export default FrenchPlateInput;
