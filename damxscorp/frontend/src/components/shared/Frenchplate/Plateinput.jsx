// /frontend/src/components/PlateInput.jsx
// 🆕 NOUVEAU FICHIER
// Wrapper intelligent qui bascule entre :
//   - FrenchPlateInput  (format actuel : AA-123-AA)
//   - OldFrenchPlateInput (formats pré-SIV : 1234 AB 75 ou 123 ABC 75)
// À utiliser partout à la place de FrenchPlateInput directement.

import { useState } from "react";
import FrenchPlateInput from "./FrenchPlateInput";
import OldFrenchPlateInput from "./OldFrenchPlateInput";
import "./PlateInput.css";

const PlateInput = ({ value = "", onChange, error }) => {

  // État du toggle : false = format actuel, true = ancien format
  const [isOldFormat, setIsOldFormat] = useState(false);

  // Quand on bascule, on remet la valeur à vide pour éviter
  // d'avoir une plaque d'un format dans un champ de l'autre format
  const handleToggle = () => {
    setIsOldFormat(prev => !prev);
    onChange({ target: { value: "" } }); // reset du champ
  };

  return (
    <div className="plate-input">

      {/* ── Toggle switch "Ancienne plaque" ────────────────────────── */}
      <div className="plate-input__toggle-row">
        <span className="plate-input__toggle-label">
          Ancienne plaque
        </span>

        {/* Le toggle switch : un input checkbox caché + un span stylisé */}
        <label className="plate-input__toggle">
          <input
            type="checkbox"
            checked={isOldFormat}
            onChange={handleToggle}
            className="plate-input__toggle-checkbox"
          />
          {/* C'est ce span qui sera stylisé en interrupteur visuel */}
          <span className="plate-input__toggle-slider" />
        </label>
      </div>

      {/* ── Champ de plaque selon le format actif ──────────────────── */}
      {isOldFormat ? (
        <OldFrenchPlateInput
          value={value}
          onChange={onChange}
          error={error}
        />
      ) : (
        <FrenchPlateInput
          value={value}
          onChange={onChange}
          error={error}
        />
      )}

    </div>
  );
};

export default PlateInput;