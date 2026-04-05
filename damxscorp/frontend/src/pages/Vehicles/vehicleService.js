// /frontend/src/pages/Vehicles/vehicleService.js

// ======================================================================
// RÔLE DE CE FICHIER :
// Couche intermédiaire entre les composants React et api.js
//
// 3 responsabilités :
//
// 1. RÉCUPÉRATION :
//  - getAllVehicules() appelle api.js une seule fois,
//  - searchVehicules() filtre ensuite les données déjà en mémoire
//    sans refaire d'appel réseau → recherche instantanée
//
// 2. CRUD — addVehicule / editVehicule / removeVehicule
//    Appellent api.js avec des logs propres pour déboguer
//
// 3. HELPERS — getVehiculeIcon / getVehiculeTypeLabel
//    Fonctions pures, aucun appel API
//    Convertissent les codes Django en emoji/texte lisible
//    ex: 'VOITURE' → 🚗 ou 'Voiture'
//=========================================================================

import { fetchVehicules, createVehicule, updateVehicule, deleteVehicule } from '../../services/api';
import logger from '../../utils/logger';

// =========================================================================
// RÉCUPÉRATION
// =========================================================================

export const getAllVehicules = async () => {
  try {
    const vehicules = await fetchVehicules();
    logger.success(`${vehicules.length} véhicules chargés`);
    return vehicules;
  } catch (error) {
    logger.error('Erreur chargement véhicules', error);
    throw error;
  }
};

// Recherche côté frontend (instantanée)
export const searchVehicules = (vehicules, query) => {
  if (!query || query.trim() === '') return vehicules;
  const q = query.toLowerCase().trim();
  return vehicules.filter(v =>
    v.immatriculation?.toLowerCase().includes(q) ||
    v.marque?.toLowerCase().includes(q)          ||
    v.modele?.toLowerCase().includes(q)          ||
    v.proprietaire_nom?.toLowerCase().includes(q)
  );
};

// =========================================================================
// CRUD
// =========================================================================

export const addVehicule = async (formData) => {
  try {
    const result = await createVehicule(formData);
    logger.success('Véhicule créé', result);
    return result;
  } catch (error) {
    logger.error('Erreur création véhicule', error);
    throw error;
  }
};

export const editVehicule = async (id, formData) => {
  try {
    const result = await updateVehicule(id, formData);
    logger.success(`Véhicule ${id} modifié`, result);
    return result;
  } catch (error) {
    logger.error(`Erreur modification véhicule ${id}`, error);
    throw error;
  }
};

export const removeVehicule = async (id) => {
  try {
    await deleteVehicule(id);
    logger.success(`Véhicule ${id} supprimé`);
  } catch (error) {
    logger.error(`Erreur suppression véhicule ${id}`, error);
    throw error;
  }
};

// =========================================================================
// HELPERS
// =========================================================================

// Icône selon le type
export const getVehiculeIcon = (type) => {
  const icons = {
    VOITURE:     '🚗',
    MOTO:        '🏍️',
    MOTOCULTURE: '🚜',
    BATEAU:      '🚤',
  };
  return icons[type] || '🚗';
};

// Label selon le type
export const getVehiculeTypeLabel = (type) => {
  const labels = {
    VOITURE:     'Voiture',
    MOTO:        'Moto',
    MOTOCULTURE: 'Motoculture',
    BATEAU:      'Bateau',
  };
  return labels[type] || type;
};

export default {
  getAllVehicules,
  searchVehicules,
  addVehicule,
  editVehicule,
  removeVehicule,
  getVehiculeIcon,
  getVehiculeTypeLabel,
};