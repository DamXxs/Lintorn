// /frontend/src/components/shared/StatutBadge.jsx
import React from 'react';

/**
 * 🏷️ StatutBadge — Badge coloré selon le statut d'un RDV / intervention
 *
 * Affiche une petite pastille colorée avec le libellé du statut.
 * Utilisé dans VehicleDetail (historique interventions), et tout futur
 * composant qui a besoin d'indiquer visuellement l'état d'un RDV.
 *
 * Props :
 *   statut : 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE'
 *
 * Usage :
 *   <StatutBadge statut="PLANIFIE" />
 *   <StatutBadge statut={intervention.statut} />
 */

// Configuration centralisée — couleurs par statut
const STATUT_CONFIG = {
  PLANIFIE: { label: 'Planifié',  color: '#2980b9' },
  EN_COURS: { label: 'En cours',  color: '#e67e22' },
  TERMINE:  { label: 'Terminé',   color: '#27ae60' },
  ANNULE:   { label: 'Annulé',    color: '#7f8c8d' },
};

const StatutBadge = ({ statut }) => {
  const config = STATUT_CONFIG[statut] || { label: statut, color: '#666' };

  return (
    <span
      className="statut-badge"
      style={{
        background:    config.color,
        color:         'white',
        fontSize:      '10px',
        fontWeight:    700,
        padding:       '2px 8px',
        borderRadius:  '20px',
        whiteSpace:    'nowrap',
        display:       'inline-block',
      }}
    >
      {config.label}
    </span>
  );
};

export default StatutBadge;
