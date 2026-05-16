// /frontend/src/pages/RendezVous/rdvService.js
import {
  fetchInterventions,
  fetchInterventionsByClient,
  fetchInterventionsByVehicule,
  saveIntervention,
  updateIntervention,
  patchIntervention,
  deleteIntervention,
} from '../../services/api';
import logger from '../../utils/logger';

/**
 * 📅 SERVICE RENDEZ-VOUS 
 *
 * Couche intermédiaire entre les composants RDV/Planning et api.js.
 * Contient aussi les constantes et helpers propres aux RDV.
 *
 * Remplace constants.js (supprimé) pour tout ce qui concerne les RDV.
 */

// ── STATUTS ───────────────────────────────────────────────────────
// Valeurs fixes côté Django (choix fermés du modèle).
// Non configurables dans Paramètres.
export const STATUTS_RDV = {
  PLANIFIE:    { value: 'PLANIFIE',    label: '📅 Planifié',      class: 'planifie'    },
  RECEPTIONNE: { value: 'RECEPTIONNE', label: '🔧 Réceptionné',   class: 'receptionne' },
  EN_COURS:    { value: 'EN_COURS',    label: '⚙️ En cours',      class: 'en-cours'    },
  TERMINE:     { value: 'TERMINE',     label: '✅ Terminé',       class: 'termine'     },
  ANNULE:      { value: 'ANNULE',      label: '❌ Annulé',        class: 'annule'      },
};

// ── HELPERS STATUT ────────────────────────────────────────────────

export const getStatutLabel = (value) => {
  return STATUTS_RDV[value]?.label || value;
};

export const getStatutClass = (value) => {
  return STATUTS_RDV[value]?.class || 'planifie';
};

/**
 * Retourne le label d'un département.
 * Les vrais labels viennent de fetchDepartements() —
 * ce helper formate la valeur brute en fallback lisible.
 * ex: 'ATELIER' → 'Atelier'
 */
export const getDepartementLabel = (value) => {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

// ── COULEURS PLANNING ─────────────────────────────────────────────

/**
 * Retourne les couleurs d'un événement FullCalendar
 * selon le statut et la couleur du département.
 */
export const getEventColors = (intervention) => {
  const { statut, departement } = intervention;
  if (statut === 'ANNULE')      return { backgroundColor: '#7f8c8d', borderColor: '#95a5a6' };
  if (statut === 'TERMINE')     return { backgroundColor: '#27ae60', borderColor: '#2ecc71' };
  if (statut === 'EN_COURS')    return { backgroundColor: '#e67e22', borderColor: '#f39c12' };
  if (statut === 'RECEPTIONNE') return { backgroundColor: '#8e44ad', borderColor: '#9b59b6' };
  const color = departement?.couleur || '#2980b9';
  return { backgroundColor: color, borderColor: color };
};

/**
 * Transforme une liste d'interventions Django
 * en événements formatés pour FullCalendar.
 */
export const formatEventsForCalendar = (interventions) => {
  return interventions.map(intervention => {
    const colors = getEventColors(intervention);
    return {
      id:              intervention.id,
      title:           intervention.title ||
                       `${intervention.client_nom} - ${intervention.type_rdv}`,
      start:           intervention.start || intervention.date_debut,
      end:             intervention.end   || intervention.date_fin,
      backgroundColor: colors.backgroundColor,
      borderColor:     colors.borderColor,
      textColor:       'white',
      extendedProps:   intervention,
    };
  });
};

// ── RÉCUPÉRATION ──────────────────────────────────────────────────

export const getAllRdvs = async () => {
  try {
    logger.info('Chargement de tous les RDV');
    const data = await fetchInterventions();
    logger.success(`${data.length} RDV chargés`);
    return data;
  } catch (error) {
    logger.error('Erreur chargement RDV', error);
    throw error;
  }
};

export const getRdvsByClient = async (clientId) => {
  try {
    logger.info(`Chargement des RDV du client ${clientId}`);
    const data = await fetchInterventionsByClient(clientId);
    logger.success(`${data.length} RDV chargés pour le client ${clientId}`);
    return data;
  } catch (error) {
    logger.error(`Erreur chargement RDV client ${clientId}`, error);
    throw error;
  }
};

export const getRdvsByVehicule = async (vehiculeId) => {
  try {
    logger.info(`Chargement des RDV du véhicule ${vehiculeId}`);
    const data = await fetchInterventionsByVehicule(vehiculeId);
    logger.success(`${data.length} RDV chargés pour le véhicule ${vehiculeId}`);
    return data;
  } catch (error) {
    logger.error(`Erreur chargement RDV véhicule ${vehiculeId}`, error);
    throw error;
  }
};

// ── CRÉATION / MODIFICATION / SUPPRESSION ─────────────────────────

export const addRdv = async (djangoData) => {
  try {
    logger.info('Création d\'un nouveau RDV', djangoData);
    const result = await saveIntervention(djangoData);
    logger.success('RDV créé', result);
    return result;
  } catch (error) {
    logger.error('Erreur création RDV', error);
    throw error;
  }
};

export const editRdv = async (id, djangoData) => {
  try {
    logger.info(`Modification du RDV ${id}`, djangoData);
    const result = await updateIntervention(id, djangoData);
    logger.success(`RDV ${id} modifié`, result);
    return result;
  } catch (error) {
    logger.error(`Erreur modification RDV ${id}`, error);
    throw error;
  }
};

export const patchRdv = async (id, data) => {
  try {
    logger.info(`Patch RDV ${id}`, data);
    const result = await patchIntervention(id, data);
    logger.success(`RDV ${id} patché`, result);
    return result;
  } catch (error) {
    logger.error(`Erreur patch RDV ${id}`, error);
    throw error;
  }
};

export const removeRdv = async (id) => {
  try {
    logger.info(`Suppression du RDV ${id}`);
    await deleteIntervention(id);
    logger.success(`RDV ${id} supprimé`);
  } catch (error) {
    logger.error(`Erreur suppression RDV ${id}`, error);
    throw error;
  }
};

// ── RECHERCHE (côté frontend) ─────────────────────────────────────

export const searchRdvs = (rdvs, query) => {
  if (!query || query.trim() === '') return rdvs;
  const q = query.toLowerCase().trim();
  return rdvs.filter(r =>
    r.description?.toLowerCase().includes(q)          ||
    r.client_nom?.toLowerCase().includes(q)           ||
    r.client_prenom?.toLowerCase().includes(q)        ||
    r.type_rdv?.toLowerCase().includes(q)             ||
    r.type_intervention?.toLowerCase().includes(q)    ||
    r.vehicule_immatriculation?.toLowerCase().includes(q)
  );
};