// /frontend/src/components/Devis/DevisManager.jsx
import React, { useState } from 'react';
import DevisList from './DevisList';
import DevisForm from './DevisForm';
import DevisDetail from './DevisDetail';
import DevisPDFModal from './DevisPDFModal';

/**
 * 📋 DevisManager — Gestionnaire complet des devis
 *
 * Gère les transitions entre les vues :
 * - 'list'   → DevisList  (tableau de tous les devis)
 * - 'form'   → DevisForm  (création / modification)
 * - 'detail' → DevisDetail (fiche complète + actions)
 * - 'pdf'    → DevisPDFModal (aperçu PDF direct depuis la liste)
 */
const DevisManager = () => {
  const [view, setView] = useState('list');
  const [selectedDevisId, setSelectedDevisId] = useState(null);
  const [formDevisId, setFormDevisId] = useState(null);
  const [pdfDevisId, setPdfDevisId] = useState(null);
  const [refreshList, setRefreshList] = useState(0);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectDevis = (devis) => {
    setSelectedDevisId(devis.id);
    setView('detail');
  };

  const handleCreateDevis = () => {
    setFormDevisId(null);
    setView('form');
  };

  const handleEditDevis = (id) => {
    setFormDevisId(id);
    setView('form');
  };

  const handleSaveDevis = () => {
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

  // ── Ouvre le PDF directement depuis la liste ──────────────────────────────
  const handleViewPDF = (devisId) => {
    setPdfDevisId(devisId);
    setView('pdf');
  };

  const handleClosePDF = () => {
    setPdfDevisId(null);
    setView('list');
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <>
      {view === 'list' && (
        <DevisList
          key={refreshList}
          onSelectDevis={handleSelectDevis}
          onCreateDevis={handleCreateDevis}
          onEditDevis={handleEditDevis}
          onViewPDF={handleViewPDF}
        />
      )}

      {view === 'form' && (
        <DevisForm
          devisId={formDevisId}
          onSave={handleSaveDevis}
          onCancel={handleCancelForm}
        />
      )}

      {view === 'detail' && selectedDevisId && (
        <DevisDetail
          devisId={selectedDevisId}
          onBack={handleBackFromDetail}
          onFactureCreee={handleFactureCreee}
          onEdit={handleEditDevis}
        />
      )}

      {view === 'pdf' && pdfDevisId && (
        <DevisPDFModal
          devisId={pdfDevisId}
          onClose={handleClosePDF}
        />
      )}
    </>
  );
};

export default DevisManager;
