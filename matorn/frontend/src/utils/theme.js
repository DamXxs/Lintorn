// /frontend/src/utils/theme.js

/**
 * 🎨 DÉFINITION DES THÈMES
 *
 * Chaque thème est un objet avec les mêmes clés (variables CSS).
 * Pour ajouter un nouveau thème : copier un bloc et changer les valeurs.
 * Le menu Paramètres n'aura qu'à appeler setTheme('nomDuTheme').
 *
 * ── CONVENTION RGB ────────────────────────────────────────────────────
 * Chaque couleur principale a une variante --X-rgb (ex: --danger-rgb).
 * Ces variantes contiennent les composantes R, G, B séparées par virgules.
 * Elles servent à construire des couleurs transparentes sans hardcoder :
 *   → rgba(var(--danger-rgb), 0.15)  =  couleur danger à 15% d'opacité
 * Sans ça, CSS ne peut pas extraire les composantes d'une variable hex.
 * ──────────────────────────────────────────────────────────────────────
 */

export const THEMES = {

  // ── THÈME SOMBRE (défaut) ──────────────────────────────────────────
  dark: {
    name: 'Sombre',
    icon: '🌙',
    variables: {
      '--bg':          '#0a0a0a',
      '--panel':       '#121212',
      '--accent':      '#2980b9',
      '--text':        '#c5c5c5',
      '--border':      '#282828',
      '--danger':      '#c0392b',
      '--success':     '#27ae60',
      '--warning':     '#e67e22',
      '--input-bg':    '#1a1a1a',
      '--shadow':      'rgba(0, 0, 0, 0.6)',
      // Variantes RGB
      '--accent-rgb':   '41, 128, 185',
      '--danger-rgb':   '192, 57, 43',
      '--success-rgb':  '39, 174, 96',
      '--warning-rgb':  '230, 126, 34',
      '--text-rgb':     '197, 197, 197',
      '--border-rgb':   '40, 40, 40',
      '--input-bg-rgb': '26, 26, 26',
    },
  },

  // ── THÈME CLAIR ────────────────────────────────────────────────────
  light: {
    name: 'Clair',
    icon: '☀️',
    variables: {
      '--bg':          '#e0e3e8',
      '--panel':       '#b9b9b9',
      '--accent':      '#1a5276',
      '--text':        '#1a1a1a',
      '--border':      '#dde1e7',
      '--danger':      '#e74c3c',
      '--success':     '#27ae60',
      '--warning':     '#e67e22',
      '--input-bg':    '#f8f9fa',
      '--shadow':      'rgba(0, 0, 0, 0.15)',
      // Variantes RGB
      '--accent-rgb':   '26, 82, 118',
      '--danger-rgb':   '231, 76, 60',
      '--success-rgb':  '39, 174, 96',
      '--warning-rgb':  '230, 126, 34',
      '--text-rgb':     '26, 26, 26',
      '--border-rgb':   '221, 225, 231',
      '--input-bg-rgb': '248, 249, 250',
    },
  },

  // ── THÈME ORANGE ──────────────────────────────────────────────────
  orange: {
    name: 'Orange',
    icon: '🔥',
    variables: {
      '--bg':          '#0d0a07',
      '--panel':       '#141008',
      '--accent':      '#e67e22',
      '--text':        '#d4a96a',
      '--border':      '#473721',
      '--danger':      '#c0392b',
      '--success':     '#27ae60',
      '--warning':     '#f39c12',
      '--input-bg':    '#1a1208',
      '--shadow':      'rgba(0, 0, 0, 0.6)',
      // Variantes RGB
      '--accent-rgb':   '230, 126, 34',
      '--danger-rgb':   '192, 57, 43',
      '--success-rgb':  '39, 174, 96',
      '--warning-rgb':  '243, 156, 18',
      '--text-rgb':     '212, 169, 106',
      '--border-rgb':   '71, 55, 33',
      '--input-bg-rgb': '26, 18, 8',
    },
  },

  // ── THÈME ROUGE (Garage) ──────────────────────────────────────────
  rouge: {
    name: 'Garage Rouge',
    icon: '🔴',
    variables: {
      '--bg':          '#0d0505',
      '--panel':       '#1a0a0a',
      '--accent':      '#c0392b',
      '--text':        '#f0d0d0',  // ✅ Corrigé — était '#f0e0e051' (alpha hex parasite = texte invisible)
      '--border':      '#2a1010',
      '--danger':      '#e74c3c',
      '--success':     '#27ae60',
      '--warning':     '#e67e22',
      '--input-bg':    '#1f0d0d',
      '--shadow':      'rgba(192, 57, 43, 0.3)',
      // Variantes RGB
      '--accent-rgb':   '192, 57, 43',
      '--danger-rgb':   '231, 76, 60',
      '--success-rgb':  '39, 174, 96',
      '--warning-rgb':  '230, 126, 34',
      '--text-rgb':     '240, 208, 208',
      '--border-rgb':   '42, 16, 16',
      '--input-bg-rgb': '31, 13, 13',
    },
  },

};

// Thème par défaut au démarrage
export const DEFAULT_THEME = 'dark';