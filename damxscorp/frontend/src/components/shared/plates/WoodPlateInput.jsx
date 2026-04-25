// /frontend/src/components/shared/plates/WoodPlateInput.jsx
import React from 'react';
import './WoodPlateInput.css';

/**
 * ⛵ WoodPlateInput — Plaque marine style bois flotté
 *
 * Utilisée pour les bateaux et jetskis.
 * Même API que FrenchPlateInput pour être interchangeable.
 *
 * Props : identiques à FrenchPlateInput
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
      <input
        type="text"
        name={name}
        value={readOnly ? (value ? value.toUpperCase() : '') : (value || '')}
        onChange={readOnly ? undefined : onChange}
        placeholder={readOnly ? undefined : placeholder}
        className="wood-plate__input"
        maxLength={20}
        autoComplete="off"
        spellCheck={false}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
      />
    </div>
  );
};

export default WoodPlateInput;