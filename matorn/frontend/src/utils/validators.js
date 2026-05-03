// /frontend/src/utils/validators.js

/**
 * 🔍 VALIDATORS & FORMATTERS
 *
 * Deux types de fonctions :
 * - format...() → formate la saisie en temps réel (appelé onChange)
 * - validate...() → vérifie et retourne un message d'erreur ou null
 */

// =========================================================================
// FORMATTERS — appelés à chaque frappe (onChange)
// =========================================================================

/** Formate un téléphone → "06 12 34 56 78" */
export const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  return digits.match(/.{1,2}/g)?.join(' ') || '';
};

/** Formate un nom → "DUPONT" */
export const formatNom = (value) => value.toUpperCase();

/** Formate un prénom → "Jean-Pierre" */
export const formatPrenom = (value) =>
  value
    .toLowerCase()
    .split(/[\s-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(value.includes('-') ? '-' : ' ');

/**
 * 🆕 Helper : détermine la famille de plaque selon le type de véhicule
 * Utilisé pour savoir quel format/validation appliquer.
 * (Logique synchronisée avec PlateSelector.jsx)
 */
const getPlateFamily = (vehicleType) => {
  if (!vehicleType) return 'french';
  const t = vehicleType.toUpperCase();
  if (['BATEAU', 'JETSKI', 'VOILIER'].includes(t)) return 'wood';
  if (['MOTOCULTURE', 'ENGIN', 'ENGIN_AGRICOLE', 'TONDEUSE'].includes(t)) return 'metal';
  return 'french';
};

/**
 * Formate une immatriculation
 * - Pour les plaques métal/bois : uppercase + nettoyage simple
 * - Pour le format ancien : uppercase limité à 7 caractères
 * - Pour le format SIV : force "AA-000-AA"
 */
export const formatImmatriculation = (value, options = {}) => {
  const { isOldFormat = false, vehicleType = null } = options;
  const family = getPlateFamily(vehicleType);

  // 🆕 Motoculture / bateau : format libre, juste uppercase + alphanumérique étendu
  if (family === 'metal' || family === 'wood') {
    return value.toUpperCase().replace(/[^A-Z0-9\-\s/]/g, '').slice(0, 20);
  }

  // Ancienne plaque française : format libre court
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (isOldFormat) return clean.slice(0, 7);

  // Format SIV : AA-000-AA
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5, 7)}`;
};

/** Formate un code postal → 5 chiffres max */
export const formatCodePostal = (value) => value.replace(/\D/g, '').slice(0, 5);

/** Formate une année → 4 chiffres max */
export const formatAnnee = (value) => value.replace(/\D/g, '').slice(0, 4);

// =========================================================================
// VALIDATORS — retournent null si ok, string d'erreur si problème
// =========================================================================

/** Valide un nom (obligatoire, min 2 caractères) */
export const validateNom = (value) => {
  if (!value || value.trim().length === 0) return 'Le nom est obligatoire';
  if (value.trim().length < 2) return 'Le nom doit faire au moins 2 caractères';
  return null;
};

/** Valide un téléphone français (10 chiffres, commence par 0) */
export const validatePhone = (value) => {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 10) return 'Le téléphone doit contenir 10 chiffres';
  if (!digits.startsWith('0')) return 'Le téléphone doit commencer par 0';
  return null;
};

/** Valide une référence interne (obligatoire, min 3 caractères) */
export const validateReference = (value) => {
  if (!value || value.trim().length === 0) return 'La référence est obligatoire';
  if (value.trim().length < 3) return 'La référence doit faire au moins 3 caractères';
  return null;
};

/** Valide un prix positif obligatoire */
export const validatePrix = (value, label) => {
  if (value === '' || value === null || value === undefined) return `${label} est obligatoire`;
  if (isNaN(Number(value))) return `${label} doit être un nombre valide`;
  if (Number(value) < 0) return `${label} doit être positif ou nul`;
  return null;
};

/** Valide un email */
export const validateEmail = (value) => {
  if (!value) return null;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(value)) return 'Email invalide (ex: nom@domaine.fr)';
  return null;
};

/**
 * Valide une immatriculation
 *
 * Signature enrichie :
 *   validateImmatriculation(value, { isOldFormat: false, vehicleType: 'VOITURE' })
 *
 * - vehicleType bateau/jetski → validation libre (juste non-vide)
 * - vehicleType motoculture/engin → validation libre (juste non-vide)
 * - isOldFormat = true → validation libre (juste non-vide)
 * - sinon → regex stricte SIV "AB-123-CD"
 *
 * 🔙 Rétro-compatibilité : on accepte aussi l'ancienne signature
 *    validateImmatriculation(value, true) où le 2ᵉ argument est isOldFormat.
 */
export const validateImmatriculation = (value, options = false) => {
  // Gestion rétro-compatibilité : si options est un booléen, c'est l'ancien isOldFormat
  const opts = typeof options === 'boolean'
    ? { isOldFormat: options, vehicleType: null }
    : { isOldFormat: false, vehicleType: null, ...options };

  const { isOldFormat, vehicleType } = opts;

  if (!value || value.trim().length === 0) return "L'immatriculation est obligatoire";

  const family = getPlateFamily(vehicleType);

  // 🆕 Pour motoculture et bateau : format libre (juste non-vide, déjà vérifié)
  if (family === 'metal' || family === 'wood') return null;

  // Ancienne plaque : format libre
  if (isOldFormat) return null;

  // Format SIV strict
  const regex = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/;
  if (!regex.test(value)) return 'Format invalide (ex: AB-123-CD)';
  return null;
};

/** Valide un code postal français */
export const validateCodePostal = (value) => {
  if (!value) return null;
  if (value.length !== 5) return 'Le code postal doit contenir 5 chiffres';
  return null;
};

/** Valide une année de véhicule */
export const validateAnnee = (value) => {
  if (!value) return null;
  const annee = parseInt(value);
  const anneeActuelle = new Date().getFullYear();
  if (annee < 1900 || annee > anneeActuelle + 1)
    return `L'année doit être entre 1900 et ${anneeActuelle}`;
  return null;
};

/** Valide que la date de fin est après la date de début */
export const validateDates = (dateStart, timeStart, dateEnd, timeEnd) => {
  if (!dateStart || !dateEnd) return null;
  const debut = new Date(`${dateStart}T${timeStart}`);
  const fin   = new Date(`${dateEnd}T${timeEnd}`);
  if (fin <= debut) return 'La date de fin doit être après la date de début';
  return null;
};

// =========================================================================
// VALIDATION COMPLÈTE D'UN FORMULAIRE RDV
// =========================================================================
export const validateRdvForm = (formData, isOldFormat = false) => {
  const errors = {};

  const nomError   = validateNom(formData.clientName);
  const phoneError = validatePhone(formData.clientPhone);
  const emailError = validateEmail(formData.clientEmail);
  const datesError = validateDates(
    formData.dateStart, formData.timeStart,
    formData.dateEnd,   formData.timeEnd
  );

  if (nomError)   errors.clientName  = nomError;
  if (phoneError) errors.clientPhone = phoneError;
  if (emailError) errors.clientEmail = emailError;
  if (datesError) errors.dates       = datesError;

  // Validation immatriculation si département ATELIER
  if (formData.departement === 'ATELIER') {
    // 🆕 On passe vehicleType pour adapter la validation automatiquement
    const immatError = validateImmatriculation(formData.plate, {
      isOldFormat,
      vehicleType: formData.vehicleType,
    });
    if (immatError) errors.plate = immatError;

    const anneeError = validateAnnee(formData.vehicleYear);
    if (anneeError) errors.vehicleYear = anneeError;
  }

  return errors;
};