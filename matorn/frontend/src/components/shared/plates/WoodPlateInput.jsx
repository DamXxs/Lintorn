// /frontend/src/components/shared/plates/WoodPlateInput.jsx
import React from 'react';
import './WoodPlateInput.css';

/**
 * ⛵ WoodPlateInput — Plaque marine style bois flotté
 *
 * Utilisée pour les bateaux, jetskis, voiliers.
 *
 * 🆕 Largeur adaptative : la plaque grandit avec le nom du bateau,
 * jusqu'à atteindre le bord du conteneur parent.
 * Technique : "ghost span" via display: inline-grid + ::after.
 *
 * Props : identiques à MetalPlateInput / FrenchPlateInput
 */
const WoodPlateInput = ({
  value,
  name,
  onChange,
  size        = 'md',
  placeholder = 'NOM / IMMAT',
  hasError    = false,
  readOnly    = false,
}) => {
  if (readOnly && !value) return null;

  const displayValue = readOnly ? (value ? value.toUpperCase() : '') : (value || '');

  // 🆕 Le fantôme reprend le placeholder si vide pour garder une largeur min cohérente
  const ghostValue = displayValue || placeholder || ' ';

  return (
    <div
      className={[
        'wood-plate',
        `wood-plate--${size}`,
        !readOnly ? 'wood-plate--editable' : '',
        hasError   ? 'wood-plate--error'    : '',
      ].filter(Boolean).join(' ')}
      title={readOnly && value ? `Immatriculation marine : ${value.toUpperCase()}` : undefined}
    >
      {/* 🆕 Wrapper adaptatif via data-value et pseudo ::after */}
      <div
        className="wood-plate__input-wrapper"
        data-value={ghostValue}
      >
        <input
          type="text"
          name={name}
          value={displayValue}
          onChange={readOnly ? undefined : onChange}
          placeholder={readOnly ? undefined : placeholder}
          className="wood-plate__input"
          maxLength={50}            /* 🆕 augmenté pour les noms longs */
          autoComplete="off"
          spellCheck={false}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
        />
      </div>
    </div>
  );
};

export default WoodPlateInput;