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
      '--text':      '#c5c5c5',
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
      '--bg':        '#e0e3e8eb',
      '--panel':     '#b9b9b9',
      '--accent':    '#1a5276',
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
      '--text':      '#696868',
      '--border':    '#473721',
      '--danger':    '#c0392b',
      '--success':   '#27ae60',
      '--input-bg':  '#1a1208',
      '--shadow':    'rgba(0, 0, 0, 0.6)',
    },
  },

  // ── THÈME ROUGE (Garage) ──────────────────────────────────────────
  rouge: {
    name: 'Garage Rouge',
    icon: '🔴',
    variables: {
      '--bg':       '#0d0505',   // Fond générale de la page
      '--panel':    '#1a0a0a',   // Fond des cartes, sidebar, modals
      '--accent':   '#c0392b',   // Couleur principale (boutons, liens actifs)
      '--text':     '#f0e0e051',   // Couleur du texte
      '--border':   '#2a1010',   // Bordures des éléments
      '--danger':   '#e74c3c',   // Bouton supprimer
      '--success':  '#27ae60',   // Bouton valider
      '--input-bg': '#1f0d0d',   // Fond des champs de saisie
      '--shadow':   'rgba(192, 57, 43, 0.3)', // Ombre teintée rouge
    },
  },

};

// Thème par défaut au démarrage
export const DEFAULT_THEME = 'dark';


