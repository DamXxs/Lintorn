// /frontend/src/components/shared/ComingSoon.jsx
import React from 'react';
import './ComingSoon.css';

/**
 * 🚧 Composant ComingSoon
 *
 * Affiche un placeholder "fonctionnalité à venir"
 *
 * Utilisation :
 *   <ComingSoon
 *     title="Gestion du Stock"
 *     description="La gestion complète du stock arrive bientôt."
 *   />
 *
 * Props :
 *   title       : string — nom de la feature
 *   description : string — description courte (optionnel)
 *   icon        : string — emoji (optionnel, défaut 🚧)
 */
const ComingSoon = ({ title, description, icon = '🚧' }) => (
  <div className="coming-soon">
    <div className="coming-soon__icon">{icon}</div>
    <h2 className="coming-soon__title">{title}</h2>
    {description && (
      <p className="coming-soon__description">{description}</p>
    )}
    <span className="coming-soon__badge">Bientôt disponible</span>
  </div>
);

export default ComingSoon;