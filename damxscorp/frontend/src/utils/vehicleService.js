// /frontend/src/utils/vehicleService.js
import { fetchVehicules, createVehicule, updateVehicule, deleteVehicule } from '../services/api';
import logger from './logger';

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