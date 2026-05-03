// /frontend/src/components/shared/ErrorState.jsx
import React from 'react';
import { CircleAlert } from '../../utils/icons';
import './shared.css';

/**
 * ❌ Composant ErrorState
 *
 * Affiche un message d'erreur + un bouton "Réessayer" optionnel.
 *
 * Utilisation :
 *   if (error) return <ErrorState message={error} onRetry={loadClients} />;
 *
 * Props :
 *   message  : string   — le message d'erreur à afficher
 *   onRetry  : function — si fourni, affiche le bouton "Réessayer" (optionnel)
 */
const ErrorState = ({ message, onRetry }) => (
  <div className="page-state">
    <p><CircleAlert size={16} /> {message}</p>
    {onRetry && (
      <button onClick={onRetry}>Réessayer</button>
    )}
  </div>
);

export default ErrorState;
