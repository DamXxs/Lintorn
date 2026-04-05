// /frontend/src/pages/Stock/stockService.js
import { fetchPieces, savePiece, updatePiece, deletePiece } from '../services/api';
import { STOCK_ALERTS } from './constants';
import logger from './logger';

/**
 * 📦 SERVICE STOCK
 * 
 * Gère toute la logique métier autour du stock de pièces :
 * - Alertes de stock (critique, faible, OK)
 * - Génération d'emails de commande pour fournisseurs
 * - Historique d'utilisation des pièces
 * - Statistiques et prévisions
 */

// ========================================================================
// RÉCUPÉRATION DES DONNÉES
// ========================================================================

/**
 * Récupère toutes les pièces avec niveau d'alerte calculé
 */
export const getAllPieces = async () => {
  try {
    const pieces = await fetchPieces();
    
    // Ajouter le niveau d'alerte à chaque pièce
    const piecesWithAlerts = pieces.map(piece => ({
      ...piece,
      alertLevel: getAlertLevel(piece.quantite),
      alertColor: getAlertColor(piece.quantite),
    }));
    
    logger.success(`${pieces.length} pièces chargées`);
    return piecesWithAlerts;
  } catch (error) {
    logger.error('Erreur lors du chargement du stock', error);
    throw error;
  }
};

/**
 * Récupère une pièce par son ID
 */
export const getPieceById = async (pieceId) => {
  try {
    const allPieces = await getAllPieces();
    return allPieces.find(p => p.id === pieceId);
  } catch (error) {
    logger.error(`Erreur lors du chargement de la pièce ${pieceId}`, error);
    throw error;
  }
};

/**
 * Recherche une pièce par référence, nom ou fournisseur
 */
export const searchPieces = async (query) => {
  try {
    const allPieces = await getAllPieces();
    const lowercaseQuery = query.toLowerCase();
    
    return allPieces.filter(piece => 
      piece.reference?.toLowerCase().includes(lowercaseQuery) ||
      piece.nom?.toLowerCase().includes(lowercaseQuery) ||
      piece.fournisseur?.toLowerCase().includes(lowercaseQuery)
    );
  } catch (error) {
    logger.error('Erreur lors de la recherche de pièces', error);
    throw error;
  }
};

// ========================================================================
// ALERTES DE STOCK
// ========================================================================

/**
 * Récupère uniquement les pièces en alerte (critique ou faible)
 */
export const getPiecesEnAlerte = async () => {
  try {
    const allPieces = await getAllPieces();
    const alertes = allPieces.filter(p => p.alertLevel !== 'OK');
    
    logger.warning(`${alertes.length} pièces en alerte détectées`);
    return alertes;
  } catch (error) {
    logger.error('Erreur lors du chargement des alertes stock', error);
    throw error;
  }
};

/**
 * Récupère les pièces en rupture de stock (quantité = 0)
 */
export const getPiecesEnRupture = async () => {
  try {
    const allPieces = await getAllPieces();
    return allPieces.filter(p => p.quantite === 0);
  } catch (error) {
    logger.error('Erreur lors du chargement des ruptures de stock', error);
    throw error;
  }
};

/**
 * Détermine le niveau d'alerte selon la quantité
 * @param {number} quantite - Quantité en stock
 * @returns {string} - 'CRITIQUE', 'FAIBLE' ou 'OK'
 */
const getAlertLevel = (quantite) => {
  if (quantite <= STOCK_ALERTS.CRITIQUE) return 'CRITIQUE';
  if (quantite <= STOCK_ALERTS.FAIBLE) return 'FAIBLE';
  return 'OK';
};

/**
 * Retourne la couleur d'alerte pour l'UI
 */
const getAlertColor = (quantite) => {
  const level = getAlertLevel(quantite);
  const colors = {
    CRITIQUE: '#e74c3c', // Rouge
    FAIBLE: '#f39c12',   // Orange
    OK: '#27ae60',       // Vert
  };
  return colors[level];
};

// ========================================================================
// GÉNÉRATION D'EMAILS DE COMMANDE
// ========================================================================

/**
 * Génère un email de commande pour un fournisseur
 * @param {Array} pieces - Liste des pièces à commander
 * @param {Object} fournisseur - Infos du fournisseur
 * @returns {Object} - Données de l'email (to, subject, body, mailtoLink)
 */
export const generateOrderEmail = (pieces, fournisseur) => {
  try {
    const today = new Date().toLocaleDateString('fr-FR');
    const subject = `Commande de pièces - ${today}`;
    
    // Construction du corps de l'email
    const piecesList = pieces.map(p => 
      `- ${p.reference} : ${p.nom} (Quantité : ${p.quantiteCommande || 'À définir'})`
    ).join('\n');
    
    const body = `
Bonjour,

Je souhaite passer commande pour les pièces suivantes :

${piecesList}

Pourriez-vous me confirmer les disponibilités et délais de livraison ?

Cordialement,
DamXsCorp - Garage
    `.trim();
    
    // Lien mailto pour ouvrir le client email
    const mailtoLink = `mailto:${fournisseur.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    logger.info(`Email de commande généré pour ${fournisseur.nom}`, { pieces: pieces.length });
    
    return {
      to: fournisseur.email,
      subject,
      body,
      mailtoLink,
    };
  } catch (error) {
    logger.error('Erreur lors de la génération de l\'email de commande', error);
    throw error;
  }
};

/**
 * Génère une liste de commande pour plusieurs fournisseurs
 * @param {Array} pieces - Pièces groupées par fournisseur
 * @returns {Array} - Liste d'emails à générer
 */
export const generateBulkOrderEmails = (pieces) => {
  try {
    // Grouper les pièces par fournisseur
    const byFournisseur = pieces.reduce((acc, piece) => {
      const fournisseurNom = piece.fournisseur || 'Non défini';
      if (!acc[fournisseurNom]) {
        acc[fournisseurNom] = [];
      }
      acc[fournisseurNom].push(piece);
      return acc;
    }, {});
    
    // Générer un email par fournisseur
    const emails = Object.entries(byFournisseur).map(([fournisseurNom, piecesList]) => {
      // TODO: Récupérer les vraies infos du fournisseur depuis la base
      const fournisseur = {
        nom: fournisseurNom,
        email: `contact@${fournisseurNom.toLowerCase().replace(/\s/g, '')}.fr`,
      };
      
      return generateOrderEmail(piecesList, fournisseur);
    });
    
    logger.success(`${emails.length} emails de commande générés`);
    return emails;
  } catch (error) {
    logger.error('Erreur lors de la génération des emails groupés', error);
    throw error;
  }
};

// ========================================================================
// GESTION DES MOUVEMENTS DE STOCK
// ========================================================================

/**
 * Enregistre une entrée de stock (réception de commande)
 */
export const addStock = async (pieceId, quantite, notes = '') => {
  try {
    const piece = await getPieceById(pieceId);
    const nouvelleQuantite = piece.quantite + quantite;
    
    // TODO: Mettre à jour la pièce + enregistrer le mouvement dans l'historique
    logger.success(`+${quantite} unités ajoutées à la pièce ${piece.reference}`);
    
    return nouvelleQuantite;
  } catch (error) {
    logger.error(`Erreur lors de l'ajout de stock pour la pièce ${pieceId}`, error);
    throw error;
  }
};

/**
 * Enregistre une sortie de stock (utilisation sur intervention)
 */
export const removeStock = async (pieceId, quantite, interventionId, notes = '') => {
  try {
    const piece = await getPieceById(pieceId);
    
    if (piece.quantite < quantite) {
      throw new Error('Stock insuffisant');
    }
    
    const nouvelleQuantite = piece.quantite - quantite;
    
    // TODO: Mettre à jour la pièce + enregistrer le mouvement + lier à l'intervention
    logger.success(`-${quantite} unités retirées de la pièce ${piece.reference}`);
    
    return nouvelleQuantite;
  } catch (error) {
    logger.error(`Erreur lors du retrait de stock pour la pièce ${pieceId}`, error);
    throw error;
  }
};

// ========================================================================
// STATISTIQUES
// ========================================================================

/**
 * Calcule les statistiques du stock
 */
export const getStockStatistics = async () => {
  try {
    const allPieces = await getAllPieces();
    
    const stats = {
      total: allPieces.length,
      critique: allPieces.filter(p => p.alertLevel === 'CRITIQUE').length,
      faible: allPieces.filter(p => p.alertLevel === 'FAIBLE').length,
      ok: allPieces.filter(p => p.alertLevel === 'OK').length,
      rupture: allPieces.filter(p => p.quantite === 0).length,
      valeurTotale: allPieces.reduce((sum, p) => sum + (p.prix_unitaire * p.quantite), 0),
    };
    
    logger.info('Statistiques stock calculées', stats);
    return stats;
  } catch (error) {
    logger.error('Erreur lors du calcul des statistiques stock', error);
    throw error;
  }
};

/**
 * Calcule les pièces les plus utilisées
 */
export const getMostUsedPieces = async (limit = 10) => {
  try {
    // TODO: Récupérer l'historique des mouvements de stock
    // et calculer les pièces les plus sorties
    logger.info(`Récupération des ${limit} pièces les plus utilisées`);
    return [];
  } catch (error) {
    logger.error('Erreur lors du calcul des pièces les plus utilisées', error);
    throw error;
  }
};

// ========================================================================
// PRÉVISIONS
// ========================================================================

/**
 * Prédit les besoins de réapprovisionnement basé sur l'historique
 */
export const predictRestockNeeds = async () => {
  try {
    // TODO: Algorithme de prévision basé sur :
    // - Historique d'utilisation
    // - Saisonnalité
    // - Tendances
    
    logger.info('Calcul des prévisions de réapprovisionnement');
    return [];
  } catch (error) {
    logger.error('Erreur lors du calcul des prévisions', error);
    throw error;
  }
};

export default {
  getAllPieces,
  getPieceById,
  searchPieces,
  getPiecesEnAlerte,
  getPiecesEnRupture,
  generateOrderEmail,
  generateBulkOrderEmails,
  addStock,
  removeStock,
  getStockStatistics,
  getMostUsedPieces,
  predictRestockNeeds,
};