// /frontend/src/components/shared/FrenchPlateInput.jsx
import React from 'react';
import './FrenchPlate.css'; // Réutilise le CSS de FrenchPlate

/**
 * 🚗 FrenchPlateInput — Composant unique pour afficher ET saisir une plaque française (SIV)
 *
 * Remplace FrenchPlate.jsx (supprimé). Un seul composant pour deux usages :
 *
 *   MODE AFFICHAGE (readOnly=true) :
 *     Même visuel qu'une vraie plaque — la zone du numéro est un <input readOnly>.
 *     Pas de curseur, pas d'interaction. Idéal pour les listes, fiches, modales de consultation.
 *     Usage : <FrenchPlateInput value="AB-123-CD" readOnly />
 *             <FrenchPlateInput value={vehicule.immatriculation} size="lg" readOnly />
 *
 *   MODE SAISIE (readOnly=false, défaut) :
 *     L'utilisateur tape directement "dans" la plaque — plus besoin d'un champ séparé.
 *     Usage : <FrenchPlateInput name="immatriculation" value={...} onChange={...} />
 *
 * Props :
 *   value       : string          — numéro de plaque (ex: "AB-123-CD")
 *   name        : string          — attribut name de l'input (utile en mode saisie)
 *   onChange    : func            — handler de changement (mode saisie uniquement)
 *   size        : 'sm'|'md'|'lg'  — taille d'affichage (défaut: 'md')
 *   placeholder : string          — texte indicatif (défaut: 'AB-123-CD')
 *   hasError    : bool            — bordure rouge si erreur de validation
 *   readOnly    : bool            — true = mode affichage pur, pas de saisie (défaut: false)
 */
const FrenchPlateInput = ({
  value,
  name,
  onChange,
  size        = 'md',
  placeholder = 'AB-123-CD',
  hasError    = false,
  readOnly    = false,
}) => {
  // En mode affichage, si pas de valeur on n'affiche rien (comme l'ancien FrenchPlate)
  if (readOnly && !value) return null;

  return (
    <div
      className={[
        'french-plate',
        `french-plate--${size}`,
        !readOnly ? 'french-plate--editable' : '',
        hasError   ? 'french-plate--error'    : '',
      ].filter(Boolean).join(' ')}
      title={readOnly && value ? `Immatriculation : ${value.toUpperCase()}` : undefined}
    >
      {/* ── Bande bleue EU à gauche ── */}
      <div className="french-plate__eu">
        <span className="french-plate__eu-stars" aria-hidden="true">★★★</span>
        <span className="french-plate__eu-letter">F</span>
      </div>

      {/* ── Zone numéro (saisie ou affichage selon readOnly) ── */}
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

      {/* ── Bande bleue à droite ── */}
      <div className="french-plate__region"></div>
    </div>
  );
};

export default FrenchPlateInput;
