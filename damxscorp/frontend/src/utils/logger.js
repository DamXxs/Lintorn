// /frontend/src/utils/logger.js

/**
 * 🔍 SYSTÈME DE LOGGING CENTRALISÉ
 * 
 * Gère tous les logs de l'application de manière propre et conditionnelle.
 * - En développement : affiche tout dans la console
 * - En production : désactive les logs (sauf erreurs critiques)
 */

// Détection de l'environnement
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// ========================================================================
// ÉMOJIS POUR CATÉGORISER LES LOGS
// ========================================================================
const EMOJIS = {
  API: '🌐',
  DATA: '📦',
  FORM: '📝',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  DEBUG: '🔧',
  SEND: '📤',
  RECEIVE: '📥',
  USER: '👤',
  VEHICLE: '🚗',
  CALENDAR: '📅',
  STOCK: '📦',
};

// ========================================================================
// FONCTIONS DE LOGGING
// ========================================================================

/**
 * Log général (info)
 */
export const logInfo = (message, data = null) => {
  if (!isDev) return;
  
  if (data) {
    console.log(`${EMOJIS.INFO} ${message}`, data);
  } else {
    console.log(`${EMOJIS.INFO} ${message}`);
  }
};

/**
 * Log de succès
 */
export const logSuccess = (message, data = null) => {
  if (!isDev) return;
  
  if (data) {
    console.log(`${EMOJIS.SUCCESS} ${message}`, data);
  } else {
    console.log(`${EMOJIS.SUCCESS} ${message}`);
  }
};

/**
 * Log d'erreur (toujours affiché, même en prod)
 */
export const logError = (message, error = null) => {
  // ⚠️ Les erreurs sont TOUJOURS loggées, même en production
  if (error) {
    console.error(`${EMOJIS.ERROR} ${message}`, error);
  } else {
    console.error(`${EMOJIS.ERROR} ${message}`);
  }
};

/**
 * Log d'avertissement
 */
export const logWarning = (message, data = null) => {
  if (!isDev) return;
  
  if (data) {
    console.warn(`${EMOJIS.WARNING} ${message}`, data);
  } else {
    console.warn(`${EMOJIS.WARNING} ${message}`);
  }
};

/**
 * Log de debug (détails techniques)
 */
export const logDebug = (message, data = null) => {
  if (!isDev) return;
  
  if (data) {
    console.log(`${EMOJIS.DEBUG} [DEBUG] ${message}`, data);
  } else {
    console.log(`${EMOJIS.DEBUG} [DEBUG] ${message}`);
  }
};

// ========================================================================
// LOGS SPÉCIFIQUES PAR DOMAINE
// ========================================================================

/**
 * Logs API (requêtes réseau)
 */
export const logAPI = {
  send: (endpoint, data) => {
    if (!isDev) return;
    console.log(`${EMOJIS.SEND} API → ${endpoint}`, data);
  },
  
  receive: (endpoint, data) => {
    if (!isDev) return;
    console.log(`${EMOJIS.RECEIVE} API ← ${endpoint}`, data);
  },
  
  error: (endpoint, error) => {
    // ⚠️ Toujours logué, même en prod
    console.error(`${EMOJIS.ERROR} API ERROR → ${endpoint}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
  }
};

/**
 * Logs Formulaires
 */
export const logForm = {
  change: (fieldName, value) => {
    if (!isDev) return;
    console.log(`${EMOJIS.FORM} Champ modifié : ${fieldName} =`, value);
  },
  
  submit: (formName, data) => {
    if (!isDev) return;
    console.log(`${EMOJIS.SEND} Soumission formulaire [${formName}] :`, data);
  },
  
  validation: (formName, errors) => {
    if (!isDev) return;
    console.warn(`${EMOJIS.WARNING} Erreurs de validation [${formName}] :`, errors);
  }
};

/**
 * Logs Formatage de données
 */
export const logFormat = {
  before: (entity, data) => {
    if (!isDev) return;
    console.log(`${EMOJIS.DATA} AVANT formatage [${entity}] :`, data);
  },
  
  after: (entity, data) => {
    if (!isDev) return;
    console.log(`${EMOJIS.DATA} APRÈS formatage [${entity}] :`, data);
  }
};

/**
 * Logs Planning
 */
export const logPlanning = {
  eventClick: (event) => {
    if (!isDev) return;
    console.log(`${EMOJIS.CALENDAR} Clic sur événement :`, event);
  },
  
  dateClick: (date) => {
    if (!isDev) return;
    console.log(`${EMOJIS.CALENDAR} Clic sur date :`, date);
  },
  
  load: (events) => {
    if (!isDev) return;
    console.log(`${EMOJIS.CALENDAR} ${events.length} événements chargés`);
  }
};

// ========================================================================
// EXPORT PAR DÉFAUT
// ========================================================================
export default {
  info: logInfo,
  success: logSuccess,
  error: logError,
  warning: logWarning,
  debug: logDebug,
  api: logAPI,
  form: logForm,
  format: logFormat,
  planning: logPlanning,
};