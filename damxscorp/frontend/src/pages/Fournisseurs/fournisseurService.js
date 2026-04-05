// /frontend/src/pages/Fournisseurs/fournisseurService.js
// Toutes les fonctions qui parlent à l'API Django pour les fournisseurs
import axios from 'axios';

// Si REACT_APP_API_URL est vide → URLs relatives (/api/...)
// Le proxy craco redirige /api → http://localhost:8000
// Fonctionne en local ET sur GitHub Codespaces.
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // withCredentials retiré : inutile avec le proxy et cause des erreurs CSRF
});

// ── FOURNISSEURS CRUD ────────────────────────────────────────────────────────

/** Récupère tous les fournisseurs (actifs seulement si actifOnly=true) */
export const fetchFournisseurs = async (actifOnly = false) => {
  const params = actifOnly ? '?actif=true' : '';
  const response = await api.get(`/fournisseurs/${params}`);
  return response.data;
};

/** Récupère un seul fournisseur par son ID */
export const fetchFournisseur = async (id) => {
  const response = await api.get(`/fournisseurs/${id}/`);
  return response.data;
};

/** Crée un nouveau fournisseur */
export const createFournisseur = async (data) => {
  try {
    const response = await api.post('/fournisseurs/', data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la création du fournisseur');
  }
};

/** Met à jour un fournisseur (envoi complet de l'objet) */
export const updateFournisseur = async (id, data) => {
  try {
    const response = await api.put(`/fournisseurs/${id}/`, data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la modification du fournisseur');
  }
};

/** Toggle favori ou actif/inactif (envoi partiel — juste le champ modifié) */
export const patchFournisseur = async (id, data) => {
  const response = await api.patch(`/fournisseurs/${id}/`, data);
  return response.data;
};

/** Supprime un fournisseur (refuse si des pièces sont liées) */
export const deleteFournisseur = async (id) => {
  try {
    await api.delete(`/fournisseurs/${id}/`);
  } catch (error) {
    const msg = error.response?.data?.error || 'Erreur lors de la suppression';
    throw new Error(msg);
  }
};

// ── ALERTES STOCK ────────────────────────────────────────────────────────────

/**
 * Récupère les fournisseurs qui ont au moins une pièce en alerte.
 * Utilisé pour le mini-dashboard en haut de la page.
 */
export const fetchFournisseursAvecAlertes = async () => {
  const response = await api.get('/fournisseurs/alertes/');
  return response.data;
};

/**
 * Récupère les pièces en alerte ou en rupture depuis l'API stock.
 * Utilisé pour les compteurs du header.
 */
export const fetchPiecesEnAlerte = async () => {
  const response = await api.get('/stock/pieces/');
  const pieces = response.data;
  return {
    alerte: pieces.filter(p => p.stock_status === 'ALERTE'),
    rupture: pieces.filter(p => p.stock_status === 'RUPTURE'),
  };
};

// ── EMAIL DE COMMANDE ────────────────────────────────────────────────────────

/**
 * Génère les données de l'email pré-rempli pour un fournisseur.
 * Retourne : { fournisseur_nom, email_destinataire, sujet, corps, pieces[] }
 */
export const fetchEmailCommande = async (fournisseurId) => {
  const response = await api.get(`/fournisseurs/${fournisseurId}/email-commande/`);
  return response.data;
};
