// /src/services/api.js
import axios from 'axios';
import logger from '../utils/logger';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ========== INTERVENTIONS ==========

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
    
    // Messages user-friendly
    if (!error.response) {
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } else if (error.response.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    } else if (error.response.status === 500) {
      throw new Error('Erreur serveur. Contactez l\'administrateur.');
    } else {
      throw new Error('Erreur lors de la sauvegarde');
    }
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

// ========== PIÈCES (STOCK) ==========
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