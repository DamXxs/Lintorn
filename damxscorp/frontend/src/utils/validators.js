// /frontend/src/utils/validators.js

/**
 * 🔍 VALIDATORS & FORMATTERS
 * 
 * Deux types de fonctions :
 * - format...() → formate la saisie en temps réel
 * - validate...() → vérifie et retourne un message d'erreur ou null
 */

// =========================================================================
// FORMATTERS — appelés à chaque frappe (onChange)
// =========================================================================

/**
 * Formate un téléphone → "06 12 34 56 78"
 */
export const formatPhone = (value) => {
  // Garde uniquement les chiffres
  const digits = value.replace(/\D/g, '');
  // Ajoute un espace tous les 2 chiffres
  return digits.match(/.{1,2}/g)?.join(' ') || '';
};

/**
 * Formate un nom → "DUPONT"
 */
export const formatNom = (value) => {
  return value.toUpperCase();
};

/**
 * Formate un prénom → "Jean-Pierre" (première lettre de chaque mot en majuscule)
 */
export const formatPrenom = (value) => {
  return value
    .toLowerCase()
    .split(/[\s-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(value.includes('-') ? '-' : ' ');
};

/**
 * Formate une immatriculation → "AB-123-CD"
 */
export const formatImmatriculation = (value) => {
  // Majuscules + garde lettres et chiffres uniquement
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Format nouveau : AA-000-AA
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0,2)}-${clean.slice(2)}`;
  return `${clean.slice(0,2)}-${clean.slice(2,5)}-${clean.slice(5,7)}`;
};

/**
 * Formate un code postal → "75001" (5 chiffres max)
 */
export const formatCodePostal = (value) => {
  return value.replace(/\D/g, '').slice(0, 5);
};

/**
 * Formate une année → 4 chiffres max
 */
export const formatAnnee = (value) => {
  return value.replace(/\D/g, '').slice(0, 4);
};

// =========================================================================
// VALIDATORS — retournent null si ok, string d'erreur si problème
// =========================================================================

/**
 * Valide un nom (obligatoire, min 2 caractères)
 */
export const validateNom = (value) => {
  if (!value || value.trim().length === 0) return 'Le nom est obligatoire';
  if (value.trim().length < 2) return 'Le nom doit faire au moins 2 caractères';
  return null;
};

/**
 * Valide un téléphone français (10 chiffres)
 */
export const validatePhone = (value) => {
  if (!value) return null; // Pas obligatoire
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 10) return 'Le téléphone doit contenir 10 chiffres';
  if (!digits.startsWith('0')) return 'Le téléphone doit commencer par 0';
  return null;
};

/**
 * Valide un email
 */
export const validateEmail = (value) => {
  if (!value) return null; // Pas obligatoire
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(value)) return 'Email invalide (ex: nom@domaine.fr)';
  return null;
};

/**
 * Valide une immatriculation française
 */
export const validateImmatriculation = (value) => {
  if (!value) return 'L\'immatriculation est obligatoire';
  const regex = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/;
  if (!regex.test(value)) return 'Format invalide (ex: AB-123-CD)';
  return null;
};

/**
 * Valide un code postal français
 */
export const validateCodePostal = (value) => {
  if (!value) return null; // Pas obligatoire
  if (value.length !== 5) return 'Le code postal doit contenir 5 chiffres';
  return null;
};

/**
 * Valide une année de véhicule
 */
export const validateAnnee = (value) => {
  if (!value) return null; // Pas obligatoire
  const annee = parseInt(value);
  const anneeActuelle = new Date().getFullYear();
  if (annee < 1900 || annee > anneeActuelle + 1) {
    return `L'année doit être entre 1900 et ${anneeActuelle}`;
  }
  return null;
};

/**
 * Valide que la date de fin est après la date de début
 */
export const validateDates = (dateStart, timeStart, dateEnd, timeEnd) => {
  if (!dateStart || !dateEnd) return null;
  const debut = new Date(`${dateStart}T${timeStart}`);
  const fin   = new Date(`${dateEnd}T${timeEnd}`);
  if (fin <= debut) return 'La date de fin doit être après la date de début';
  return null;
};

// =========================================================================
// VALIDATION COMPLÈTE D'UN FORMULAIRE RDV
// Retourne un objet { champ: "message d'erreur" }
// =========================================================================
export const validateRdvForm = (formData) => {
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

  // Validation immatriculation si ATELIER
  if (formData.departement === 'ATELIER') {
    const immatError = validateImmatriculation(formData.plate);
    if (immatError) errors.plate = immatError;

    const anneeError = validateAnnee(formData.vehicleYear);
    if (anneeError) errors.vehicleYear = anneeError;
  }

  return errors; // Objet vide = formulaire valide ✅
};