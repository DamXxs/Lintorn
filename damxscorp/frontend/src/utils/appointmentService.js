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
 * Gère toute la logique métier autour des rendez-vous :
 * - Vérification de disponibilité des créneaux
 * - Statistiques du planning
 * - Filtrage par date/client/véhicule
 * - Transformation pour FullCalendar
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
      title: `${intervention.client_nom} - ${intervention.type_intervention || intervention.type_rdv}`,
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
 * Récupère les interventions d'un véhicule spécifique
 */
export const getInterventionsByVehicle = async (vehicleId) => {
  try {
    const allInterventions = await fetchInterventions();
    return allInterventions.filter(i => i.vehicule_id === vehicleId);
  } catch (error) {
    logger.error(`Erreur lors du chargement des interventions du véhicule ${vehicleId}`, error);
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

/**
 * Récupère les interventions d'une période donnée
 */
export const getInterventionsByDateRange = async (startDate, endDate) => {
  try {
    const allInterventions = await fetchInterventions();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return allInterventions.filter(i => {
      const interventionDate = new Date(i.date_debut);
      return interventionDate >= start && interventionDate <= end;
    });
  } catch (error) {
    logger.error('Erreur lors du chargement des interventions par période', error);
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
    // Vérifier la disponibilité du créneau
    const isAvailable = await isSlotAvailable(
      `${formData.dateStart}T${formData.timeStart}:00`,
      `${formData.dateEnd}T${formData.timeEnd}:00`
    );
    
    if (!isAvailable) {
      logger.warning('Créneau non disponible', { formData });
      throw new Error('Ce créneau horaire est déjà occupé');
    }
    
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
    // Vérifier la disponibilité (en excluant l'intervention en cours de modification)
    const isAvailable = await isSlotAvailable(
      `${formData.dateStart}T${formData.timeStart}:00`,
      `${formData.dateEnd}T${formData.timeEnd}:00`,
      id
    );
    
    if (!isAvailable) {
      logger.warning('Créneau non disponible pour modification', { id, formData });
      throw new Error('Ce créneau horaire est déjà occupé');
    }
    
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
// LOGIQUE MÉTIER - CRÉNEAUX HORAIRES
// ========================================================================

/**
 * Vérifie si un créneau est disponible
 * @param {string} dateDebut - Format ISO (ex: "2026-02-11T08:00:00")
 * @param {string} dateFin - Format ISO (ex: "2026-02-11T09:00:00")
 * @param {number} excludeId - ID de l'intervention à exclure (pour modification)
 * @returns {boolean} - true si disponible, false sinon
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
      
      // Chevauchement si : (newStart < end) ET (newEnd > start)
      return (newStart < end && newEnd > start);
    });
    
    if (conflicts.length > 0) {
      logger.warning('Créneaux en conflit détectés', conflicts);
    }
    
    return conflicts.length === 0;
  } catch (error) {
    logger.error('Erreur lors de la vérification de disponibilité', error);
    return false;
  }
};

/**
 * Trouve les créneaux disponibles pour une date donnée
 * @param {string} date - Format YYYY-MM-DD
 * @param {number} durationMinutes - Durée souhaitée en minutes
 * @returns {Array} - Liste des créneaux disponibles
 */
export const findAvailableSlots = async (date, durationMinutes = 60) => {
  try {
    const allInterventions = await fetchInterventions();
    
    // Interventions du jour
    const dayInterventions = allInterventions.filter(i => {
      const interventionDate = new Date(i.date_debut).toISOString().split('T')[0];
      return interventionDate === date;
    }).sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut));
    
    // Horaires d'ouverture (à adapter selon tes besoins)
    const openingTime = 8; // 8h
    const closingTime = 18; // 18h
    
    const availableSlots = [];
    let currentTime = new Date(`${date}T${openingTime.toString().padStart(2, '0')}:00:00`);
    const endOfDay = new Date(`${date}T${closingTime.toString().padStart(2, '0')}:00:00`);
    
    dayInterventions.forEach(intervention => {
      const interventionStart = new Date(intervention.date_debut);
      
      // Si il y a un gap entre currentTime et le début de l'intervention
      if (currentTime < interventionStart) {
        const slotDuration = (interventionStart - currentTime) / (1000 * 60); // en minutes
        
        if (slotDuration >= durationMinutes) {
          availableSlots.push({
            start: currentTime.toISOString(),
            end: interventionStart.toISOString(),
            duration: slotDuration,
          });
        }
      }
      
      // Avancer currentTime à la fin de l'intervention
      currentTime = new Date(intervention.date_fin);
    });
    
    // Vérifier s'il reste du temps après la dernière intervention
    if (currentTime < endOfDay) {
      const slotDuration = (endOfDay - currentTime) / (1000 * 60);
      
      if (slotDuration >= durationMinutes) {
        availableSlots.push({
          start: currentTime.toISOString(),
          end: endOfDay.toISOString(),
          duration: slotDuration,
        });
      }
    }
    
    logger.info(`${availableSlots.length} créneaux disponibles trouvés pour le ${date}`);
    return availableSlots;
  } catch (error) {
    logger.error('Erreur lors de la recherche de créneaux disponibles', error);
    throw error;
  }
};

// ========================================================================
// STATISTIQUES
// ========================================================================

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
      atelier: allInterventions.filter(i => i.type_rdv === 'ATELIER').length,
      academie: allInterventions.filter(i => i.type_rdv === 'ACADEMIE').length,
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
  getInterventionsByVehicle,
  getTodayInterventions,
  getInterventionsByDateRange,
  createIntervention,
  modifyIntervention,
  removeIntervention,
  isSlotAvailable,
  findAvailableSlots,
  getStatistics,
};