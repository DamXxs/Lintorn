// /frontend/src/services/parametresService.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// =============================================================================
// PARAMÈTRES FACTURATION (TVA, compteurs)
// =============================================================================

export const fetchParametres = async () => {
  try {
    const res = await api.get('/factures/parametres/');
    return res.data;
  } catch (error) {
    throw new Error('Erreur lors du chargement des paramètres');
  }
};

export const updateParametres = async (data) => {
  try {
    const res = await api.patch('/factures/parametres/', data);
    return res.data;
  } catch (error) {
    throw new Error('Erreur lors de la mise à jour des paramètres');
  }
};

// =============================================================================
// FORFAITS INTERVENTION (catalogue main d'œuvre)
// =============================================================================

/**
 * Récupère les forfaits.
 * @param {boolean} tous - si true, retourne aussi les forfaits inactifs (pour les paramètres)
 */
export const fetchForfaits = async (tous = false) => {
  try {
    const params = tous ? { tous: 1 } : {};
    const res = await api.get('/factures/forfaits/', { params });
    return res.data;
  } catch (error) {
    throw new Error('Erreur lors du chargement des forfaits');
  }
};

export const createForfait = async (data) => {
  try {
    const res = await api.post('/factures/forfaits/', data);
    return res.data;
  } catch (error) {
    throw new Error('Erreur lors de la création du forfait');
  }
};

export const updateForfait = async (id, data) => {
  try {
    const res = await api.patch(`/factures/forfaits/${id}/`, data);
    return res.data;
  } catch (error) {
    throw new Error('Erreur lors de la mise à jour du forfait');
  }
};

export const deleteForfait = async (id) => {
  try {
    await api.delete(`/factures/forfaits/${id}/`);
  } catch (error) {
    throw new Error('Erreur lors de la suppression du forfait');
  }
};
