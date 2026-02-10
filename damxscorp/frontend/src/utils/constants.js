// /frontend/src/utils/constants.js

/**
 * 🗂️ CONSTANTES DE L'APPLICATION
 * 
 * Centralise toutes les valeurs fixes utilisées dans l'application.
 * Un seul endroit pour gérer les listes déroulantes, statuts, etc.
 */

// ========================================================================
// DÉPARTEMENTS / TYPES DE RDV
// ========================================================================
export const DEPARTEMENTS = {
  ATELIER: { value: 'ATELIER', label: '🔧 ATELIER', description: 'Mécanique' },
  ACADEMIE: { value: 'ACADEMIE', label: '🎓 ACADÉMIE', description: 'Cours' },
};

// ========================================================================
// TYPES DE VÉHICULES
// ========================================================================
export const VEHICLE_TYPES = {
  VOITURE: { value: 'VOITURE', label: '🚗 Voiture' },
  MOTO: { value: 'MOTO', label: '🏍️ Moto' },
  MOTOCULTURE: { value: 'MOTOCULTURE', label: '🚜 Motoculture' },
  BATEAU: { value: 'BATEAU', label: '🚤 Bateau' },
};

// ========================================================================
// TYPES D'INTERVENTIONS
// ========================================================================
export const INTERVENTION_TYPES = {
  ENTRETIEN_VP2: { value: 'ENTRETIEN_VP2', label: 'Entretien VP2 (Petite vidange)' },
  ENTRETIEN_VP4: { value: 'ENTRETIEN_VP4', label: 'Entretien VP4 (Grosse vidange)' },
  DIAGNOSTIQUE: { value: 'DIAGNOSTIQUE', label: 'Diagnostique' },
  PNEUMATIQUES: { value: 'PNEUMATIQUES', label: 'Pneumatiques' },
  REVISION_COMPLETE: { value: 'REVISION_COMPLETE', label: 'Révision complète' },
  AUTRE: { value: 'AUTRE', label: 'Autre' },
};

// ========================================================================
// STATUTS DE RENDEZ-VOUS
// ========================================================================
export const STATUTS_RDV = {
  PLANIFIE: { value: 'PLANIFIE', label: '📅 Planifié', class: 'planifie' },
  EN_COURS: { value: 'EN_COURS', label: '⚙️ En cours', class: 'en-cours' },
  TERMINE: { value: 'TERMINE', label: '✅ Terminé', class: 'termine' },
  ANNULE: { value: 'ANNULE', label: '❌ Annulé', class: 'annule' },
};

// ========================================================================
// HELPERS (fonctions utilitaires)
// ========================================================================

/**
 * Récupère le label d'un département
 */
export const getDepartementLabel = (value) => {
  return DEPARTEMENTS[value]?.label || value;
};

/**
 * Récupère la description d'un département
 */
export const getDepartementDescription = (value) => {
  return DEPARTEMENTS[value]?.description || '';
};

/**
 * Récupère le label d'un statut
 */
export const getStatutLabel = (value) => {
  return STATUTS_RDV[value]?.label || value;
};

/**
 * Récupère la classe CSS d'un statut
 */
export const getStatutClass = (value) => {
  return STATUTS_RDV[value]?.class || 'planifie';
};

// ===================================================================//
// SEUILS DE STOCK
// ===================================================================//
export const STOCK_ALERTS = {
  CRITIQUE: 5,
  FAIBLE: 10,
  OK: 20,

};
