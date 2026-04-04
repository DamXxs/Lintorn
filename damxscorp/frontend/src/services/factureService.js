// /frontend/src/services/factureService.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

const BASE = '/factures';

// =============================================================================
// FACTURES
// =============================================================================

export const fetchFactures = async (filtres = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtres.statut) params.append('statut', filtres.statut);
    if (filtres.client) params.append('client', filtres.client);
    const query = params.toString() ? `?${params}` : '';
    const res = await api.get(`${BASE}/factures/${query}`);
    return res.data;
  } catch (error) {
    throw new Error('Erreur lors du chargement des factures');
  }
};

export const fetchFactureById = async (id) => {
  try {
    const res = await api.get(`${BASE}/factures/${id}/`);
    return res.data;
  } catch (error) {
    throw new Error('Facture introuvable');
  }
};

export const createFacture = async (data) => {
  try {
    const res = await api.post(`${BASE}/factures/`, data);
    return res.data;
  } catch (error) {
    if (error.response?.status === 400) {
      const msgs = Object.entries(error.response.data)
        .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`)
        .join('\n');
      throw new Error(`Données invalides :\n${msgs}`);
    }
    throw new Error('Erreur lors de la création de la facture');
  }
};

export const updateFacture = async (id, data) => {
  try {
    const res = await api.patch(`${BASE}/factures/${id}/`, data);
    return res.data;
  } catch (error) {
    throw new Error('Erreur lors de la mise à jour de la facture');
  }
};

export const deleteFacture = async (id) => {
  try {
    await api.delete(`${BASE}/factures/${id}/`);
  } catch (error) {
    throw new Error('Erreur lors de la suppression');
  }
};

export const enregistrerPaiement = async (id, montantPaye) => {
  try {
    const res = await api.post(`${BASE}/factures/${id}/paiement/`, {
      montant_paye: montantPaye,
    });
    return res.data;
  } catch (error) {
    const msg = error.response?.data?.error || 'Erreur lors de l\'enregistrement du paiement';
    throw new Error(msg);
  }
};

// =============================================================================
// LIGNES FACTURE
// =============================================================================

export const fetchLignesFacture = async (factureId) => {
  try {
    const res = await api.get(`${BASE}/factures/${factureId}/lignes/`);
    return res.data;
  } catch (error) {
    throw new Error('Erreur lors du chargement des lignes');
  }
};

export const addLigneFacture = async (factureId, ligneData) => {
  try {
    const res = await api.post(`${BASE}/factures/${factureId}/lignes/`, ligneData);
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

export const updateLigneFacture = async (ligneId, ligneData) => {
  try {
    const res = await api.patch(`${BASE}/lignes-factures/${ligneId}/`, ligneData);
    return res.data;
  } catch (error) {
    throw new Error('Erreur lors de la mise à jour de la ligne');
  }
};

export const deleteLigneFacture = async (ligneId) => {
  try {
    await api.delete(`${BASE}/lignes-factures/${ligneId}/`);
  } catch (error) {
    throw new Error('Erreur lors de la suppression de la ligne');
  }
};
