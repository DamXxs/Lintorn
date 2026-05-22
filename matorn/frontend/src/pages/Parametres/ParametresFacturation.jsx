// /frontend/src/pages/Parametres/ParametresFacturation.jsx
//
// Trois sections :
//  1. Infos garage — nom, adresse, téléphone, email, SIRET, N° TVA
//  2. TVA — modifier le taux de TVA global
//  3. Forfaits intervention — catalogue des prestations de main d'œuvre

import React, { useState, useEffect } from 'react';
import {
  fetchParametres,
  updateParametres,
  fetchForfaits,
  createForfait,
  updateForfait,
  deleteForfait,
} from './parametresService';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { getApiError } from '../../utils/apiError';
import './ParametresFacturation.css';

// ── Formulaire vierge pour un nouveau forfait ─────────────────────────────────
const FORFAIT_VIDE = { nom: '', description: '', prix_forfait: '', actif: true };

// ── Formulaire vierge infos garage ───────────────────────────────────────────
const GARAGE_VIDE = {
  nom_garage:       '',
  adresse_garage:   '',
  telephone_garage: '',
  email_garage:     '',
  siret:            '',
  numero_tva:       '',
};

const ParametresFacturation = ({ onBack, embedded = false }) => {
  // ── Infos garage ─────────────────────────────────────────────────────────────
  const [garageForm, setGarageForm]         = useState(GARAGE_VIDE);
  const [savingGarage, setSavingGarage]     = useState(false);
  const [successGarage, setSuccessGarage]   = useState('');
  const [errorGarage, setErrorGarage]       = useState(null);

  // ── TVA ───────────────────────────────────────────────────────────────────────
  const [parametres, setParametres]         = useState({ tva_pourcentage: 20 });
  const [savingParams, setSavingParams]     = useState(false);
  const [successParams, setSuccessParams]   = useState('');
  const [errorParams, setErrorParams]       = useState(null);

  // ── Forfaits ──────────────────────────────────────────────────────────────────
  const [forfaits, setForfaits]             = useState([]);
  const [loadingForfaits, setLoadingForfaits] = useState(true);
  const [errorForfaits, setErrorForfaits]   = useState(null);

  const [forfaitForm, setForfaitForm]       = useState(FORFAIT_VIDE);
  const [editingForfaitId, setEditingForfaitId] = useState(null);
  const [showForfaitForm, setShowForfaitForm]   = useState(false);
  const [savingForfait, setSavingForfait]       = useState(false);

  // ── Chargement ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [params, forf] = await Promise.all([
          fetchParametres(),
          fetchForfaits(true),
        ]);
        setParametres(params);
        setGarageForm({
          nom_garage:       params.nom_garage       || '',
          adresse_garage:   params.adresse_garage   || '',
          telephone_garage: params.telephone_garage || '',
          email_garage:     params.email_garage     || '',
          siret:            params.siret            || '',
          numero_tva:       params.numero_tva       || '',
        });
        setForfaits(Array.isArray(forf) ? forf : []);
      } catch (err) {
        setErrorParams(getApiError(err, 'Erreur lors du chargement des paramètres'));
        setErrorForfaits(getApiError(err, 'Erreur lors du chargement des forfaits'));
      } finally {
        setLoading(false);
        setLoadingForfaits(false);
      }
    };
    loadAll();
  }, []);

  // ── Sauvegarde infos garage ───────────────────────────────────────────────────
  const handleSubmitGarage = async (e) => {
    e.preventDefault();
    setSavingGarage(true);
    setErrorGarage(null);
    setSuccessGarage('');
    try {
      await updateParametres(garageForm);
      setSuccessGarage('Infos du garage mises à jour');
      setTimeout(() => setSuccessGarage(''), 3000);
    } catch (err) {
      setErrorGarage(getApiError(err, 'Erreur lors de la sauvegarde des infos garage'));
    } finally {
      setSavingGarage(false);
    }
  };

  const handleChangeGarage = (field) => (e) => {
    setGarageForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  // ── Sauvegarde TVA ────────────────────────────────────────────────────────────
  const handleSubmitParams = async (e) => {
    e.preventDefault();
    setSavingParams(true);
    setErrorParams(null);
    setSuccessParams('');
    try {
      await updateParametres({ tva_pourcentage: parametres.tva_pourcentage });
      setSuccessParams('TVA mise à jour');
      setTimeout(() => setSuccessParams(''), 3000);
    } catch (err) {
      setErrorParams(getApiError(err, 'Erreur lors de la sauvegarde de la TVA'));
    } finally {
      setSavingParams(false);
    }
  };

  const handleChangeParams = (e) => {
    let val = parseFloat(e.target.value);
    val = Math.min(100, Math.max(0, val));
    setParametres(prev => ({ ...prev, tva_pourcentage: val }));
  };

  // ── Forfaits ──────────────────────────────────────────────────────────────────
  const handleNouveauForfait = () => {
    setForfaitForm(FORFAIT_VIDE);
    setEditingForfaitId(null);
    setShowForfaitForm(true);
  };

  const handleEditForfait = (f) => {
    setForfaitForm({ nom: f.nom, description: f.description || '', prix_forfait: f.prix_forfait, actif: f.actif });
    setEditingForfaitId(f.id);
    setShowForfaitForm(true);
  };

  const handleSaveForfait = async (e) => {
    e.preventDefault();
    if (!forfaitForm.nom.trim()) { alert('Le nom du forfait est obligatoire.'); return; }
    if (!forfaitForm.prix_forfait || parseFloat(forfaitForm.prix_forfait) < 0) {
      alert('Le prix est obligatoire et doit être positif.');
      return;
    }
    setSavingForfait(true);
    try {
      const data = {
        nom:         forfaitForm.nom.trim(),
        description: forfaitForm.description.trim() || null,
        prix_forfait: parseFloat(forfaitForm.prix_forfait),
        actif:       forfaitForm.actif,
      };
      if (editingForfaitId) {
        const updated = await updateForfait(editingForfaitId, data);
        setForfaits(prev => prev.map(f => f.id === editingForfaitId ? updated : f));
      } else {
        const created = await createForfait(data);
        setForfaits(prev => [...prev, created]);
      }
      setShowForfaitForm(false);
    } catch (err) {
      alert(`Erreur : ${getApiError(err, 'Erreur lors de l\'enregistrement du forfait')}`);
    } finally {
      setSavingForfait(false);
    }
  };

  const handleToggleActif = async (f) => {
    try {
      const updated = await updateForfait(f.id, { actif: !f.actif });
      setForfaits(prev => prev.map(x => x.id === f.id ? updated : x));
    } catch (err) {
      alert(`Erreur : ${getApiError(err, 'Erreur lors de la mise à jour du forfait')}`);
    }
  };

  const handleDeleteForfait = async (f) => {
    if (!window.confirm(`Supprimer le forfait "${f.nom}" ?`)) return;
    try {
      await deleteForfait(f.id);
      setForfaits(prev => prev.filter(x => x.id !== f.id));
    } catch (err) {
      alert(`Erreur : ${getApiError(err, 'Erreur lors de la suppression du forfait')}`);
    }
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────────
  if (loading) return <LoadingState />;
  if (errorParams && !parametres.tva_pourcentage) return <ErrorState error={errorParams} />;

  const euros = (n) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <div className="parametres-facturation">

      {!embedded && (
        <div className="parametres-facturation__header">
          <button className="parametres-facturation__btn-back" onClick={onBack}>
            ← Retour
          </button>
          <h1 className="parametres-facturation__title">Paramètres de facturation</h1>
        </div>
      )}

      {/* ── Section Infos Garage ─────────────────────────────────────────────── */}
      <form onSubmit={handleSubmitGarage}>
        <div className="parametres-facturation__section">
          <div className="parametres-facturation__section-header">
            <h2 className="parametres-facturation__section-title">🏢 Informations du garage</h2>
          </div>
          <p className="parametres-facturation__section-desc">
            Ces informations apparaissent sur les ordres de réparation et les documents imprimés.
          </p>

          <div className="parametres-facturation__garage-grid">
            <div className="parametres-facturation__group">
              <label>Nom du garage</label>
              <input
                type="text"
                value={garageForm.nom_garage}
                onChange={handleChangeGarage('nom_garage')}
                placeholder="Ex : Garage Dupont"
              />
            </div>
            <div className="parametres-facturation__group">
              <label>Téléphone</label>
              <input
                type="text"
                value={garageForm.telephone_garage}
                onChange={handleChangeGarage('telephone_garage')}
                placeholder="Ex : 05 61 00 00 00"
              />
            </div>
            <div className="parametres-facturation__group parametres-facturation__garage-full">
              <label>Adresse</label>
              <input
                type="text"
                value={garageForm.adresse_garage}
                onChange={handleChangeGarage('adresse_garage')}
                placeholder="Ex : 12 rue des Mécaniciens, 31000 Toulouse"
              />
            </div>
            <div className="parametres-facturation__group">
              <label>Email</label>
              <input
                type="email"
                value={garageForm.email_garage}
                onChange={handleChangeGarage('email_garage')}
                placeholder="contact@garage.fr"
              />
            </div>
            <div className="parametres-facturation__group">
              <label>SIRET</label>
              <input
                type="text"
                value={garageForm.siret}
                onChange={handleChangeGarage('siret')}
                placeholder="12345678900000"
                maxLength="17"
              />
            </div>
            <div className="parametres-facturation__group">
              <label>N° TVA intracommunautaire</label>
              <input
                type="text"
                value={garageForm.numero_tva}
                onChange={handleChangeGarage('numero_tva')}
                placeholder="FR 12 345678901"
              />
            </div>
          </div>

          {errorGarage && (
            <div className="parametres-facturation__error">{errorGarage}</div>
          )}
          {successGarage && (
            <div className="parametres-facturation__success">✓ {successGarage}</div>
          )}

          <div className="parametres-facturation__actions">
            <button
              type="submit"
              className="parametres-facturation__btn-save"
              disabled={savingGarage}
            >
              {savingGarage ? 'Enregistrement...' : 'Sauvegarder les infos garage'}
            </button>
          </div>
        </div>
      </form>

      {/* ── Section TVA ──────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmitParams} className="parametres-facturation__form">
        <div className="parametres-facturation__section">
          <h2 className="parametres-facturation__section-title">📊 Taux de TVA</h2>

          <div className="parametres-facturation__group" style={{ maxWidth: '200px' }}>
            <label htmlFor="tva_pourcentage">Pourcentage (%)</label>
            <input
              type="number"
              id="tva_pourcentage"
              value={parametres.tva_pourcentage}
              onChange={handleChangeParams}
              min="0"
              max="100"
              step="0.01"
              required
            />
            <small className="parametres-facturation__help">Valeur entre 0 et 100</small>
          </div>

          {errorParams && (
            <div className="parametres-facturation__error">{errorParams}</div>
          )}
          {successParams && (
            <div className="parametres-facturation__success">✓ {successParams}</div>
          )}

          <div className="parametres-facturation__actions">
            <button
              type="submit"
              className="parametres-facturation__btn-save"
              disabled={savingParams}
            >
              {savingParams ? 'Enregistrement...' : 'Sauvegarder la TVA'}
            </button>
          </div>
        </div>
      </form>

      {/* ── Section Forfaits Intervention ────────────────────────────────────── */}
      <div className="parametres-facturation__section">
        <div className="parametres-facturation__section-header">
          <h2 className="parametres-facturation__section-title">🔧 Forfaits main d'œuvre</h2>
          <button
            className="parametres-facturation__btn-add-forfait"
            onClick={handleNouveauForfait}
          >
            + Nouveau forfait
          </button>
        </div>
        <p className="parametres-facturation__section-desc">
          Catalogue de prestations avec prix prédéfinis, utilisable dans les devis.
        </p>

        {showForfaitForm && (
          <form className="parametres-facturation__forfait-form" onSubmit={handleSaveForfait}>
            <h3 className="parametres-facturation__forfait-form-title">
              {editingForfaitId ? '✏️ Modifier le forfait' : '➕ Nouveau forfait'}
            </h3>
            <div className="parametres-facturation__forfait-form-row">
              <div className="parametres-facturation__group parametres-facturation__group--large">
                <label>Nom du forfait *</label>
                <input
                  type="text"
                  value={forfaitForm.nom}
                  onChange={e => setForfaitForm(p => ({ ...p, nom: e.target.value }))}
                  placeholder="Ex : Révision simple"
                  required
                />
              </div>
              <div className="parametres-facturation__group parametres-facturation__group--small">
                <label>Prix HT (€) *</label>
                <input
                  type="number"
                  value={forfaitForm.prix_forfait}
                  onChange={e => setForfaitForm(p => ({ ...p, prix_forfait: e.target.value }))}
                  min="0"
                  step="0.01"
                  placeholder="50.00"
                  required
                />
              </div>
            </div>
            <div className="parametres-facturation__group">
              <label>Description (optionnel)</label>
              <input
                type="text"
                value={forfaitForm.description}
                onChange={e => setForfaitForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Détail de la prestation..."
              />
            </div>
            <div className="parametres-facturation__group parametres-facturation__group--inline">
              <label className="parametres-facturation__toggle-label">
                <input
                  type="checkbox"
                  checked={forfaitForm.actif}
                  onChange={e => setForfaitForm(p => ({ ...p, actif: e.target.checked }))}
                />
                <span>Forfait actif (visible dans les devis)</span>
              </label>
            </div>
            <div className="parametres-facturation__forfait-form-actions">
              <button
                type="button"
                className="parametres-facturation__btn-cancel"
                onClick={() => setShowForfaitForm(false)}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="parametres-facturation__btn-save"
                disabled={savingForfait}
              >
                {savingForfait ? 'Enregistrement...' : editingForfaitId ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        )}

        {loadingForfaits ? (
          <LoadingState />
        ) : errorForfaits ? (
          <div className="parametres-facturation__error">{errorForfaits}</div>
        ) : forfaits.length === 0 ? (
          <p className="parametres-facturation__forfaits-empty">
            Aucun forfait configuré. Créez-en un pour accélérer la saisie des devis.
          </p>
        ) : (
          <table className="parametres-facturation__forfaits-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th className="text-right">Prix HT</th>
                <th className="text-center">Actif</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {forfaits.map(f => (
                <tr key={f.id} className={!f.actif ? 'parametres-facturation__forfait--inactif' : ''}>
                  <td className="parametres-facturation__forfait-nom">{f.nom}</td>
                  <td className="parametres-facturation__forfait-desc">
                    {f.description || <span style={{ opacity: 0.4 }}>—</span>}
                  </td>
                  <td className="text-right parametres-facturation__forfait-prix">
                    {euros(f.prix_forfait)}
                  </td>
                  <td className="text-center">
                    <button
                      className={`parametres-facturation__toggle-btn ${f.actif ? 'actif' : 'inactif'}`}
                      onClick={() => handleToggleActif(f)}
                      title={f.actif ? 'Désactiver' : 'Activer'}
                    >
                      {f.actif ? '✅' : '⭕'}
                    </button>
                  </td>
                  <td className="text-center parametres-facturation__forfait-actions">
                    <button
                      className="parametres-facturation__btn-icon"
                      onClick={() => handleEditForfait(f)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      className="parametres-facturation__btn-icon parametres-facturation__btn-icon--danger"
                      onClick={() => handleDeleteForfait(f)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ParametresFacturation;
