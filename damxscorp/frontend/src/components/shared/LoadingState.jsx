// /frontend/src/components/shared/LoadingState.jsx
import React from 'react';
import './shared.css';

/**
 * ⏳ Composant LoadingState
 *
 * Affiche un spinner + message pendant le chargement des données.
 *
 * Utilisation :
 *   if (loading) return <LoadingState message="Chargement des clients..." />;
 *
 * Props :
 *   message : string — texte affiché sous le spinner (défaut: "Chargement...")
 */
const LoadingState = ({ message = 'Chargement...' }) => (
  <div className="page-state">
    <div className="page-spinner" />
    <p>{message}</p>
  </div>
);

export default LoadingState;
