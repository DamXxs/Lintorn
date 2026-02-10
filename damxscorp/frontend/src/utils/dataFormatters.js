// /frontend/src/utils/dataFormatters.js

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
  // Combiner date + heure pour créer le format ISO attendu par Django
  const date_debut = `${formData.dateStart}T${formData.timeStart}:00`;
  const date_fin = `${formData.dateEnd}T${formData.timeEnd}:00`;
  
  return {
    // Type et planning
    type_rdv: formData.departement,
    type_intervention: formData.typeIntervention,
    date_debut: date_debut,
    date_fin: date_fin,
    description: formData.description || '',
    statut: formData.statut || 'PLANIFIE',
    
    // Infos client (noms Django attendus)
    client_nom: formData.clientName,
    client_prenom: formData.clientFirstName || '',
    client_phone: formData.clientPhone || '',
    client_email: formData.clientEmail || '',
    client_adresse: formData.clientAddress || '',
    
    // Infos véhicule (noms Django attendus)
    vehicule_type: formData.vehicleType,
    vehicule_immatriculation: formData.plate || '',
    vehicule_marque: formData.vehicleBrand || '',
    vehicule_modele: formData.vehicleModel || '',
    vehicule_annee: formData.vehicleYear || '',
    vehicule_vin: formData.vin || '',
  };
};

/**
 * Formate les données Django pour affichage dans le formulaire React
 * @param {Object} djangoData - Données de Django
 * @returns {Object} - Données formatées pour React
 */
export const formatInterventionForReact = (djangoData) => {
  // Séparer date_debut en date et heure
  const dateDebut = new Date(djangoData.date_debut);
  const dateFin = new Date(djangoData.date_fin);
  
  return {
    // Type et intervention
    departement: djangoData.type_rdv,
    typeIntervention: djangoData.type_intervention,
    
    // Client
    clientName: djangoData.client_nom,
    clientFirstName: djangoData.client_prenom || '',
    clientPhone: djangoData.client_phone || '',
    clientEmail: djangoData.client_email || '',
    clientAddress: djangoData.client_adresse || '',
    
    // Véhicule
    vehicleType: djangoData.vehicule_type,
    plate: djangoData.vehicule_immatriculation || '',
    vehicleBrand: djangoData.vehicule_marque || '',
    vehicleModel: djangoData.vehicule_modele || '',
    vehicleYear: djangoData.vehicule_annee || '',
    vin: djangoData.vehicule_vin || '',
    
    // Planning (séparé en date + heure)
    dateStart: dateDebut.toISOString().split('T')[0],
    timeStart: dateDebut.toTimeString().slice(0, 5),
    dateEnd: dateFin.toISOString().split('T')[0],
    timeEnd: dateFin.toTimeString().slice(0, 5),
    
    // Description
    description: djangoData.description || '',
  };
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