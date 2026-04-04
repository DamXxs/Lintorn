// /frontend/src/pages/Factures/Factures.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Composants Devis
import DevisList      from '../../pages/Factures/Devis/DevisList';
import DevisForm      from '../../pages/Factures/Devis/DevisForm';
import DevisDetail    from '../../pages/Factures/Devis/DevisDetail';

// Composants Factures
import FactureList    from '../../pages/Factures/Factures/FactureList';
import FactureForm    from '../../pages/Factures/Factures/FactureForm';
import FactureDetail  from '../../pages/Factures/Factures/FactureDetail';

import './Factures.css';

// ===========================================================================
// Page principale Factures & Devis
// ===========================================================================

const Factures = () => {
  const navigate = useNavigate();

  // Onglet actif : 'devis' | 'factures'
  const [onglet, setOnglet] = useState('devis');

  // Vue dans l'onglet Devis : 'list' | 'create' | 'edit' | 'detail'
  const [vueDevis, setVueDevis] = useState('list');
  const [devisSelectionneId, setDevisSelectionneId] = useState(null);

  // Vue dans l'onglet Factures : 'list' | 'create' | 'detail'
  const [vueFacture, setVueFacture] = useState('list');
  const [factureSelectionneeId, setFactureSelectionneeId] = useState(null);

  // ─── Handlers Devis ───────────────────────────────────────────────────────

  const handleSelectDevis = (devis) => {
    setDevisSelectionneId(devis.id);
    setVueDevis('detail');
  };

  const handleCreateDevis = () => {
    setDevisSelectionneId(null);
    setVueDevis('create');
  };

  const handleDevisSaved = () => {
    setVueDevis('list');
    setDevisSelectionneId(null);
  };

  const handleDevisBack = () => {
    setVueDevis('list');
    setDevisSelectionneId(null);
  };

  const handleEditDevis = (devisId) => {
    setDevisSelectionneId(devisId);
    setVueDevis('edit');
  };

  const handleDevisEdited = () => {
    // Après modification, on retourne au détail pour voir les changements
    setVueDevis('detail');
  };

  // Quand une facture est créée depuis un devis → basculer sur l'onglet factures
  const handleFactureCreee = (facture) => {
    setOnglet('factures');
    setFactureSelectionneeId(facture.id);
    setVueFacture('detail');
  };

  // ─── Handlers Factures ────────────────────────────────────────────────────

  const handleSelectFacture = (facture) => {
    setFactureSelectionneeId(facture.id);
    setVueFacture('detail');
  };

  const handleCreateFacture = () => {
    setFactureSelectionneeId(null);
    setVueFacture('create');
  };

  const handleFactureSaved = () => {
    setVueFacture('list');
    setFactureSelectionneeId(null);
  };

  const handleFactureBack = () => {
    setVueFacture('list');
    setFactureSelectionneeId(null);
  };

  // ─── Changement d'onglet ──────────────────────────────────────────────────

  const handleOnglet = (nouvelOnglet) => {
    setOnglet(nouvelOnglet);
    setVueDevis('list');
    setDevisSelectionneId(null);
    setVueFacture('list');
    setFactureSelectionneeId(null);
  };

  // ─── Contenu selon onglet + vue ───────────────────────────────────────────

  const renderContenu = () => {
    if (onglet === 'devis') {
      if (vueDevis === 'create') {
        return (
          <DevisForm
            devisId={null}
            onSave={handleDevisSaved}
            onCancel={handleDevisBack}
          />
        );
      }
      if (vueDevis === 'edit' && devisSelectionneId) {
        return (
          <DevisForm
            devisId={devisSelectionneId}
            onSave={handleDevisEdited}
            onCancel={() => setVueDevis('detail')}
          />
        );
      }
      if (vueDevis === 'detail' && devisSelectionneId) {
        return (
          <DevisDetail
            devisId={devisSelectionneId}
            onBack={handleDevisBack}
            onFactureCreee={handleFactureCreee}
            onEdit={handleEditDevis}
          />
        );
      }
      // Par défaut : liste
      return (
        <DevisList
          onSelectDevis={handleSelectDevis}
          onCreateDevis={handleCreateDevis}
          onEditDevis={handleEditDevis}
        />
      );
    }

    if (onglet === 'factures') {
      if (vueFacture === 'create') {
        return (
          <FactureForm
            onSave={handleFactureSaved}
            onCancel={handleFactureBack}
          />
        );
      }
      if (vueFacture === 'detail' && factureSelectionneeId) {
        return (
          <FactureDetail
            factureId={factureSelectionneeId}
            onBack={handleFactureBack}
          />
        );
      }
      return (
        <FactureList
          onSelectFacture={handleSelectFacture}
          onCreateFacture={handleCreateFacture}
        />
      );
    }

    return null;
  };

  return (
    <div className="factures-page">
      {/* Onglets de navigation */}
      <div className="factures-page__tabs">
        <button
          className={`factures-page__tab ${onglet === 'devis' ? 'factures-page__tab--active' : ''}`}
          onClick={() => handleOnglet('devis')}
        >
          📋 Devis
        </button>
        <button
          className={`factures-page__tab ${onglet === 'factures' ? 'factures-page__tab--active' : ''}`}
          onClick={() => handleOnglet('factures')}
        >
          🧾 Factures
        </button>
        <button
          className="factures-page__tab"
          onClick={() => navigate('/parametres')}
          title="Accéder aux paramètres de facturation (TVA, forfaits…)"
        >
          ⚙️ Paramètres
        </button>
      </div>

      {/* Contenu de l'onglet */}
      <div className="factures-page__content">
        {renderContenu()}
      </div>
    </div>
  );
};

export default Factures;
