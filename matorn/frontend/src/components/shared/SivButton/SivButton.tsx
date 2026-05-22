// /frontend/src/components/shared/SivButton/SivButton.tsx
//
// Bouton SIV (Système d'Immatriculation des Véhicules).
// Auto-contenu : gère l'affichage, le loading et l'appel API futur.
//
// Usage :
//   <SivButton
//     immatriculation={formData.immatriculation}
//     vehicleType={formData.type_vehicule}
//     onResult={(data) => setFormData(prev => ({ ...prev, marque: data.marque, ... }))}
//   />
//
// Quand l'API SIV est disponible : brancher l'appel dans callSivApi() ci-dessous.
// Aucune autre modification nécessaire dans les composants qui l'utilisent.

import React, { useState } from 'react';
import { Search, Loader } from '../../../utils/icons';
import './SivButton.css';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

// Types de véhicules sans plaque SIV — le bouton ne s'affiche pas pour eux
const SIV_EXCLUDED_TYPES = [
  'BATEAU', 'JETSKI', 'VOILIER',
  'MOTOCULTURE', 'ENGIN', 'ENGIN_AGRICOLE', 'TONDEUSE',
];

// Données retournées par l'API SIV (à compléter quand l'API est connue)
export interface SivResult {
  marque?:       string;
  modele?:       string;
  annee?:        string;
  couleur?:      string;
  type_vehicule?: string;
  vin?:          string;
  // Ajouter les autres champs de l'API ici
  [key: string]: string | undefined;
}

interface Props {
  immatriculation: string;
  vehicleType?:    string;
  onResult?:       (data: SivResult) => void;
  className?:      string;
}

// ─────────────────────────────────────────────────────────────────────────────
// APPEL API SIV — À BRANCHER ICI QUAND L'API EST DISPONIBLE
// ─────────────────────────────────────────────────────────────────────────────

const callSivApi = async (_immatriculation: string): Promise<SivResult> => {
  // TODO : remplacer par l'appel réel quand l'API SIV est disponible
  // Exemple :
  //   const response = await api.get(`/siv/${immatriculation}/`);
  //   return response.data;
  throw new Error('API SIV pas encore disponible');
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

const SivButton: React.FC<Props> = ({
  immatriculation,
  vehicleType = '',
  onResult,
  className = '',
}) => {

  const [loading, setLoading]   = useState(false);
  const [tooltip, setTooltip]   = useState<string | null>(null);

  // Ne pas afficher pour les véhicules sans plaque SIV
  if (SIV_EXCLUDED_TYPES.includes(vehicleType.toUpperCase())) return null;

  const isDisabled = !immatriculation?.trim() || loading;

  const handleClick = async () => {
    if (isDisabled) return;

    setLoading(true);
    setTooltip(null);

    try {
      const data = await callSivApi(immatriculation);
      onResult?.(data);
      setTooltip('✅ Véhicule trouvé !');
    } catch (err: any) {
      // API pas encore disponible ou erreur réseau
      setTooltip(err.message || 'Erreur SIV');
    } finally {
      setLoading(false);
      // Effacer le tooltip après 3 secondes
      setTimeout(() => setTooltip(null), 3000);
    }
  };

  return (
    <div className={`siv-wrapper ${className}`}>
      <button
        type="button"
        className={`siv-btn ${isDisabled ? 'siv-btn--disabled' : ''} ${loading ? 'siv-btn--loading' : ''}`}
        onClick={handleClick}
        disabled={isDisabled}
        title={
          !immatriculation?.trim()
            ? 'Saisissez une immatriculation d\'abord'
            : 'Rechercher le véhicule via le SIV'
        }
      >
        {loading
          ? <><Loader size={13} className="siv-spin" /> Recherche...</>
          : <><Search size={13} /> SIV</>
        }
      </button>

      {tooltip && (
        <span className={`siv-tooltip ${tooltip.startsWith('✅') ? 'siv-tooltip--ok' : 'siv-tooltip--err'}`}>
          {tooltip}
        </span>
      )}
    </div>
  );
};

export default SivButton;
