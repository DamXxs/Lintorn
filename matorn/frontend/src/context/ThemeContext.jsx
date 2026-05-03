// /frontend/src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, DEFAULT_THEME } from '../utils/theme';

/**
 * 🎨 CONTEXTE DU THÈME
 *
 * Fournit à toute l'appli :
 *   - themeName  : nom du thème actif (ex: 'dark')
 *   - theme      : objet complet du thème (nom, icône, variables)
 *   - setTheme   : fonction pour changer de thème
 *   - themes     : liste de tous les thèmes disponibles (pour le menu Paramètres)
 */

// 1. Création du contexte (boîte vide pour l'instant)
const ThemeContext = createContext(null);

// 2. Le Provider : composant qui enveloppe toute l'appli et fournit le thème
export const ThemeProvider = ({ children }) => {

  // Récupère le thème sauvegardé dans le navigateur, ou utilise le défaut
  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem('matorn-theme') || DEFAULT_THEME;
  });

  // Applique les variables CSS sur le document quand le thème change
  useEffect(() => {
    const theme = THEMES[themeName] || THEMES[DEFAULT_THEME];
    const root = document.documentElement; // = la balise <html>

    // Injecte chaque variable CSS dans :root
    Object.entries(theme.variables).forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
    });

    // Sauvegarde le choix dans le navigateur (persiste après rechargement)
    localStorage.setItem('matorn-theme', themeName);

  }, [themeName]); // Se relance à chaque changement de thème

  // Fonction exposée pour changer de thème (utilisée par le menu Paramètres)
  const setTheme = (name) => {
    if (THEMES[name]) {
      setThemeName(name);
    } else {
      console.warn(`Thème "${name}" introuvable`);
    }
  };

  // Valeurs partagées dans toute l'appli
  const value = {
    themeName,                          // 'dark', 'light', etc.
    theme: THEMES[themeName],           // Objet complet du thème actif
    setTheme,                           // Fonction pour changer
    themes: THEMES,                     // Tous les thèmes (pour la page Paramètres)
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Hook personnalisé pour utiliser le thème facilement dans n'importe quel composant
// Usage : const { themeName, setTheme } = useTheme();
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
};

export default ThemeContext;