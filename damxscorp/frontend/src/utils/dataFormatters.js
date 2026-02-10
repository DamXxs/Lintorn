// /frontend/src/utils/dataFormatters.js

import logger from './logger';

/**
 * 🔧 FORMATAGE DES DONNÉES POUR DJANGO
 * 
 * Centralise toutes les conversions de données entre React et Django.
 * Un seul endroit = moins d'erreurs !
 */

// ========================================================================
// INTERVENTIONS (Rendez-vous)
// ========================================================================

/**
 * Formate les données du formulaire de RDV pour Django
 * @param {Object} formData - Données brutes du formulaire
 * @returns {Object} - Données formatées pour Django
 */
export const formatInterventionForDjango = (formData) => {
  logger.format.before('Intervention', formData);
  // Combiner date + heure pour créer le format ISO attendu par Django
  const date_debut = `${formData.dateStart}T${formData.timeStart}:00`;
  const date_fin = `${formData.dateEnd}T${formData.timeEnd}:00`;

  const formatted = {
    type_rdv: formData.departement,
    type_intervention: formData.typeIntervention,
    date_debut: date_debut,
    date_fin: date_fin,
    description: formData.description || '',
    statut: formData.statut || 'PLANIFIE',
    client_nom: formData.clientName,
    client_prenom: formData.clientFirstName || '',
    client_phone: formData.clientPhone || '',
    client_email: formData.clientEmail || '',
    client_adresse: formData.clientAddress || '',
    vehicule_type: formData.vehicleType,
    vehicule_marque: formData.vehicleBrand || '',
    vehicule_modele: formData.vehicleModel || '',
    vehicule_annee: formData.vehicleYear || '',
    vehicule_vin: formData.vin || '',
  };

  logger.format.after('Intervention', formatted);
  return formatted;
};

/**
 * Formate les données Django pour affichage dans le formulaire React
 * @param {Object} djangoData - Données de Django
 * @returns {Object} - Données formatées pour React
 */
export const formatInterventionForReact = (djangoData) => {
  logger.format.before('Intervention (Django → React)', djangoData);

  const dateDebut = new Date(djangoData.date_debut);
  const dateFin = new Date(djangoData.date_fin);

  const formatted = {
    departement: djangoData.type_rdv,
    typeIntervention: djangoData.type_intervention,
    clientName: djangoData.client_nom,
    clientFirstName: djangoData.client_prenom || '',
    clientPhone: djangoData.client_phone || '',
    clientEmail: djangoData.client_email || '',
    clientAddress: djangoData.client_adresse || '',
    vehicleType: djangoData.vehicule_type,
    plate: djangoData.vehicule_immatriculation || '',
    vehicleBrand: djangoData.vehicule_marque || '',
    vehicleModel: djangoData.vehicule_modele || '',
    vehicleYear: djangoData.vehicule_annee || '',
    vin: djangoData.vehicule_vin || '',
    dateStart: dateDebut.toISOString().split('T')[0],
    timeStart: dateDebut.toTimeString().slice(0, 5),
    dateEnd: dateFin.toISOString().split('T')[0],
    timeEnd: dateFin.toTimeString().slice(0, 5),
    description: djangoData.description || '',
  };

logger.format.after('Intervention (Django → React)', formatted);
return formatted;
};

// ========================================================================
// CLIENTS (à venir)
// ========================================================================

/**
 * Formate les données client pour Django
 * TODO: À implémenter quand on fera la gestion clients
 */
export const formatClientForDjango = (formData) => {
  // À compléter plus tard
  return {};
};

// ========================================================================
// VÉHICULES (à venir)
// ========================================================================

/**
 * Formate les données véhicule pour Django
 * TODO: À implémenter quand on fera la gestion véhicules
 */
export const formatVehiculeForDjango = (formData) => {
  // À compléter plus tard
  return {};
};

// ========================================================================
// PIÈCES / STOCK (à venir)
// ========================================================================

/**
 * Formate les données de pièces pour Django
 * TODO: À implémenter quand on fera la gestion stock
 */
export const formatPieceForDjango = (formData) => {
  // À compléter plus tard
  return {};
};