// /frontend/src/pages/Stock/stockService.js
import { fetchPieces, createPiece, updatePiece, deletePiece } from '../../services/api';
import logger from '../../utils/logger';

/**
 * 📦 SERVICE STOCK
 * Couche intermédiaire entre StockVueEnsemble.jsx et api.js
 * Toute la logique métier du stock passe ici.
 */

// ── RÉCUPÉRATION ─────────────────────────────────────────────────

export const getAllPieces = async () => {
  try {
    logger.info('Chargement de toutes les pièces');
    const pieces = await fetchPieces();
    logger.success(`${pieces.length} pièces chargées`);
    return pieces;
  } catch (error) {
    logger.error('Erreur lors du chargement du stock', error);
    throw error;
  }
};

// Recherche côté frontend (instantanée, pas d'appel API)
export const searchPieces = (pieces, query) => {
  if (!query || query.trim() === '') return pieces;
  const q = query.toLowerCase().trim();
  return pieces.filter(p =>
    p.nom?.toLowerCase().includes(q) ||
    p.reference?.toLowerCase().includes(q) ||
    p.fournisseur_nom?.toLowerCase().includes(q)
  );
};

// ── CRÉATION / MODIFICATION / SUPPRESSION ─────────────────────────

export const addPiece = async (formData) => {
  try {
    logger.info('Création d\'une nouvelle pièce', formData);
    const result = await createPiece(formData);
    logger.success('Pièce créée', result);
    return result;
  } catch (error) {
    logger.error('Erreur lors de la création de la pièce', error);
    throw error;
  }
};

export const editPiece = async (id, formData) => {
  try {
    logger.info(`Modification de la pièce ${id}`, formData);
    const result = await updatePiece(id, formData);
    logger.success(`Pièce ${id} modifiée`, result);
    return result;
  } catch (error) {
    logger.error(`Erreur lors de la modification de la pièce ${id}`, error);
    throw error;
  }
};

export const removePiece = async (id) => {
  try {
    logger.info(`Suppression de la pièce ${id}`);
    await deletePiece(id);
    logger.success(`Pièce ${id} supprimée`);
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la pièce ${id}`, error);
    throw error;
  }
};

// ── STATISTIQUES (calculées côté frontend) ───────────────────────

export const getStockStats = (pieces) => {
  return {
    total:   pieces.length,
    ok:      pieces.filter(p => p.stock_status === 'OK').length,
    alerte:  pieces.filter(p => p.stock_status === 'ALERTE').length,
    rupture: pieces.filter(p => p.stock_status === 'RUPTURE').length,
  };
};