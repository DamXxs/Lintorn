// /frontend/src/utils/appointmentService.js
import { 
  fetchInterventions, 
  saveIntervention, 
  updateIntervention, 
  deleteIntervention 
} from '../services/api';
import { formatInterventionForDjango, formatInterventionForReact } from './dataFormatters';
import logger from './logger';

/**
 * 🔧 SERVICE INTERVENTIONS / RENDEZ-VOUS
 * 
 * Orchestre la logique métier autour des rendez-vous.
 * Utilise api.js pour les appels HTTP et dataFormatters pour les conversions.
 */

// ========================================================================
// RÉCUPÉRATION DES DONNÉES
// ========================================================================

/**
 * Récupère toutes les interventions et les formate pour FullCalendar
 */
export const getAllInterventions = async () => {
  try {
    const data = await fetchInterventions();
    
    // Transformation pour FullCalendar
    const events = data.map(intervention => ({
      id: intervention.id,
      title: `${intervention.client_nom} - ${intervention.type_intervention}`,
      start: intervention.date_debut,
      end: intervention.date_fin,
      backgroundColor: getColorByDepartement(intervention.type_rdv),
      borderColor: getColorByDepartement(intervention.type_rdv),
      extendedProps: intervention, // Données complètes pour InfoPanel
    }));
    
    logger.success(`${events.length} interventions chargées`);
    return events;
  } catch (error) {
    logger.error('Erreur lors du chargement des interventions', error);
    throw error;
  }
};

/**
 * Récupère les interventions d'un client spécifique
 */
export const getInterventionsByClient = async (clientId) => {
  try {
    const allInterventions = await fetchInterventions();
    return allInterventions.filter(i => i.client_id === clientId);
  } catch (error) {
    logger.error(`Erreur lors du chargement des interventions du client ${clientId}`, error);
    throw error;
  }
};

/**
 * Récupère les interventions d'aujourd'hui
 */
export const getTodayInterventions = async () => {
  try {
    const allInterventions = await fetchInterventions();
    const today = new Date().toISOString().split('T')[0];
    
    return allInterventions.filter(i => {
      const interventionDate = new Date(i.date_debut).toISOString().split('T')[0];
      return interventionDate === today;
    });
  } catch (error) {
    logger.error('Erreur lors du chargement des interventions du jour', error);
    throw error;
  }
};

// ========================================================================
// CRÉATION / MODIFICATION / SUPPRESSION
// ========================================================================

/**
 * Crée une nouvelle intervention
 */
export const createIntervention = async (formData) => {
  try {
    const djangoData = formatInterventionForDjango(formData);
    const result = await saveIntervention(djangoData);
    logger.success('Intervention créée', result);
    return result;
  } catch (error) {
    logger.error('Erreur lors de la création de l\'intervention', error);
    throw error;
  }
};

/**
 * Modifie une intervention existante
 */
export const modifyIntervention = async (id, formData) => {
  try {
    const djangoData = formatInterventionForDjango(formData);
    const result = await updateIntervention(id, djangoData);
    logger.success(`Intervention ${id} modifiée`, result);
    return result;
  } catch (error) {
    logger.error(`Erreur lors de la modification de l'intervention ${id}`, error);
    throw error;
  }
};

/**
 * Supprime une intervention
 */
export const removeIntervention = async (id) => {
  try {
    await deleteIntervention(id);
    logger.success(`Intervention ${id} supprimée`);
  } catch (error) {
    logger.error(`Erreur lors de la suppression de l'intervention ${id}`, error);
    throw error;
  }
};

// ========================================================================
// LOGIQUE MÉTIER
// ========================================================================

/**
 * Vérifie si un créneau est disponible
 */
export const isSlotAvailable = async (dateDebut, dateFin, excludeId = null) => {
  try {
    const allInterventions = await fetchInterventions();
    
    const conflicts = allInterventions.filter(i => {
      // Exclure l'intervention en cours de modification
      if (excludeId && i.id === excludeId) return false;
      
      // Vérifier les chevauchements
      const start = new Date(i.date_debut);
      const end = new Date(i.date_fin);
      const newStart = new Date(dateDebut);
      const newEnd = new Date(dateFin);
      
      return (newStart < end && newEnd > start);
    });
    
    return conflicts.length === 0;
  } catch (error) {
    logger.error('Erreur lors de la vérification de disponibilité', error);
    return false;
  }
};

/**
 * Calcule les statistiques du planning
 */
export const getStatistics = async () => {
  try {
    const allInterventions = await fetchInterventions();
    
    return {
      total: allInterventions.length,
      planifies: allInterventions.filter(i => i.statut === 'PLANIFIE').length,
      enCours: allInterventions.filter(i => i.statut === 'EN_COURS').length,
      termines: allInterventions.filter(i => i.statut === 'TERMINE').length,
      annules: allInterventions.filter(i => i.statut === 'ANNULE').length,
    };
  } catch (error) {
    logger.error('Erreur lors du calcul des statistiques', error);
    throw error;
  }
};

// ========================================================================
// HELPERS
// ========================================================================

/**
 * Détermine la couleur selon le département
 */
const getColorByDepartement = (typeRdv) => {
  const colors = {
    ATELIER: '#3788d8',   // Bleu
    ACADEMIE: '#f39c12',  // Orange
  };
  return colors[typeRdv] || '#95a5a6';
};

export default {
  getAllInterventions,
  getInterventionsByClient,
  getTodayInterventions,
  createIntervention,
  modifyIntervention,
  removeIntervention,
  isSlotAvailable,
  getStatistics,
};