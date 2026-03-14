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
 *   const { getTypeVehicules, getTypeInterventions } = useReferentiels();
 */

const ReferentielsContext = createContext(null);

export const ReferentielsProvider = ({ children }) => {

  // Stocke tous les référentiels regroupés par catégorie
  const [referentiels, setReferentiels] = useState({
    TYPE_VEHICULE:     [],
    TYPE_INTERVENTION: [],
    CATEGORIE_STOCK:   [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── CHARGEMENT ────────────────────────────────────────────────
  // useCallback pour pouvoir appeler reload depuis l'éditeur Paramètres
  const loadReferentiels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Un seul appel API → tout récupérer d'un coup
      const data = await fetchReferentiels();

      // Regrouper par catégorie
      const grouped = {
        TYPE_VEHICULE:     [],
        TYPE_INTERVENTION: [],
        CATEGORIE_STOCK:   [],
      };

      data.forEach(item => {
        if (grouped[item.categorie] !== undefined) {
          grouped[item.categorie].push(item);
        }
      });

      // Trier par ordre dans chaque catégorie
      Object.keys(grouped).forEach(cat => {
        grouped[cat].sort((a, b) => a.ordre - b.ordre);
      });

      setReferentiels(grouped);
      logger.success('Référentiels chargés', {
        vehicules:     grouped.TYPE_VEHICULE.length,
        interventions: grouped.TYPE_INTERVENTION.length,
        stock:         grouped.CATEGORIE_STOCK.length,
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

  /** Retourne les types de véhicules ACTIFS pour les selects */
  const getTypeVehicules = (tousInclus = false) => {
    const list = referentiels.TYPE_VEHICULE;
    return tousInclus ? list : list.filter(r => r.actif);
  };

  /** Retourne les types d'interventions ACTIFS */
  const getTypeInterventions = (tousInclus = false) => {
    const list = referentiels.TYPE_INTERVENTION;
    return tousInclus ? list : list.filter(r => r.actif);
  };

  /** Retourne les catégories de stock ACTIVES */
  const getCategoriesStock = (tousInclus = false) => {
    const list = referentiels.CATEGORIE_STOCK;
    return tousInclus ? list : list.filter(r => r.actif);
  };

  /** Trouve le label d'une valeur dans une catégorie */
  const getLabel = (categorie, valeur) => {
    const item = referentiels[categorie]?.find(r => r.valeur === valeur);
    return item ? item.label : valeur;
  };

  /** Trouve l'icône d'une valeur dans une catégorie */
  const getIcone = (categorie, valeur) => {
    const item = referentiels[categorie]?.find(r => r.valeur === valeur);
    return item ? item.icone : '';
  };

  const value = {
    referentiels,         // Données brutes (pour l'éditeur Paramètres)
    loading,
    error,
    reload: loadReferentiels,  // Permet de recharger après modification

    // Accesseurs pratiques
    getTypeVehicules,
    getTypeInterventions,
    getCategoriesStock,
    getLabel,
    getIcone,
  };

  return (
    <ReferentielsContext.Provider value={value}>
      {children}
    </ReferentielsContext.Provider>
  );
};

/** Hook d'accès au contexte */
export const useReferentiels = () => {
  const context = useContext(ReferentielsContext);
  if (!context) {
    throw new Error('useReferentiels doit être utilisé dans un ReferentielsProvider');
  }
  return context;
};

export default ReferentielsContext;