// /frontend/src/components/Devis/DevisManager.jsx
import React, { useState } from 'react';
import DevisList from './DevisList';
import DevisForm from './DevisForm';
import DevisDetail from './DevisDetail';

/**
 * 📋 DevisManager — Gestionnaire complet des devis
 *
 * Gère les transitions entre les 3 vues :
 * - Liste (DevisList)
 * - Formulaire création/édition (DevisForm)
 * - Détail avec actions (DevisDetail)
 */
const DevisManager = () => {
  const [view, setView] = useState('list'); // 'list', 'form', 'detail'
  const [selectedDevisId, setSelectedDevisId] = useState(null);
  const [formDevisId, setFormDevisId] = useState(null);
  const [refreshList, setRefreshList] = useState(0);

  const handleSelectDevis = (devis) => {
    setSelectedDevisId(devis.id);
    setView('detail');
  };

  const handleCreateDevis = () => {
    setFormDevisId(null);
    setView('form');
  };

  const handleSaveDevis = (devis) => {
    setRefreshList((prev) => prev + 1);
    setView('list');
  };

  const handleCancelForm = () => {
    setView('list');
  };

  const handleBackFromDetail = () => {
    setRefreshList((prev) => prev + 1);
    setView('list');
  };

  const handleFactureCreee = (facture) => {
    setRefreshList((prev) => prev + 1);
    setView('list');
  };

  return (
    <>
      {view === 'list' && (
        <DevisList onSelectDevis={handleSelectDevis} onCreateDevis={handleCreateDevis} />
      )}
      {view === 'form' && (
        <DevisForm devisId={formDevisId} onSave={handleSaveDevis} onCancel={handleCancelForm} />
      )}
      {view === 'detail' && selectedDevisId && (
        <DevisDetail
          devisId={selectedDevisId}
          onBack={handleBackFromDetail}
          onFactureCreee={handleFactureCreee}
        />
      )}
    </>
  );
};

export default DevisManager;
