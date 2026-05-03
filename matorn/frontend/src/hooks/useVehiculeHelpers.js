// /frontend/src/hooks/useVehiculeHelpers.js
import { useReferentiels } from '../context/ReferentielsContext';

/**
 * 🚗 Hook useVehiculeHelpers
 *
 * Fournit des helpers dynamiques pour les véhicules,
 * synchronisés avec les référentiels configurés dans Paramètres.
 *
 * Remplace les anciennes fonctions fixes de vehicleService.js
 *
 * Usage :
 *   const { getVehiculeIcon, getVehiculeTypeLabel } = useVehiculeHelpers();
 */

// Icônes de fallback par mot-clé dans le label
// Si le référentiel a un champ icone → on l'utilise en priorité
const ICONE_FALLBACK = {
  voiture:     '🚗',
  auto:        '🚗',
  moto:        '🏍️',
  scooter:     '🏍️',
  camion:      '🚛',
  van:         '🚐',
  utilitaire:  '🚐',
  tracteur:    '🚜',
  motoculture: '🚜',
  bateau:      '🚤',
  jet:         '🚤',
  quad:        '🏎️',
  velo:        '🚲',
  vélo:        '🚲',
  trottinette: '🛴',
};

const getIconeFromLabel = (label) => {
  if (!label) return '🚗';
  const l = label.toLowerCase();
  for (const [mot, icone] of Object.entries(ICONE_FALLBACK)) {
    if (l.includes(mot)) return icone;
  }
  return '🚗'; // Fallback générique
};

const useVehiculeHelpers = () => {
  const { getTypeVehicules } = useReferentiels();

  /**
   * Retourne l'icône d'un type de véhicule.
   * Priorité : icone du référentiel → détection par mot-clé → 🚗
   *
   * @param {string} typeValeur — ex: 'VOITURE', 'MOTO', 'QUAD_ELECTRIQUE'
   * @returns {string} emoji
   */
  const getVehiculeIcon = (typeValeur) => {
    const types = getTypeVehicules(true); // true = inclut les inactifs
    const found = types.find(t => t.valeur === typeValeur);

    if (found?.icone) return found.icone;           // Icône configurée dans Paramètres
    if (found?.label) return getIconeFromLabel(found.label); // Détection par mot-clé
    return getIconeFromLabel(typeValeur);            // Fallback sur la valeur brute
  };

  /**
   * Retourne le label lisible d'un type de véhicule.
   * Fallback sur la valeur brute si le type n'est pas trouvé.
   *
   * @param {string} typeValeur — ex: 'VOITURE'
   * @returns {string} ex: 'Voiture'
   */
  const getVehiculeTypeLabel = (typeValeur) => {
    const types = getTypeVehicules(true);
    const found = types.find(t => t.valeur === typeValeur);
    return found?.label || typeValeur;
  };

  return { getVehiculeIcon, getVehiculeTypeLabel };
};

export default useVehiculeHelpers;