// /frontend/src/utils/theme.js

/**
 * 🎨 DÉFINITION DES THÈMES
 *
 * Chaque thème est un objet avec les mêmes clés (variables CSS).
 * Pour ajouter un nouveau thème : copier un bloc et changer les valeurs.
 * Le menu Paramètres n'aura qu'à appeler setTheme('nomDuTheme').
 */

export const THEMES = {

  // ── THÈME SOMBRE (actuel) ──────────────────────────────────────────
  dark: {
    name: 'Sombre',          // Nom affiché dans le menu Paramètres
    icon: '🌙',
    variables: {
      '--bg':        '#0a0a0a',
      '--panel':     '#121212',
      '--accent':    '#2980b9',
      '--text':      '#e0e0e0',
      '--border':    '#282828',
      '--danger':    '#c0392b',
      '--success':   '#27ae60',
      '--input-bg':  '#1a1a1a',
      '--shadow':    'rgba(0, 0, 0, 0.6)',
    },
  },

  // ── THÈME CLAIR (prêt pour plus tard) ─────────────────────────────
  light: {
    name: 'Clair',
    icon: '☀️',
    variables: {
      '--bg':        '#f0f2f5',
      '--panel':     '#ffffff',
      '--accent':    '#2980b9',
      '--text':      '#1a1a1a',
      '--border':    '#dde1e7',
      '--danger':    '#e74c3c',
      '--success':   '#27ae60',
      '--input-bg':  '#f8f9fa',
      '--shadow':    'rgba(0, 0, 0, 0.15)',
    },
  },

  // ── THÈME ORANGE (exemple pour montrer l'extensibilité) ───────────
  orange: {
    name: 'Orange',
    icon: '🔥',
    variables: {
      '--bg':        '#0d0a07',
      '--panel':     '#141008',
      '--accent':    '#e67e22',
      '--text':      '#e0d8d0',
      '--border':    '#2a1f10',
      '--danger':    '#c0392b',
      '--success':   '#27ae60',
      '--input-bg':  '#1a1208',
      '--shadow':    'rgba(0, 0, 0, 0.6)',
    },
  },

};

// Thème par défaut au démarrage
export const DEFAULT_THEME = 'dark';


