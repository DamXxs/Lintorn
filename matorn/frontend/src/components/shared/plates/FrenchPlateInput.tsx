// /frontend/src/components/shared/plates/FrenchPlateInput.tsx
import React from 'react';
import './FrenchPlateInput.css';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface FrenchPlateInputProps {
  value:        string;
  // Optionnels car inutiles en mode readOnly
  name?:        string;
  onChange?:    (e: React.ChangeEvent<HTMLInputElement>) => void;
  size?:        'sm' | 'md' | 'lg';
  placeholder?: string;
  hasError?:    boolean;
  readOnly?:    boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 🚗 FrenchPlateInput — Affichage ET saisie d'une plaque française (SIV)
 *
 * MODE AFFICHAGE (readOnly=true) :
 *   <FrenchPlateInput value="AB-123-CD" readOnly />
 *   → Visuel plaque, pas de saisie. name/onChange inutiles.
 *
 * MODE SAISIE (readOnly=false, défaut) :
 *   <FrenchPlateInput name="immatriculation" value={val} onChange={fn} />
 *   → L'utilisateur tape directement dans la plaque.
 */
const FrenchPlateInput: React.FC<FrenchPlateInputProps> = ({
  value,
  name,
  onChange,
  size        = 'md',
  placeholder = 'AB-123-CD',
  hasError    = false,
  readOnly    = false,
}) => {
  // En mode affichage, si pas de valeur → rien à afficher
  if (readOnly && !value) return null;

  return (
    <div
      className={[
        'french-plate',
        `french-plate--${size}`,
        !readOnly ? 'french-plate--editable' : '',
        hasError  ? 'french-plate--error'    : '',
      ].filter(Boolean).join(' ')}
      title={readOnly && value ? `Immatriculation : ${value.toUpperCase()}` : undefined}
    >
      {/* Bande bleue EU à gauche */}
      <div className="french-plate__eu">
        <span className="french-plate__eu-stars" aria-hidden="true">★★★</span>
        <span className="french-plate__eu-letter">F</span>
      </div>

      {/* Zone numéro */}
      <input
        type="text"
        name={name}
        value={readOnly ? (value ? value.toUpperCase() : '') : value}
        onChange={readOnly ? undefined : onChange}
        placeholder={readOnly ? undefined : placeholder}
        className="french-plate__input"
        maxLength={10}
        autoComplete="off"
        spellCheck={false}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
      />

      {/* Bande bleue à droite */}
      <div className="french-plate__region" />
    </div>
  );
};

export default FrenchPlateInput;
