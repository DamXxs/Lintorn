// /src/services/api.js
import axios from 'axios';

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
    const response = await api.get('/interventions/');
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const saveIntervention = async (data) => {
  try {
    console.log("📤 Envoi à Django:", data);
    const response = await api.post('/interventions/', data);
    console.log("✅ Réponse Django:", response.data);
    return response.data;
  } catch (error) {
    // ← NOUVEAU : Afficher l'erreur complète de Django
    console.error('❌ Erreur Django complète:', error.response?.data);
    
    // Message user-friendly selon le type d'erreur
    if (!error.response) {
      throw new Error('Impossible de contacter le serveur. Verifiez votre connexion. ');
    } else if (error.response.status === 400) {
      const errors = Object.values(error.response.data).flat().joint('\n');
      throw new Error('Données invalides :\n${errors}');
    } else if (error.response.status === 500) {
      throw new Error('Erreur serveur. Contactez l\'administrateur.');
    } else {
      throw new Error('Erreur lors de la sauvegarde');
    }
  }
};

export const updateIntervention = async (id, data) => {
  try {
    const response = await api.put(`/interventions/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Erreur lors de la modification');
  }
};

export const deleteIntervention = async (id) => {
  try {
    await api.delete(`/interventions/${id}/`);
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Erreur lors de la suppression');
  }
};

// ========== PIÈCES (STOCK) ==========
export const fetchPieces = async () => {
  try {
    const response = await api.get('/stock/pieces/');
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const deletePiece = async (id) => {
  try {
    await api.delete(`/stock/pieces/${id}/`);
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Erreur lors de la suppression');
  }
};