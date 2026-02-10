// /frontend/src/utils/stockService.js
import { fetchPieces, savePiece, updatePiece, deletePiece } from '../services/api';
import { STOCK_ALERTS } from './constants';
import logger from './logger';

/**
 * 📦 SERVICE STOCK
 * 
 * Gère la logique métier autour du stock de pièces
 */

/**
 * Récupère toutes les pièces avec niveau d'alerte
 */
export const getAllPieces = async () => {
  try {
    const pieces = await fetchPieces();
    
    // Ajouter le niveau d'alerte à chaque pièce
    return pieces.map(piece => ({
      ...piece,
      alertLevel: getAlertLevel(piece.quantite),
    }));
  } catch (error) {
    logger.error('Erreur lors du chargement du stock', error);
    throw error;
  }
};

/**
 * Récupère uniquement les pièces en alerte
 */
export const getPiecesEnAlerte = async () => {
  try {
    const allPieces = await getAllPieces();
    return allPieces.filter(p => p.alertLevel !== 'OK');
  } catch (error) {
    logger.error('Erreur lors du chargement des alertes stock', error);
    throw error;
  }
};

/**
 * Génère un email de commande pour un fournisseur
 */
export const generateOrderEmail = (pieces, fournisseur) => {
  const subject = `Commande de pièces - ${new Date().toLocaleDateString()}`;
  
  const body = `
Bonjour,

Je souhaite commander les pièces suivantes :

${pieces.map(p => `- ${p.reference} : ${p.nom} (Quantité : ${p.quantiteCommande || 1})`).join('\n')}

Cordialement,
  `.trim();
  
  return {
    to: fournisseur.email,
    subject,
    body,
    mailtoLink: `mailto:${fournisseur.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  };
};

/**
 * Détermine le niveau d'alerte selon la quantité
 */
const getAlertLevel = (quantite) => {
  if (quantite <= STOCK_ALERTS.CRITIQUE) return 'CRITIQUE';
  if (quantite <= STOCK_ALERTS.FAIBLE) return 'FAIBLE';
  return 'OK';
};

export default {
  getAllPieces,
  getPiecesEnAlerte,
  generateOrderEmail,
};
