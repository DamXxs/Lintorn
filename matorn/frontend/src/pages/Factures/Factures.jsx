// /frontend/src/pages/Factures/Factures/Factures.jsx
import React, { useState } from 'react';

import DevisList   from './Devis/DevisList';
import DevisForm   from './Devis/DevisForm';
import DevisDetail from './Devis/DevisDetail';

import FactureList   from './Factures/FactureList';
import FactureForm   from './Factures/FactureForm';
import FactureDetail from './Factures/FactureDetail';

// ParametresFacturation est maintenant intégré ici,
// plus besoin de naviguer vers /parametres
import ParametresFacturation from '../Parametres/ParametresFacturation';

import './Factures.css';
import '../../components/shared/list-page.css';

const Factures = () => {
  // Onglet actif : 'devis' | 'factures' | 'parametres'
  const [onglet, setOnglet] = useState('devis');

  // Vue Devis
  const [vueDevis,          setVueDevis]          = useState('list');
  const [devisSelectionneId, setDevisSelectionneId] = useState(null);

  // Vue Factures
  const [vueFacture,            setVueFacture]            = useState('list');
  const [factureSelectionneeId, setFactureSelectionneeId] = useState(null);

  // ── Handlers Devis ──────────────────────────────────────────
  const handleSelectDevis  = (devis) => { setDevisSelectionneId(devis.id); setVueDevis('detail'); };
  const handleCreateDevis  = ()      => { setDevisSelectionneId(null);     setVueDevis('create'); };
  const handleDevisSaved   = ()      => { setVueDevis('list'); setDevisSelectionneId(null); };
  const handleDevisBack    = ()      => { setVueDevis('list'); setDevisSelectionneId(null); };
  const handleEditDevis    = (id)    => { setDevisSelectionneId(id);       setVueDevis('edit');   };
  const handleDevisEdited  = ()      => { setVueDevis('detail'); };

  const handleFactureCreee = (facture) => {
    setOnglet('factures');
    setFactureSelectionneeId(facture.id);
    setVueFacture('detail');
  };

  // ── Handlers Factures ────────────────────────────────────────
  const handleSelectFacture = (facture) => { setFactureSelectionneeId(facture.id); setVueFacture('detail'); };
  const handleCreateFacture = ()        => { setFactureSelectionneeId(null);        setVueFacture('create'); };
  const handleFactureSaved  = ()        => { setVueFacture('list'); setFactureSelectionneeId(null); };
  const handleFactureBack   = ()        => { setVueFacture('list'); setFactureSelectionneeId(null); };

  // ── Changement d'onglet ──────────────────────────────────────
  const handleOnglet = (nouvelOnglet) => {
    setOnglet(nouvelOnglet);
    setVueDevis('list');
    setDevisSelectionneId(null);
    setVueFacture('list');
    setFactureSelectionneeId(null);
  };

  // ── Rendu du contenu ─────────────────────────────────────────
  const renderContenu = () => {
    if (onglet === 'parametres') {
      return (
        // Le wrapper reçoit la classe pulse quand pulseActif = true
        <div className="factures-params-wrap">
          <ParametresFacturation embedded={true} />
        </div>
      );
    }

    if (onglet === 'devis') {
      if (vueDevis === 'create') return <DevisForm devisId={null} onSave={handleDevisSaved} onCancel={handleDevisBack} />;
      if (vueDevis === 'edit' && devisSelectionneId) return <DevisForm devisId={devisSelectionneId} onSave={handleDevisEdited} onCancel={() => setVueDevis('detail')} />;
      if (vueDevis === 'detail' && devisSelectionneId) return <DevisDetail devisId={devisSelectionneId} onBack={handleDevisBack} onFactureCreee={handleFactureCreee} onEdit={handleEditDevis} />;
      return <DevisList onSelectDevis={handleSelectDevis} onCreateDevis={handleCreateDevis} onEditDevis={handleEditDevis} />;
    }

    if (onglet === 'factures') {
      if (vueFacture === 'create') return <FactureForm onSave={handleFactureSaved} onCancel={handleFactureBack} />;
      if (vueFacture === 'detail' && factureSelectionneeId) return <FactureDetail factureId={factureSelectionneeId} onBack={handleFactureBack} />;
      return <FactureList onSelectFacture={handleSelectFacture} onCreateFacture={handleCreateFacture} />;
    }

    return null;
  };

  return (
    <div className="list-page">

      {/* ONGLETS */}
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

        {/* Onglet Paramètres — avec point pulse sur l'onglet lui-même */}
        <button
          className={`factures-page__tab ${onglet === 'parametres' ? 'factures-page__tab--active' : ''}`}
          onClick={() => handleOnglet('parametres')}
        >
          ⚙️ Paramètres
          
        </button>
      </div>

      {/* CONTENU */}
      <div className="factures-page__content">
        {renderContenu()}
      </div>

    </div>
  );
};

export default Factures;