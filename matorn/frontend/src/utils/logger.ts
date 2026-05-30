// /frontend/src/utils/logger.ts

/**
 * 🔍 SYSTÈME DE LOGGING CENTRALISÉ
 *
 * Gère tous les logs de l'application de manière propre et conditionnelle.
 * - En développement : affiche tout dans la console
 * - En production : désactive les logs (sauf erreurs critiques)
 */

// Détection de l'environnement
const isDev: boolean =
  process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// ========================================================================
// EMOJIS POUR CATÉGORISER LES LOGS
// ========================================================================

// Record<string, string> = objet dont toutes les clés ET valeurs sont des strings
const EMOJIS: Record<string, string> = {
  API:      '🌐',
  DATA:     '📦',
  FORM:     '📝',
  SUCCESS:  '✅',
  ERROR:    '❌',
  WARNING:  '⚠️',
  INFO:     'ℹ️',
  DEBUG:    '🔧',
  SEND:     '📤',
  RECEIVE:  '📥',
  USER:     '👤',
  VEHICLE:  '🚗',
  CALENDAR: '📅',
  STOCK:    '📦',
};

// ========================================================================
// FONCTIONS DE LOGGING
// ========================================================================

/**
 * Log général (info)
 */
export const logInfo = (message: string, data?: unknown): void => {
  if (!isDev) return;
  data
    ? console.log(`${EMOJIS.INFO} ${message}`, data)
    : console.log(`${EMOJIS.INFO} ${message}`);
};

/**
 * Log de succès
 */
export const logSuccess = (message: string, data?: unknown): void => {
  if (!isDev) return;
  data
    ? console.log(`${EMOJIS.SUCCESS} ${message}`, data)
    : console.log(`${EMOJIS.SUCCESS} ${message}`);
};

/**
 * Log d'erreur (toujours affiché, même en prod)
 */
export const logError = (message: string, error?: unknown): void => {
  // ⚠️ Les erreurs sont TOUJOURS loggées, même en production
  error
    ? console.error(`${EMOJIS.ERROR} ${message}`, error)
    : console.error(`${EMOJIS.ERROR} ${message}`);
};

/**
 * Log d'avertissement
 */
export const logWarning = (message: string, data?: unknown): void => {
  if (!isDev) return;
  data
    ? console.warn(`${EMOJIS.WARNING} ${message}`, data)
    : console.warn(`${EMOJIS.WARNING} ${message}`);
};

/**
 * Log de debug (détails techniques)
 */
export const logDebug = (message: string, data?: unknown): void => {
  if (!isDev) return;
  data
    ? console.log(`${EMOJIS.DEBUG} [DEBUG] ${message}`, data)
    : console.log(`${EMOJIS.DEBUG} [DEBUG] ${message}`);
};

// ========================================================================
// LOGS SPÉCIFIQUES PAR DOMAINE
// ========================================================================

/**
 * Logs API (requêtes réseau)
 * On type error en unknown puis on cast pour accéder à .response (pattern Axios)
 */
export const logAPI = {

  send: (endpoint: string, data?: unknown): void => {
    if (!isDev) return;
    console.log(`${EMOJIS.SEND} API → ${endpoint}`, data);
  },

  receive: (endpoint: string, data?: unknown): void => {
    if (!isDev) return;
    console.log(`${EMOJIS.RECEIVE} API ← ${endpoint}`, data);
  },

  error: (endpoint: string, error: unknown): void => {
    // ⚠️ Toujours logué, même en prod
    const err = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.error(`${EMOJIS.ERROR} API ERROR → ${endpoint}`, {
      status:  err.response?.status,
      data:    err.response?.data,
      message: err.message,
    });
  },
};

/**
 * Logs Formulaires
 */
export const logForm = {

  change: (fieldName: string, value: unknown): void => {
    if (!isDev) return;
    console.log(`${EMOJIS.FORM} Champ modifié : ${fieldName} =`, value);
  },

  submit: (formName: string, data: unknown): void => {
    if (!isDev) return;
    console.log(`${EMOJIS.SEND} Soumission formulaire [${formName}] :`, data);
  },

  validation: (formName: string, errors: unknown): void => {
    if (!isDev) return;
    console.warn(`${EMOJIS.WARNING} Erreurs de validation [${formName}] :`, errors);
  },
};

/**
 * Logs Formatage de données
 */
export const logFormat = {

  before: (entity: string, data: unknown): void => {
    if (!isDev) return;
    console.log(`${EMOJIS.DATA} AVANT formatage [${entity}] :`, data);
  },

  after: (entity: string, data: unknown): void => {
    if (!isDev) return;
    console.log(`${EMOJIS.DATA} APRÈS formatage [${entity}] :`, data);
  },
};

/**
 * Logs Planning
 */
export const logPlanning = {

  eventClick: (event: unknown): void => {
    if (!isDev) return;
    console.log(`${EMOJIS.CALENDAR} Clic sur événement :`, event);
  },

  dateClick: (date: unknown): void => {
    if (!isDev) return;
    console.log(`${EMOJIS.CALENDAR} Clic sur date :`, date);
  },

  load: (events: unknown[]): void => {
    if (!isDev) return;
    console.log(`${EMOJIS.CALENDAR} ${events.length} événements chargés`);
  },
};

// ========================================================================
// EXPORT PAR DÉFAUT
// ========================================================================

// ✅ Correction warning ESLint import/no-anonymous-default-export :
// On nomme l'objet AVANT de l'exporter (au lieu de "export default { ... }")
const logger = {
  info:     logInfo,
  success:  logSuccess,
  error:    logError,
  warning:  logWarning,
  debug:    logDebug,
  api:      logAPI,
  form:     logForm,
  format:   logFormat,
  planning: logPlanning,
};

export default logger;