// /frontend/src/services/devisService.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

const BASE = '/factures';

// =============================================================================
// DEVIS
// =============================================================================

export const fetchDevis = async (filtres = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtres.statut) params.append('statut', filtres.statut);
    if (filtres.client) params.append('client', filtres.client);
    const query = params.toString() ? `?${params}` : '';
    const res = await api.get(`${BASE}/devis/${query}`);
    return res.data;
  } catch (error) {
    throw new Error('Erreur lors du chargement des devis');
  }
};

export const fetchDevisById = async (id) => {
  try {
    const res = await api.get(`${BASE}/devis/${id}/`);
    return res.data;
  } catch (error) {
    throw new Error('Devis introuvable');
  }
};

export const createDevis = async (data) => {
  try {
    const res = await api.post(`${BASE}/devis/`, data);
    return res.data;
  } catch (error) {
    if (error.response?.status === 400) {
      const msgs = Object.entries(error.response.data)
        .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`)
        .join('\n');
      throw new Error(`Données invalides :\n${msgs}`);
    }
    throw new Error('Erreur lors de la création du devis');
  }
};

export const updateDevis = async (id, data) => {
  try {
    const res = await api.patch(`${BASE}/devis/${id}/`, data);
    return res.data;
  } catch (error) {
    throw new Error('Erreur lors de la mise à jour du devis');
  }
};

export const deleteDevis = async (id) => {
  try {
    await api.delete(`${BASE}/devis/${id}/`);
  } catch (error) {
    const msg = error.response?.data?.error || 'Erreur lors de la suppression';
    throw new Error(msg);
  }
};

export const validerDevis = async (id) => {
  try {
    const res = await api.post(`${BASE}/devis/${id}/valider/`);
    return res.data;
  } catch (error) {
    const msg = error.response?.data?.error || 'Erreur lors de la validation';
    throw new Error(msg);
  }
};

export const refuserDevis = async (id) => {
  try {
    const res = await api.post(`${BASE}/devis/${id}/refuser/`);
    return res.data;
  } catch (error) {
    const msg = error.response?.data?.error || 'Erreur lors du refus';
    throw new Error(msg);
  }
};

export const creerFactureDepuisDevis = async (devisId, dateEcheance, notes = '') => {
  try {
    const res = await api.post(`${BASE}/devis/${devisId}/creer-facture/`, {
      date_echeance: dateEcheance,
      notes,
    });
    return res.data;
  } catch (error) {
    const msg = error.response?.data?.error || 'Erreur lors de la création de la facture';
    throw new Error(msg);
  }
};

// =============================================================================
// LIGNES DEVIS
// =============================================================================

export const fetchLignesDevis = async (devisId) => {
  try {
    const res = await api.get(`${BASE}/devis/${devisId}/lignes/`);
    return res.data;
  } catch (error) {
    throw new Error('Erreur lors du chargement des lignes');
  }
};

export const addLigneDevis = async (devisId, ligneData) => {
  // ligneData = { piece (opt), description, quantite, prix_unitaire }
  try {
    const res = await api.post(`${BASE}/devis/${devisId}/lignes/`, ligneData);
    return res.data;
  } catch (error) {
    if (error.response?.status === 400) {
      const msgs = Object.entries(error.response.data)
        .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`)
        .join('\n');
      throw new Error(`Données invalides :\n${msgs}`);
    }
    throw new Error('Erreur lors de l\'ajout de la ligne');
  }
};

export const updateLigneDevis = async (ligneId, ligneData) => {
  try {
    const res = await api.patch(`${BASE}/lignes-devis/${ligneId}/`, ligneData);
    return res.data;
  } catch (error) {
    throw new Error('Erreur lors de la mise à jour de la ligne');
  }
};

export const deleteLigneDevis = async (ligneId) => {
  try {
    await api.delete(`${BASE}/lignes-devis/${ligneId}/`);
  } catch (error) {
    throw new Error('Erreur lors de la suppression de la ligne');
  }
};
