// /frontend/src/utils/vehicleService.js
import logger from './logger';

/**
 * 🚗 SERVICE VÉHICULES
 * 
 * Gère toute la logique métier autour des véhicules :
 * - Recherche par immatriculation/VIN/marque/modèle
 * - Intégration API SIV (Système d'Immatriculation des Véhicules)
 * - Historique d'entretien
 * - Alertes de révision
 */

// ========================================================================
// RÉCUPÉRATION DES DONNÉES
// ========================================================================

/**
 * Récupère tous les véhicules
 */
export const getAllVehicles = async () => {
  try {
    // TODO: Implémenter quand l'API véhicules sera prête
    logger.info('Chargement de tous les véhicules');
    return [];
  } catch (error) {
    logger.error('Erreur lors du chargement des véhicules', error);
    throw error;
  }
};

/**
 * Récupère un véhicule par son ID
 */
export const getVehicleById = async (vehicleId) => {
  try {
    // TODO: Implémenter
    logger.info(`Chargement du véhicule ${vehicleId}`);
    return null;
  } catch (error) {
    logger.error(`Erreur lors du chargement du véhicule ${vehicleId}`, error);
    throw error;
  }
};

/**
 * Récupère les véhicules d'un client spécifique
 */
export const getVehiclesByClient = async (clientId) => {
  try {
    const allVehicles = await getAllVehicles();
    return allVehicles.filter(v => v.client_id === clientId);
  } catch (error) {
    logger.error(`Erreur lors du chargement des véhicules du client ${clientId}`, error);
    throw error;
  }
};

/**
 * Recherche un véhicule par immatriculation
 */
export const searchByPlate = async (plate) => {
  try {
    const allVehicles = await getAllVehicles();
    const normalizedPlate = plate.toUpperCase().replace(/[\s-]/g, '');
    
    return allVehicles.filter(v => {
      const vehiclePlate = v.immatriculation.toUpperCase().replace(/[\s-]/g, '');
      return vehiclePlate.includes(normalizedPlate);
    });
  } catch (error) {
    logger.error('Erreur lors de la recherche par immatriculation', error);
    throw error;
  }
};

/**
 * Recherche un véhicule par VIN
 */
export const searchByVIN = async (vin) => {
  try {
    const allVehicles = await getAllVehicles();
    return allVehicles.filter(v => v.vin?.includes(vin.toUpperCase()));
  } catch (error) {
    logger.error('Erreur lors de la recherche par VIN', error);
    throw error;
  }
};

/**
 * Recherche par marque/modèle
 */
export const searchByBrandModel = async (query) => {
  try {
    const allVehicles = await getAllVehicles();
    const lowercaseQuery = query.toLowerCase();
    
    return allVehicles.filter(v => 
      v.marque?.toLowerCase().includes(lowercaseQuery) ||
      v.modele?.toLowerCase().includes(lowercaseQuery)
    );
  } catch (error) {
    logger.error('Erreur lors de la recherche par marque/modèle', error);
    throw error;
  }
};

// ========================================================================
// API SIV - SYSTÈME D'IMMATRICULATION DES VÉHICULES
// ========================================================================

/**
 * Récupère les informations d'un véhicule via l'API SIV française
 * @param {string} plate - Immatriculation (ex: "AB-123-CD")
 * @returns {Object} - Données du véhicule (marque, modèle, année, etc.)
 */
export const fetchVehicleDataFromSIV = async (plate) => {
  try {
    logger.info(`Appel API SIV pour l'immatriculation : ${plate}`);
    
    // TODO: Implémenter l'appel à l'API SIV du gouvernement français
    // Endpoint : https://api.gouv.fr/documentation/api_carto_codes_postaux
    // OU : https://immatriculation.ants.gouv.fr/
    
    // Pour l'instant, retour simulé
    logger.warning('API SIV non implémentée - Retour de données fictives');
    
    return {
      immatriculation: plate,
      marque: 'Peugeot',
      modele: '308',
      annee: '2020',
      vin: 'VF3XXXXXXXXXX1234',
      carburant: 'Diesel',
      puissance: '130',
      co2: '110',
      datePremiereImmatriculation: '2020-06-15',
    };
  } catch (error) {
    logger.error(`Erreur lors de l'appel API SIV pour ${plate}`, error);
    throw new Error('Impossible de récupérer les informations du véhicule via l\'API SIV');
  }
};

/**
 * Valide un format d'immatriculation française
 * @param {string} plate - Immatriculation à valider
 * @returns {boolean} - true si valide
 */
export const isValidFrenchPlate = (plate) => {
  // Format AA-123-AA (nouveau) ou 1234 AB 12 (ancien)
  const newFormat = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/;
  const oldFormat = /^\d{1,4}\s?[A-Z]{2}\s?\d{2}$/;
  
  const normalizedPlate = plate.toUpperCase().trim();
  return newFormat.test(normalizedPlate) || oldFormat.test(normalizedPlate);
};

// ========================================================================
// HISTORIQUE D'ENTRETIEN
// ========================================================================

/**
 * Récupère l'historique d'entretien d'un véhicule
 */
export const getVehicleMaintenanceHistory = async (vehicleId) => {
  try {
    logger.info(`Récupération de l'historique d'entretien du véhicule ${vehicleId}`);
    
    // TODO: Récupérer toutes les interventions liées à ce véhicule
    const interventions = []; // await getInterventionsByVehicle(vehicleId);
    
    return {
      interventions,
      totalInterventions: interventions.length,
      derniereIntervention: interventions[0] || null,
      totalDepense: 0, // TODO: Calculer à partir des factures
    };
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'historique du véhicule ${vehicleId}`, error);
    throw error;
  }
};

/**
 * Calcule la prochaine révision recommandée
 * @param {Object} vehicle - Données du véhicule
 * @param {Array} interventions - Historique des interventions
 * @returns {Object} - Infos sur la prochaine révision
 */
export const calculateNextMaintenance = (vehicle, interventions) => {
  try {
    // TODO: Logique complexe basée sur :
    // - Dernière vidange
    // - Kilométrage actuel
    // - Type de véhicule
    // - Constructeur recommandations
    
    logger.info(`Calcul de la prochaine révision pour le véhicule ${vehicle.id}`);
    
    return {
      type: 'ENTRETIEN_VP2',
      dateRecommandee: null,
      kilometrageRecommande: null,
      urgence: 'OK', // OK, BIENTOT, URGENT
      message: 'Prochaine révision recommandée dans 6 mois',
    };
  } catch (error) {
    logger.error('Erreur lors du calcul de la prochaine révision', error);
    return null;
  }
};

// ========================================================================
// CRÉATION / MODIFICATION / SUPPRESSION
// ========================================================================

/**
 * Crée un nouveau véhicule
 */
export const createVehicle = async (formData) => {
  try {
    // Validation de l'immatriculation
    if (!isValidFrenchPlate(formData.plate)) {
      throw new Error('Format d\'immatriculation invalide');
    }
    
    // TODO: Implémenter avec formatVehiculeForDjango()
    logger.info('Création d\'un nouveau véhicule', formData);
    return null;
  } catch (error) {
    logger.error('Erreur lors de la création du véhicule', error);
    throw error;
  }
};

/**
 * Crée un véhicule à partir des données API SIV
 */
export const createVehicleFromSIV = async (plate, clientId) => {
  try {
    // Récupérer les données via SIV
    const sivData = await fetchVehicleDataFromSIV(plate);
    
    // Créer le véhicule avec les données récupérées
    const vehicleData = {
      plate: sivData.immatriculation,
      vehicleBrand: sivData.marque,
      vehicleModel: sivData.modele,
      vehicleYear: sivData.annee,
      vin: sivData.vin,
      clientId: clientId,
    };
    
    return await createVehicle(vehicleData);
  } catch (error) {
    logger.error('Erreur lors de la création du véhicule via SIV', error);
    throw error;
  }
};

/**
 * Modifie un véhicule existant
 */
export const updateVehicle = async (vehicleId, formData) => {
  try {
    // TODO: Implémenter
    logger.info(`Modification du véhicule ${vehicleId}`, formData);
    return null;
  } catch (error) {
    logger.error(`Erreur lors de la modification du véhicule ${vehicleId}`, error);
    throw error;
  }
};

/**
 * Supprime un véhicule
 */
export const deleteVehicle = async (vehicleId) => {
  try {
    // TODO: Vérifier qu'il n'a pas d'interventions actives avant suppression
    logger.info(`Suppression du véhicule ${vehicleId}`);
  } catch (error) {
    logger.error(`Erreur lors de la suppression du véhicule ${vehicleId}`, error);
    throw error;
  }
};

// ========================================================================
// STATISTIQUES
// ========================================================================

/**
 * Calcule les statistiques des véhicules
 */
export const getVehicleStatistics = async () => {
  try {
    const allVehicles = await getAllVehicles();
    
    // Grouper par type
    const byType = allVehicles.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {});
    
    // Grouper par marque
    const byBrand = allVehicles.reduce((acc, v) => {
      acc[v.marque] = (acc[v.marque] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: allVehicles.length,
      byType,
      byBrand,
      topMarques: Object.entries(byBrand)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([marque, count]) => ({ marque, count })),
    };
  } catch (error) {
    logger.error('Erreur lors du calcul des statistiques véhicules', error);
    throw error;
  }
};

export default {
  getAllVehicles,
  getVehicleById,
  getVehiclesByClient,
  searchByPlate,
  searchByVIN,
  searchByBrandModel,
  fetchVehicleDataFromSIV,
  isValidFrenchPlate,
  getVehicleMaintenanceHistory,
  calculateNextMaintenance,
  createVehicle,
  createVehicleFromSIV,
  updateVehicle,
  deleteVehicle,
  getVehicleStatistics,
};