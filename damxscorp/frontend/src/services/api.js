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