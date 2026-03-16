// /frontend/src/components/shared/FrenchPlate.jsx
import React from 'react';
import './FrenchPlate.css';

/**
 * 🚗 Composant Plaque d'immatriculation française (SIV)
 *
 * Reproduit visuellement le design des plaques françaises :
 *   - Bande bleue EU à gauche (étoiles + "F")
 *   - Fond blanc avec le numéro en noir et gras
 *
 * Props :
 *   value  : string          — le numéro (ex: "AB-123-CD")
 *   size   : 'sm'|'md'|'lg'  — taille d'affichage (défaut: 'md')
 *
 * Utilisation :
 *   <FrenchPlate value="AB-123-CD" />
 *   <FrenchPlate value={vehicule.immatriculation} size="lg" />
 */
const FrenchPlate = ({ value, size = 'md' }) => {
  // Si aucune valeur, on n'affiche rien
  if (!value) return null;

  return (
    <div className={`french-plate french-plate--${size}`} title={`Immatriculation : ${value.toUpperCase()}`}>

      {/* ── Bande bleue EU à gauche ── */}
      <div className="french-plate__eu">
        {/* Petites étoiles dorées */}
        <span className="french-plate__eu-stars" aria-hidden="true">★★★</span>
        {/* Lettre pays */}
        <span className="french-plate__eu-letter">F</span>
      </div>

      {/* ── Numéro de plaque ── */}
      <span className="french-plate__number">
        {value.toUpperCase()}
      </span>

    </div>
  );
};

export default FrenchPlate;
