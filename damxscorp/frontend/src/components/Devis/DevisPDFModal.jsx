// /frontend/src/components/Devis/DevisPDFModal.jsx
//
// Overlay PDF accessible directement depuis la liste des devis.
// Charge le devis par son id et affiche DevisDocument (aperçu + téléchargement).

import React, { useState, useEffect } from 'react';
import { fetchDevisById } from '../../services/devisService';
import DevisDocument from './DevisDocument';
import LoadingState from '../shared/LoadingState';
import ErrorState from '../shared/ErrorState';
import './DevisPDFModal.css';

const DevisPDFModal = ({ devisId, onClose }) => {
  const [devis, setDevis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDevisById(devisId);
        setDevis(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [devisId]);

  // Fermer avec Échap
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="devis-pdf-modal__overlay" onClick={onClose}>
      <div
        className="devis-pdf-modal__container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barre de titre */}
        <div className="devis-pdf-modal__header">
          <span className="devis-pdf-modal__title">
            {devis ? `📄 ${devis.numero}` : '📄 Chargement…'}
          </span>
          <button className="devis-pdf-modal__close" onClick={onClose} title="Fermer (Échap)">
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div className="devis-pdf-modal__body">
          {loading && <LoadingState />}
          {error && <ErrorState error={error} />}
          {devis && <DevisDocument devis={devis} />}
        </div>
      </div>
    </div>
  );
};

export default DevisPDFModal;
