// /frontend/src/services/api.js
import axios from 'axios';
import logger from '../utils/logger';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ── INTERVENTIONS ────────────────────────────────────────────────

export const fetchInterventions = async () => {
  try {
    logger.api.send('GET /interventions/');
    const response = await api.get('/interventions/');
    logger.api.receive('GET /interventions/', response.data);
    return response.data;
  } catch (error) {
    logger.api.error('GET /interventions/', error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const saveIntervention = async (data) => {
  try {
    logger.api.send('POST /interventions/', data);
    const response = await api.post('/interventions/', data);
    logger.api.receive('POST /interventions/', response.data);
    return response.data;
  } catch (error) {
    logger.api.error('POST /interventions/', error);
    if (!error.response) {
      throw new Error('Impossible de contacter le serveur.');
    } else if (error.response.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la sauvegarde');
  }
};

export const updateIntervention = async (id, data) => {
  try {
    logger.api.send(`PUT /interventions/${id}/`, data);
    const response = await api.put(`/interventions/${id}/`, data);
    logger.api.receive(`PUT /interventions/${id}/`, response.data);
    return response.data;
  } catch (error) {
    logger.api.error(`PUT /interventions/${id}/`, error);
    throw new Error('Erreur lors de la modification');
  }
};

// ✅ NOUVEAU : mise à jour partielle (juste le statut par exemple)
export const patchIntervention = async (id, data) => {
  try {
    logger.api.send(`PATCH /interventions/${id}/`, data);
    const response = await api.patch(`/interventions/${id}/`, data);
    logger.api.receive(`PATCH /interventions/${id}/`, response.data);
    return response.data;
  } catch (error) {
    logger.api.error(`PATCH /interventions/${id}/`, error);
    throw new Error('Erreur lors de la mise à jour');
  }
};

export const deleteIntervention = async (id) => {
  try {
    logger.api.send(`DELETE /interventions/${id}/`);
    await api.delete(`/interventions/${id}/`);
    logger.success(`Intervention ${id} supprimée`);
  } catch (error) {
    logger.api.error(`DELETE /interventions/${id}/`, error);
    throw new Error('Erreur lors de la suppression');
  }
};

// Récupère les interventions d'un véhicule spécifique
export const fetchInterventionsByVehicule = async (vehiculeId) => {
  try {
    logger.api.send(`GET /interventions/?vehicule=${vehiculeId}`);
    const response = await api.get(`/interventions/?vehicule=${vehiculeId}`);
    logger.api.receive(`GET /interventions/?vehicule=${vehiculeId}`, response.data);
    return response.data;
  } catch (error) {
    logger.api.error(`GET /interventions/?vehicule=${vehiculeId}`, error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

// Récupère les interventions d'un client spécifique
export const fetchInterventionsByClient = async (clientId) => {
  try {
    logger.api.send(`GET /interventions/?client=${clientId}`);
    const response = await api.get(`/interventions/?client=${clientId}`);
    logger.api.receive(`GET /interventions/?client=${clientId}`, response.data);
    return response.data;
  } catch (error) {
    logger.api.error(`GET /interventions/?client=${clientId}`, error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

// Récupère les véhicules d'un client spécifique
export const fetchVehiculesByClient = async (clientId) => {
  try {
    logger.api.send(`GET /vehicules/?client=${clientId}`);
    const response = await api.get(`/vehicules/?client=${clientId}`);
    logger.api.receive(`GET /vehicules/?client=${clientId}`, response.data);
    return response.data;
  } catch (error) {
    logger.api.error(`GET /vehicules/?client=${clientId}`, error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

// ── PIÈCES (STOCK) ───────────────────────────────────────────────

export const fetchPieces = async () => {
  try {
    logger.api.send('GET /stock/pieces/');
    const response = await api.get('/stock/pieces/');
    logger.api.receive('GET /stock/pieces/', response.data);
    return response.data;
  } catch (error) {
    logger.api.error('GET /stock/pieces/', error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const deletePiece = async (id) => {
  try {
    logger.api.send(`DELETE /stock/pieces/${id}/`);
    await api.delete(`/stock/pieces/${id}/`);
    logger.success(`Pièce ${id} supprimée`);
  } catch (error) {
    logger.api.error(`DELETE /stock/pieces/${id}/`, error);
    throw new Error('Erreur lors de la suppression');
  }
};

// ── CLIENTS ─────────────────────────────────────────────────────

export const fetchClients = async () => {
  try {
    logger.api.send('GET /clients/');
    const response = await api.get('/clients/');
    logger.api.receive('GET /clients/', response.data);
    return response.data;
  } catch (error) {
    logger.api.error('GET /clients/', error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const createClient = async (data) => {
  try {
    logger.api.send('POST /clients/', data);
    const response = await api.post('/clients/', data);
    logger.api.receive('POST /clients/', response.data);
    return response.data;
  } catch (error) {
    logger.api.error('POST /clients/', error);
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la création du client');
  }
};

export const updateClient = async (id, data) => {
  try {
    logger.api.send(`PUT /clients/${id}/`, data);
    const response = await api.put(`/clients/${id}/`, data);
    logger.api.receive(`PUT /clients/${id}/`, response.data);
    return response.data;
  } catch (error) {
    logger.api.error(`PUT /clients/${id}/`, error);
    throw new Error('Erreur lors de la modification du client');
  }
};

export const deleteClient = async (id) => {
  try {
    logger.api.send(`DELETE /clients/${id}/`);
    await api.delete(`/clients/${id}/`);
    logger.success(`Client ${id} supprimé`);
  } catch (error) {
    logger.api.error(`DELETE /clients/${id}/`, error);
    throw new Error('Erreur lors de la suppression du client');
  }
};
// ── VÉHICULES ────────────────────────────────────────────────────

export const fetchVehicules = async () => {
  try {
    logger.api.send('GET /vehicules/');
    const response = await api.get('/vehicules/');
    logger.api.receive('GET /vehicules/', response.data);
    return response.data;
  } catch (error) {
    logger.api.error('GET /vehicules/', error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const createVehicule = async (data) => {
  try {
    logger.api.send('POST /vehicules/', data);
    const response = await api.post('/vehicules/', data);
    logger.api.receive('POST /vehicules/', response.data);
    return response.data;
  } catch (error) {
    logger.api.error('POST /vehicules/', error);
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la création du véhicule');
  }
};

export const updateVehicule = async (id, data) => {
  try {
    logger.api.send(`PUT /vehicules/${id}/`, data);
    const response = await api.put(`/vehicules/${id}/`, data);
    logger.api.receive(`PUT /vehicules/${id}/`, response.data);
    return response.data;
  } catch (error) {
    logger.api.error(`PUT /vehicules/${id}/`, error);
    throw new Error('Erreur lors de la modification du véhicule');
  }
};

export const deleteVehicule = async (id) => {
  try {
    logger.api.send(`DELETE /vehicules/${id}/`);
    await api.delete(`/vehicules/${id}/`);
    logger.success(`Véhicule ${id} supprimé`);
  } catch (error) {
    logger.api.error(`DELETE /vehicules/${id}/`, error);
    throw new Error('Erreur lors de la suppression du véhicule');
  }
};

// ── RÉFÉRENTIELS ─────────────────────────────────────────────────

/**
 * Récupère tous les référentiels (ou filtrés par catégorie)
 * ex: fetchReferentiels('TYPE_VEHICULE') ou fetchReferentiels() pour tout
 */
export const fetchReferentiels = async (categorie = null, actifOnly = false) => {
  try {
    let url = '/referentiels/';
    const params = [];
    if (categorie)  params.push(`categorie=${categorie}`);
    if (actifOnly)  params.push('actif=true');
    if (params.length) url += '?' + params.join('&');

    logger.api.send(`GET ${url}`);
    const response = await api.get(url);
    logger.api.receive(`GET ${url}`, response.data);
    return response.data;
  } catch (error) {
    logger.api.error('GET /referentiels/', error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const createReferentiel = async (data) => {
  try {
    logger.api.send('POST /referentiels/', data);
    const response = await api.post('/referentiels/', data);
    logger.api.receive('POST /referentiels/', response.data);
    return response.data;
  } catch (error) {
    logger.api.error('POST /referentiels/', error);
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([f, m]) => `${f}: ${m.join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la création');
  }
};

export const updateReferentiel = async (id, data) => {
  try {
    logger.api.send(`PATCH /referentiels/${id}/`, data);
    const response = await api.patch(`/referentiels/${id}/`, data);
    logger.api.receive(`PATCH /referentiels/${id}/`, response.data);
    return response.data;
  } catch (error) {
    logger.api.error(`PATCH /referentiels/${id}/`, error);
    throw new Error('Erreur lors de la modification');
  }
};

export const deleteReferentiel = async (id) => {
  try {
    logger.api.send(`DELETE /referentiels/${id}/`);
    await api.delete(`/referentiels/${id}/`);
    logger.success(`Référentiel ${id} supprimé`);
  } catch (error) {
    logger.api.error(`DELETE /referentiels/${id}/`, error);
    throw new Error('Erreur lors de la suppression');
  }
};

// =============================================================================
// DÉPARTEMENTS
// =============================================================================

export const fetchDepartements = async (actifSeulement = false) => {
  try {
    const params = actifSeulement ? '?actif=true' : '';
    const response = await api.get(`/departements/${params}`);
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors du chargement des départements');
  }
};

export const createDepartement = async (data) => {
  try {
    const response = await api.post('/departements/', data);
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la création du département');
  }
};

export const updateDepartement = async (id, data) => {
  try {
    const response = await api.patch(`/departements/${id}/`, data);
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.error || 'Erreur lors de la modification';
    throw new Error(msg);
  }
};

export const deleteDepartement = async (id) => {
  try {
    await api.delete(`/departements/${id}/`);
  } catch (error) {
    const msg = error.response?.data?.error || 'Erreur lors de la suppression';
    throw new Error(msg);
  }
};

// =============================================================================
// COLLABORATEURS
// =============================================================================

export const fetchCollaborateurs = async (actifSeulement = false) => {
  try {
    const params = actifSeulement ? '?actif=true' : '';
    const response = await api.get(`/collaborateurs/${params}`);
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors du chargement des collaborateurs');
  }
};

export const createCollaborateur = async (data) => {
  try {
    const response = await api.post('/collaborateurs/', data);
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la création du collaborateur');
  }
};

export const updateCollaborateur = async (id, data) => {
  try {
    const response = await api.patch(`/collaborateurs/${id}/`, data);
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la modification du collaborateur');
  }
};

export const deleteCollaborateur = async (id) => {
  try {
    await api.delete(`/collaborateurs/${id}/`);
  } catch (error) {
    throw new Error('Erreur lors de la suppression du collaborateur');
  }
};