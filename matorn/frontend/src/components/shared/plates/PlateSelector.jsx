// /frontend/src/components/shared/plates/PlateSelector.jsx
import React, { useState, useEffect } from 'react';
import FrenchPlateInput    from './FrenchPlateInput';
import OldFrenchPlateInput from './OldFrenchPlateInput';
import MetalPlateInput     from './MetalPlateInput';
import WoodPlateInput      from './WoodPlateInput';
import './PlateSelector.css';

/**
 * 🧠 PlateSelector — Composant "cerveau" qui choisit la bonne plaque selon le véhicule
 *
 * Reçoit vehicleType et affiche automatiquement :
 *   - VOITURE / UTILITAIRE / CAMION / MOTO / SCOOTER → FrenchPlateInput (avec toggle SIV/ancienne)
 *   - MOTOCULTURE / TRACTEUR / ENGIN / QUAD         → MetalPlateInput
 *   - BATEAU / JETSKI                                → WoodPlateInput
 *   - Par défaut                                     → FrenchPlateInput
 *
 * Même API que les autres composants de plaque pour une utilisation simple :
 *
 *   <PlateSelector
 *     vehicleType={formData.vehicleType}
 *     name="plate"
 *     value={formData.plate}
 *     onChange={handleChange}
 *     hasError={Boolean(errors.plate)}
 *   />
 *
 * Props :
 *   vehicleType : string          — type de véhicule (depuis les référentiels)
 *   value       : string          — valeur de la plaque
 *   name        : string          — attribut name de l'input
 *   onChange    : func            — handler (reçoit un event { target: { name, value } })
 *   size        : 'sm'|'md'|'lg'  — taille d'affichage (défaut: 'md')
 *   hasError    : bool            — état d'erreur visuel
 *   readOnly    : bool            — mode affichage pur (défaut: false)
 */
const PlateSelector = ({
  vehicleType,
  value,
  name = 'plate',
  onChange,
  size     = 'md',
  hasError = false,
  readOnly = false,
}) => {

  // ── Catégorisation des types de véhicule ──────────────────────
  // On regroupe les types de véhicules en 3 familles visuelles.
  // Les codes correspondent aux valeurs des référentiels (ReferentielsContext).
  const getPlateFamily = (type) => {
    if (!type) return 'french';
    const t = type.toUpperCase();

    if (['BATEAU', 'JETSKI', 'VOILIER'].includes(t)) return 'wood';
    if (['MOTOCULTURE', 'ENGIN', 'ENGIN_AGRICOLE', 'TONDEUSE'].includes(t)) return 'metal';

    return 'french';
  };

  const family = getPlateFamily(vehicleType);

  // ── État local : toggle "ancienne plaque" (seulement en mode français) ──
  const [isOldFormat, setIsOldFormat] = useState(false);

  // Si on change de famille, on reset le toggle
  useEffect(() => {
    if (family !== 'french' && isOldFormat) {
      setIsOldFormat(false);
    }
  }, [family, isOldFormat]);

  // ── Bascule du toggle : on reset la valeur pour éviter les mélanges ──
  const handleToggle = () => {
    setIsOldFormat(prev => !prev);
    // On simule un event avec le bon name pour rester compatible avec handleChange
    if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  // ═══ MODE BOIS (bateaux / jetskis) ═══════════════════════════
  if (family === 'wood') {
    return (
      <div className="plate-selector">
        <WoodPlateInput
          name={name}
          value={value}
          onChange={onChange}
          size={size}
          hasError={hasError}
          readOnly={readOnly}
        />
      </div>
    );
  }

  // ═══ MODE MÉTAL (motoculture / engins) ═══════════════════════
  if (family === 'metal') {
    return (
      <div className="plate-selector">
        <MetalPlateInput
          name={name}
          value={value}
          onChange={onChange}
          size={size}
          hasError={hasError}
          readOnly={readOnly}
        />
      </div>
    );
  }

  // ═══ MODE FRANÇAIS (voiture / moto / utilitaire) ═════════════
  // Avec toggle SIV ↔ ancienne plaque (uniquement en mode édition)
  return (
    <div className="plate-selector">

      {/* Toggle visible uniquement si on peut saisir (pas en readOnly) */}
      {!readOnly && (
        <div className="plate-selector__toggle-row">
          <span className="plate-selector__toggle-label">Ancienne plaque</span>
          <label className="plate-selector__toggle">
            <input
              type="checkbox"
              checked={isOldFormat}
              onChange={handleToggle}
              className="plate-selector__toggle-checkbox"
            />
            <span className="plate-selector__toggle-slider" />
          </label>
        </div>
      )}

      {/* Plaque française selon le toggle */}
      {isOldFormat ? (
        <OldFrenchPlateInput
          value={value}
          onChange={onChange}
          error={hasError ? '' : null}
        />
      ) : (
        <FrenchPlateInput
          name={name}
          value={value}
          onChange={onChange}
          size={size}
          hasError={hasError}
          readOnly={readOnly}
        />
      )}
    </div>
  );
};

export default PlateSelector;