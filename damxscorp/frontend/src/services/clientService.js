// /frontend/src/utils/clientService.js
import { fetchClients, saveClient, updateClient, deleteClient } from '../services/api';
import { formatClientForDjango, formatClientForReact } from './dataFormatters';
import logger from './logger';

/**
 * 👤 SERVICE CLIENTS
 * 
 * Gère la logique métier autour des clients
 */

/**
 * Récupère tous les clients et les trie par nom
 */
export const getAllClients = async () => {
  try {
    const clients = await fetchClients();
    // Tri alphabétique
    return clients.sort((a, b) => a.nom.localeCompare(b.nom));
  } catch (error) {
    logger.error('Erreur lors du chargement des clients', error);
    throw error;
  }
};

/**
 * Recherche un client par nom/prénom/téléphone
 */
export const searchClients = async (query) => {
  try {
    const allClients = await fetchClients();
    const lowercaseQuery = query.toLowerCase();
    
    return allClients.filter(client => 
      client.nom.toLowerCase().includes(lowercaseQuery) ||
      client.prenom?.toLowerCase().includes(lowercaseQuery) ||
      client.phone?.includes(query)
    );
  } catch (error) {
    logger.error('Erreur lors de la recherche de clients', error);
    throw error;
  }
};

/**
 * Récupère l'historique complet d'un client (RDV + véhicules)
 */
export const getClientHistory = async (clientId) => {
  try {
    // TODO: Appeler API pour récupérer interventions + véhicules du client
    logger.info(`Récupération historique client ${clientId}`);
    return {
      interventions: [],
      vehicules: [],
    };
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'historique du client ${clientId}`, error);
    throw error;
  }
};

export default {
  getAllClients,
  searchClients,
  getClientHistory,
};