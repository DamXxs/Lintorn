// /frontend/src/pages/Clients/clientService.js
import { fetchClients, createClient, updateClient, deleteClient } from '../../services/api';
import logger from '../../utils/logger';

/**
 * 👤 SERVICE CLIENTS
 * Gère toute la logique métier autour des clients
 */

// =========================================================================
// RÉCUPÉRATION
// =========================================================================

export const getAllClients = async () => {
  try {
    logger.info('Chargement de tous les clients');
    const clients = await fetchClients();
    logger.success(`${clients.length} clients chargés`);
    return clients;
  } catch (error) {
    logger.error('Erreur lors du chargement des clients', error);
    throw error;
  }
};

// =========================================================================
// RECHERCHE (côté frontend — instantanée, pas d'appel API)
// =========================================================================

export const searchClients = (clients, query) => {
  // Si la recherche est vide, on retourne tous les clients
  if (!query || query.trim() === '') return clients;

  const q = query.toLowerCase().trim();

  return clients.filter(client =>
    client.nom?.toLowerCase().includes(q) ||
    client.prenom?.toLowerCase().includes(q) ||
    client.telephone?.includes(q) ||
    client.email?.toLowerCase().includes(q)
  );
};

// =========================================================================
// CRÉATION / MODIFICATION / SUPPRESSION
// =========================================================================

export const addClient = async (formData) => {
  try {
    logger.info('Création d\'un nouveau client', formData);
    const result = await createClient(formData);
    logger.success('Client créé', result);
    return result;
  } catch (error) {
    logger.error('Erreur lors de la création du client', error);
    throw error;
  }
};

export const editClient = async (clientId, formData) => {
  try {
    logger.info(`Modification du client ${clientId}`, formData);
    const result = await updateClient(clientId, formData);
    logger.success(`Client ${clientId} modifié`, result);
    return result;
  } catch (error) {
    logger.error(`Erreur lors de la modification du client ${clientId}`, error);
    throw error;
  }
};

export const removeClient = async (clientId) => {
  try {
    logger.info(`Suppression du client ${clientId}`);
    await deleteClient(clientId);
    logger.success(`Client ${clientId} supprimé`);
  } catch (error) {
    logger.error(`Erreur lors de la suppression du client ${clientId}`, error);
    throw error;
  }
};

// =========================================================================
// STATISTIQUES (calculées côté frontend)
// =========================================================================

export const getClientStats = (clients) => {
  return {
    total: clients.length,
    avecTelephone: clients.filter(c => c.telephone).length,
    avecEmail: clients.filter(c => c.email).length,
  };
};

export default {
  getAllClients,
  searchClients,
  addClient,
  editClient,
  removeClient,
  getClientStats,
};