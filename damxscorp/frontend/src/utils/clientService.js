// /frontend/src/utils/clientService.js
import logger from './logger';

/**
 * 👤 SERVICE CLIENTS
 * 
 * Gère toute la logique métier autour des clients :
 * - Recherche et filtrage
 * - Historique complet (RDV + véhicules + factures)
 * - Statistiques client
 */

// ========================================================================
// RÉCUPÉRATION DES DONNÉES
// ========================================================================

/**
 * Récupère tous les clients et les trie par nom
 */
export const getAllClients = async () => {
  try {
    // TODO: Implémenter quand l'API clients sera prête
    logger.info('Chargement de tous les clients');
    return [];
  } catch (error) {
    logger.error('Erreur lors du chargement des clients', error);
    throw error;
  }
};

/**
 * Recherche un client par nom/prénom/téléphone/email
 */
export const searchClients = async (query) => {
  try {
    // TODO: Implémenter la recherche
    logger.info(`Recherche de clients : "${query}"`);
    return [];
  } catch (error) {
    logger.error('Erreur lors de la recherche de clients', error);
    throw error;
  }
};

/**
 * Récupère un client par son ID
 */
export const getClientById = async (clientId) => {
  try {
    // TODO: Implémenter
    logger.info(`Chargement du client ${clientId}`);
    return null;
  } catch (error) {
    logger.error(`Erreur lors du chargement du client ${clientId}`, error);
    throw error;
  }
};

// ========================================================================
// HISTORIQUE CLIENT
// ========================================================================

/**
 * Récupère l'historique complet d'un client
 * (Interventions + Véhicules + Factures)
 */
export const getClientHistory = async (clientId) => {
  try {
    logger.info(`Récupération de l'historique du client ${clientId}`);
    
    // TODO: Combiner plusieurs appels API
    const interventions = []; // await getInterventionsByClient(clientId);
    const vehicules = [];      // await getVehiclesByClient(clientId);
    const factures = [];       // await getInvoicesByClient(clientId);
    
    return {
      interventions,
      vehicules,
      factures,
      totalDepense: factures.reduce((sum, f) => sum + f.montant, 0),
      nbInterventions: interventions.length,
      nbVehicules: vehicules.length,
    };
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'historique du client ${clientId}`, error);
    throw error;
  }
};

// ========================================================================
// CRÉATION / MODIFICATION / SUPPRESSION
// ========================================================================

/**
 * Crée un nouveau client
 */
export const createClient = async (formData) => {
  try {
    // TODO: Implémenter avec formatClientForDjango()
    logger.info('Création d\'un nouveau client', formData);
    return null;
  } catch (error) {
    logger.error('Erreur lors de la création du client', error);
    throw error;
  }
};

/**
 * Modifie un client existant
 */
export const updateClient = async (clientId, formData) => {
  try {
    // TODO: Implémenter
    logger.info(`Modification du client ${clientId}`, formData);
    return null;
  } catch (error) {
    logger.error(`Erreur lors de la modification du client ${clientId}`, error);
    throw error;
  }
};

/**
 * Supprime un client
 */
export const deleteClient = async (clientId) => {
  try {
    // TODO: Vérifier qu'il n'a pas d'interventions actives avant suppression
    logger.info(`Suppression du client ${clientId}`);
  } catch (error) {
    logger.error(`Erreur lors de la suppression du client ${clientId}`, error);
    throw error;
  }
};

// ========================================================================
// STATISTIQUES
// ========================================================================

/**
 * Calcule les statistiques des clients
 */
export const getClientStatistics = async () => {
  try {
    const allClients = await getAllClients();
    
    return {
      total: allClients.length,
      nouveauxCeMois: 0, // TODO: Calculer
      actifs: 0,         // TODO: Clients avec RDV < 6 mois
      inactifs: 0,       // TODO: Clients sans RDV depuis 6 mois
    };
  } catch (error) {
    logger.error('Erreur lors du calcul des statistiques clients', error);
    throw error;
  }
};

export default {
  getAllClients,
  searchClients,
  getClientById,
  getClientHistory,
  createClient,
  updateClient,
  deleteClient,
  getClientStatistics,
};