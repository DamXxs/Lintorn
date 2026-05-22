// /frontend/src/components/shared/VehicleChipSelector/VehicleChipSelector.tsx
//
// Sélecteur de véhicules en chips cliquables.
// Stateless : le parent gère le chargement et la sélection.
// Utilise exclusivement des CSS variables → s'adapte à tous les thèmes.
//
// Usage :
//   <VehicleChipSelector
//     vehicules={dynamicVehicules}
//     selectedId={vehiculeSelectId}
//     onSelect={(v) => handleVehicleChipSelect(v)}
//     onManual={() => handleVehicleChipManual()}
//     loading={loadingVehicules}
//   />

import React from 'react';
import { Loader } from '../../../utils/icons';
import './VehicleChipSelector.css';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE
// ─────────────────────────────────────────────────────────────────────────────

export interface VehiculeChip {
  id:              number;
  immatriculation: string;
  marque:          string;
  modele:          string;
  annee?:          number | string | null;
  type_vehicule?:  string;
  vin?:            string | null;
}

interface Props {
  vehicules:   VehiculeChip[];
  selectedId:  string;               // String(v.id) ou '' pour saisie manuelle
  onSelect:    (v: VehiculeChip) => void;
  onManual:    () => void;           // Clic sur "Saisir manuellement"
  loading?:    boolean;
  /** Masque le chip "Saisir manuellement" si false (défaut : true) */
  showManual?: boolean;
  className?:  string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

const VehicleChipSelector: React.FC<Props> = ({
  vehicules,
  selectedId,
  onSelect,
  onManual,
  loading    = false,
  showManual = true,
  className  = '',
}) => {

  if (loading) {
    return (
      <div className={`vcs-loading ${className}`}>
        <Loader size={13} className="vcs-spinner" /> Chargement des véhicules...
      </div>
    );
  }

  if (vehicules.length === 0) return null;

  return (
    <div className={`vcs-chips ${className}`}>

      {vehicules.map(v => {
        const isSelected = selectedId === String(v.id);
        return (
          <button
            key={v.id}
            type="button"
            className={`vcs-chip${isSelected ? ' vcs-chip--selected' : ''}`}
            onClick={() => onSelect(v)}
            title={v.vin ? `VIN : ${v.vin}` : undefined}
          >
            <span className="vcs-chip__plate">
              {v.immatriculation || '—'}
            </span>
            <span className="vcs-chip__detail">
              {v.marque} {v.modele}
              {v.annee ? ` · ${v.annee}` : ''}
            </span>
          </button>
        );
      })}

      {/* Chip "Saisir manuellement" */}
      {showManual && (
        <button
          type="button"
          className={`vcs-chip vcs-chip--manual${selectedId === '' ? ' vcs-chip--selected' : ''}`}
          onClick={onManual}
        >
          <span className="vcs-chip__plate">+ Nouveau</span>
          <span className="vcs-chip__detail">Saisir manuellement</span>
        </button>
      )}

    </div>
  );
};

export default VehicleChipSelector;
