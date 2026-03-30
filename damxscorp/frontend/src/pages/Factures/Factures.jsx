// /frontend/src/pages/Factures/Factures.jsx
import React, { useState } from 'react';

// Composants Devis
import DevisList      from '../../components/Devis/DevisList';
import DevisForm      from '../../components/Devis/DevisForm';
import DevisDetail    from '../../components/Devis/DevisDetail';

// Composants Factures
import FactureList    from '../../components/Factures/FactureList';
import FactureForm    from '../../components/Factures/FactureForm';
import FactureDetail  from '../../components/Factures/FactureDetail';
import ParametresFacturation from '../../components/Factures/ParametresFacturation';

import './Factures.css';

// ===========================================================================
// Page principale Factures & Devis
// ===========================================================================

const Factures = () => {
  // Onglet actif : 'devis' | 'factures' | 'parametres'
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

    if (onglet === 'parametres') {
      return <ParametresFacturation onBack={() => handleOnglet('devis')} />;
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
          className={`factures-page__tab ${onglet === 'parametres' ? 'factures-page__tab--active' : ''}`}
          onClick={() => handleOnglet('parametres')}
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
