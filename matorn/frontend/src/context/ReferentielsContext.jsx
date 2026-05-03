// /frontend/src/context/ReferentielsContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchReferentiels } from '../services/api';
import logger from '../utils/logger';

/**
 * 📋 CONTEXTE DES RÉFÉRENTIELS
 *
 * Charge une seule fois tous les référentiels au démarrage.
 * Distribue dans toute l'appli les listes dynamiques qui remplacent
 * les constantes figées de constants.js
 *
 * Usage dans un composant :
 *   const { getTypeVehicules, getTypeInterventions, getCategoriesFournisseur } = useReferentiels();
 */

const ReferentielsContext = createContext(null);

// ── Catégories de fournisseurs par défaut ─────────────────────────────────
// Utilisées comme FALLBACK si aucune entrée CATEGORIE_FOURNISSEUR dans la DB.
// Elles correspondent aux valeurs historiques du champ categorie (Fournisseur.model).
// Dès que l'utilisateur crée des catégories dans Paramètres → elles remplacent ce fallback.
export const CATEGORIES_FOURNISSEUR_DEFAUT = [
  { valeur: 'PNEUS',           label: 'Pneumatiques',       icone: '🔵', couleur: '#3498db' },
  { valeur: 'PIECES_COMMUNES', label: 'Pièces communes',    icone: '🔧', couleur: '#7f8c8d' },
  { valeur: 'PIECES_SPEC',     label: 'Pièces spécifiques', icone: '⚙️', couleur: '#95a5a6' },
  { valeur: 'CARROSSERIE',     label: 'Carrosserie',        icone: '🚗', couleur: '#e74c3c' },
  { valeur: 'ELECTRICITE',     label: 'Électricité',        icone: '⚡', couleur: '#f1c40f' },
  { valeur: 'HUILES',          label: 'Huiles & Liquides',  icone: '🛢️', couleur: '#e67e22' },
  { valeur: 'AUTRE',           label: 'Autre',              icone: '📦', couleur: '#6c757d' },
];

export const ReferentielsProvider = ({ children }) => {

  // Stocke tous les référentiels regroupés par catégorie
  const [referentiels, setReferentiels] = useState({
    TYPE_VEHICULE:          [],
    TYPE_INTERVENTION:      [],
    CATEGORIE_STOCK:        [],
    CATEGORIE_FOURNISSEUR:  [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── CHARGEMENT ────────────────────────────────────────────────
  const loadReferentiels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchReferentiels();

      const grouped = {
        TYPE_VEHICULE:          [],
        TYPE_INTERVENTION:      [],
        CATEGORIE_STOCK:        [],
        CATEGORIE_FOURNISSEUR:  [],
      };

      data.forEach(item => {
        if (grouped[item.categorie] !== undefined) {
          grouped[item.categorie].push(item);
        }
      });

      Object.keys(grouped).forEach(cat => {
        grouped[cat].sort((a, b) => a.ordre - b.ordre);
      });

      setReferentiels(grouped);
      logger.success('Référentiels chargés', {
        vehicules:     grouped.TYPE_VEHICULE.length,
        interventions: grouped.TYPE_INTERVENTION.length,
        stock:         grouped.CATEGORIE_STOCK.length,
        fournisseurs:  grouped.CATEGORIE_FOURNISSEUR.length,
      });

    } catch (err) {
      logger.error('Erreur chargement référentiels', err);
      setError('Impossible de charger les référentiels');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReferentiels(); }, [loadReferentiels]);

  // ── HELPERS ───────────────────────────────────────────────────

  const getTypeVehicules = (tousInclus = false) => {
    const list = referentiels.TYPE_VEHICULE;
    return tousInclus ? list : list.filter(r => r.actif);
  };

  const getTypeInterventions = (tousInclus = false) => {
    const list = referentiels.TYPE_INTERVENTION;
    return tousInclus ? list : list.filter(r => r.actif);
  };

  const getCategoriesStock = (tousInclus = false) => {
    const list = referentiels.CATEGORIE_STOCK;
    return tousInclus ? list : list.filter(r => r.actif);
  };

  /**
   * Retourne les catégories de fournisseurs.
   * → Si des catégories ont été créées dans Paramètres : on les utilise.
   * → Sinon : on retourne le fallback codé en dur (7 catégories par défaut).
   *
   * Le résultat est toujours au format { valeur, label, icone, couleur }
   * pour être compatible avec les composants CardFournisseur et ModalFournisseur.
   */
  const getCategoriesFournisseur = (tousInclus = false) => {
    const list = referentiels.CATEGORIE_FOURNISSEUR;
    if (list.length === 0) {
      // Aucune catégorie configurée → fallback sur les valeurs par défaut
      return CATEGORIES_FOURNISSEUR_DEFAUT;
    }
    return tousInclus ? list : list.filter(r => r.actif);
  };

  const getLabel = (categorie, valeur) => {
    const item = referentiels[categorie]?.find(r => r.valeur === valeur);
    return item ? item.label : valeur;
  };

  const getIcone = (categorie, valeur) => {
    const item = referentiels[categorie]?.find(r => r.valeur === valeur);
    return item ? item.icone : '';
  };

  const value = {
    referentiels,
    loading,
    error,
    reload: loadReferentiels,

    getTypeVehicules,
    getTypeInterventions,
    getCategoriesStock,
    getCategoriesFournisseur,   // ← nouveau
    getLabel,
    getIcone,
  };

  return (
    <ReferentielsContext.Provider value={value}>
      {children}
    </ReferentielsContext.Provider>
  );
};

export const useReferentiels = () => {
  const context = useContext(ReferentielsContext);
  if (!context) {
    throw new Error('useReferentiels doit être utilisé dans un ReferentielsProvider');
  }
  return context;
};

export default ReferentielsContext;
