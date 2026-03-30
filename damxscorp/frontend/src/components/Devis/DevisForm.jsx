// /frontend/src/components/Devis/DevisForm.jsx
//
// LOGIQUE CLÉE :
//   Mode CRÉATION (devisId = null) :
//     → On ajoute les lignes en LOCAL (état React, pas encore en DB).
//     → Quand on clique "Créer" : on crée le devis, puis on envoie toutes les
//       lignes en DB une par une, puis on navigue vers la liste.
//
//   Mode MODIFICATION (devisId fourni) :
//     → Les lignes sont chargées depuis l'API.
//     → Chaque ajout / suppression de ligne fait un appel API immédiat.
//     → Le bouton "Enregistrer" met à jour uniquement les infos générales.

import React, { useState, useEffect } from 'react';
import { fetchClients, fetchInterventionsByClient, fetchPieces } from '../../services/api';
import {
  fetchDevisById,
  createDevis,
  updateDevis,
  addLigneDevis,
  deleteLigneDevis,
} from '../../services/devisService';
import { fetchForfaits } from '../../services/parametresService';
import LoadingState from '../shared/LoadingState';
import ErrorState from '../shared/ErrorState';
import './DevisForm.css';

// Génère un identifiant temporaire pour les lignes locales (avant sauvegarde)
let tempCounter = 0;
const tempId = () => `local_${++tempCounter}`;

// Formate un montant en euros
const euros = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

// Types de ligne disponibles
const TYPE_SERVICE = 'service';   // main d'œuvre libre
const TYPE_FORFAIT = 'forfait';   // forfait prédéfini dans les paramètres
const TYPE_PIECE   = 'piece';     // pièce du stock

// ─────────────────────────────────────────────────────────────────────────────

const DevisForm = ({ devisId, onSave, onCancel }) => {
  const modeEdition = Boolean(devisId);

  // ── Données de référence ──────────────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [forfaits, setForfaits] = useState([]);

  // ── Infos générales du devis ──────────────────────────────────────────────
  const [formData, setFormData] = useState({
    client: '',
    intervention: '',
    date_validite: '',
    notes: '',
  });

  // ── Lignes ────────────────────────────────────────────────────────────────
  const [lignes, setLignes] = useState([]);

  // Formulaire d'ajout d'une nouvelle ligne
  const [ligneForm, setLigneForm] = useState({
    type: TYPE_SERVICE,
    forfait: '',        // id du forfait sélectionné
    piece: '',
    description: '',
    quantite: 1,
    prix_unitaire: '',
  });

  // ── États de chargement ───────────────────────────────────────────────────
  const [loading, setLoading] = useState(modeEdition);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ── Chargement initial : clients + pièces + forfaits ─────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [cls, pcs, forf] = await Promise.all([
          fetchClients(),
          fetchPieces(),
          fetchForfaits(false), // uniquement les actifs pour la saisie
        ]);
        setClients(Array.isArray(cls) ? cls : []);
        setPieces(Array.isArray(pcs) ? pcs : []);
        setForfaits(Array.isArray(forf) ? forf : []);
      } catch (err) {
        console.error('Erreur chargement données de base:', err);
      }
    };
    init();
  }, []);

  // ── Quand le client change : charger SES interventions ───────────────────
  useEffect(() => {
    if (!formData.client) {
      setInterventions([]);
      return;
    }
    const load = async () => {
      try {
        const data = await fetchInterventionsByClient(formData.client);
        setInterventions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erreur chargement interventions:', err);
        setInterventions([]);
      }
    };
    load();
  }, [formData.client]);

  // ── Date de validité par défaut (30 jours) ────────────────────────────────
  useEffect(() => {
    if (!modeEdition) {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setFormData((prev) => ({
        ...prev,
        date_validite: d.toISOString().split('T')[0],
      }));
    }
  }, [modeEdition]);

  // ── Chargement du devis existant (mode édition) ───────────────────────────
  useEffect(() => {
    if (!devisId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDevisById(devisId);
        setFormData({
          client: data.client || '',
          intervention: data.intervention || '',
          date_validite: data.date_validite || '',
          notes: data.notes || '',
        });
        setLignes(
          (data.lignes_devis || []).map((l) => ({ ...l, _isLocal: false }))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [devisId]);

  // ── Calcul des totaux ─────────────────────────────────────────────────────
  const totaux = lignes.reduce(
    (acc, l) => ({ ...acc, ht: acc.ht + parseFloat(l.prix_unitaire) * parseInt(l.quantite, 10) }),
    { ht: 0 }
  );
  totaux.tva = totaux.ht * 0.2;
  totaux.ttc = totaux.ht + totaux.tva;

  // ── Changements formulaire général ───────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'client') {
      setFormData((prev) => ({ ...prev, client: value, intervention: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ── Gestion du formulaire d'ajout de ligne ────────────────────────────────
  const handleLigneChange = (e) => {
    const { name, value } = e.target;

    if (name === 'type') {
      // Réinitialiser le formulaire quand on change de type
      setLigneForm({ type: value, forfait: '', piece: '', description: '', quantite: 1, prix_unitaire: '' });
      return;
    }

    if (name === 'forfait' && value) {
      // Auto-remplir description + prix depuis le forfait sélectionné
      const f = forfaits.find((x) => x.id.toString() === value);
      if (f) {
        setLigneForm((prev) => ({
          ...prev,
          forfait: value,
          description: f.nom,
          prix_unitaire: parseFloat(f.prix_forfait),
        }));
        return;
      }
    }

    if (name === 'piece' && value) {
      // Auto-remplir depuis la pièce
      const p = pieces.find((x) => x.id.toString() === value);
      if (p) {
        setLigneForm((prev) => ({
          ...prev,
          piece: value,
          description: p.nom,
          prix_unitaire: parseFloat(p.prix_vente) || '',
        }));
        return;
      }
    }

    setLigneForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Ajouter une ligne ─────────────────────────────────────────────────────
  const handleAddLigne = async () => {
    if (!ligneForm.description.trim()) {
      alert('La description est obligatoire.');
      return;
    }
    if (!ligneForm.prix_unitaire || parseFloat(ligneForm.prix_unitaire) < 0) {
      alert('Le prix unitaire est obligatoire et doit être positif.');
      return;
    }
    if (parseInt(ligneForm.quantite, 10) < 1) {
      alert('La quantité doit être au moins 1.');
      return;
    }

    const ligneData = {
      piece: ligneForm.type === TYPE_PIECE && ligneForm.piece
        ? parseInt(ligneForm.piece, 10)
        : null,
      description: ligneForm.description.trim(),
      quantite: parseInt(ligneForm.quantite, 10),
      prix_unitaire: parseFloat(ligneForm.prix_unitaire),
      _isForfait: ligneForm.type === TYPE_FORFAIT, // indicateur visuel uniquement
    };

    if (modeEdition) {
      try {
        const nouvelleLigne = await addLigneDevis(devisId, {
          piece: ligneData.piece,
          description: ligneData.description,
          quantite: ligneData.quantite,
          prix_unitaire: ligneData.prix_unitaire,
        });
        // ← ajout par le BAS du tableau
        setLignes((prev) => [
          ...prev,
          { ...nouvelleLigne, _isLocal: false, _isForfait: ligneData._isForfait },
        ]);
      } catch (err) {
        alert(`Erreur : ${err.message}`);
        return;
      }
    } else {
      // ← ajout par le BAS du tableau
      setLignes((prev) => [...prev, { ...ligneData, id: tempId(), _isLocal: true }]);
    }

    // Réinitialiser le formulaire d'ajout
    setLigneForm({ type: ligneForm.type, forfait: '', piece: '', description: '', quantite: 1, prix_unitaire: '' });
  };

  // ── Supprimer une ligne ───────────────────────────────────────────────────
  const handleDeleteLigne = async (ligne) => {
    if (!window.confirm('Supprimer cette ligne ?')) return;

    if (ligne._isLocal) {
      setLignes((prev) => prev.filter((l) => l.id !== ligne.id));
    } else {
      try {
        await deleteLigneDevis(ligne.id);
        setLignes((prev) => prev.filter((l) => l.id !== ligne.id));
      } catch (err) {
        alert(`Erreur suppression : ${err.message}`);
      }
    }
  };

  // ── Sauvegarder ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.client) {
      alert('Le client est obligatoire.');
      return;
    }
    if (!formData.date_validite) {
      alert('La date de validité est obligatoire.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        client: parseInt(formData.client, 10),
        intervention: formData.intervention ? parseInt(formData.intervention, 10) : null,
        date_validite: formData.date_validite,
        notes: formData.notes,
      };

      if (modeEdition) {
        await updateDevis(devisId, payload);
        onSave();
      } else {
        const nouveauDevis = await createDevis(payload);
        for (const ligne of lignes) {
          await addLigneDevis(nouveauDevis.id, {
            piece: ligne.piece || null,
            description: ligne.description,
            quantite: ligne.quantite,
            prix_unitaire: ligne.prix_unitaire,
          });
        }
        onSave();
      }
    } catch (err) {
      alert(`Erreur sauvegarde : ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Affichage ─────────────────────────────────────────────────────────────
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const pieceSelectionnee = ligneForm.type === TYPE_PIECE && ligneForm.piece
    ? pieces.find((p) => p.id.toString() === ligneForm.piece)
    : null;

  return (
    <div className="devis-form">
      {/* En-tête */}
      <div className="devis-form__header">
        <button className="devis-form__btn-back" onClick={onCancel}>← Retour</button>
        <h2 className="devis-form__title">
          {modeEdition ? 'Modifier le devis' : 'Nouveau devis'}
        </h2>
      </div>

      <div className="devis-form__container">

        {/* ── Section 1 : Infos client + devis (compacté) ──────────────── */}
        <div className="devis-form__section">
          <h3 className="devis-form__section-title">📋 Informations</h3>

          {/* Ligne 1 : Client + Date validité côte à côte */}
          <div className="devis-form__client-compact">
            <div className="devis-form__group">
              <label className="devis-form__label">Client *</label>
              <select
                name="client"
                value={formData.client}
                onChange={handleChange}
                className="devis-form__input"
                disabled={modeEdition}
              >
                <option value="">— Sélectionner un client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.prenom}
                  </option>
                ))}
              </select>
            </div>

            <div className="devis-form__group">
              <label className="devis-form__label">Validité *</label>
              <input
                type="date"
                name="date_validite"
                value={formData.date_validite}
                onChange={handleChange}
                className="devis-form__input"
              />
            </div>
          </div>

          {/* Ligne 2 : Intervention liée */}
          <div className="devis-form__intervention-row">
            <div className="devis-form__group" style={{ marginBottom: 0 }}>
              <label className="devis-form__label">Intervention liée (optionnel)</label>
              <select
                name="intervention"
                value={formData.intervention}
                onChange={handleChange}
                className="devis-form__input"
              >
                <option value="">— Aucune —</option>
                {interventions.map((i) => {
                  const date = new Date(i.date_debut).toLocaleDateString('fr-FR');
                  const vehicule = i.vehicule_immatriculation
                    ? ` — ${i.vehicule_marque} ${i.vehicule_modele} (${i.vehicule_immatriculation})`
                    : '';
                  const desc = i.description ? ` — ${i.description.substring(0, 40)}` : '';
                  return (
                    <option key={i.id} value={i.id}>
                      {date}{vehicule}{desc}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Notes (collapsibles visuellement — juste en dernier) */}
          <div className="devis-form__group" style={{ marginTop: 12, marginBottom: 0 }}>
            <label className="devis-form__label">Notes internes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="devis-form__textarea"
              rows={2}
              placeholder="Observations, remarques..."
            />
          </div>
        </div>

        {/* ── Section 2 : Lignes ──────────────────────────────────────── */}
        <div className="devis-form__section">
          <h3 className="devis-form__section-title">🔧 Pièces &amp; Main d'œuvre</h3>

          {/* Tableau des lignes déjà ajoutées */}
          {lignes.length > 0 ? (
            <table className="devis-form__lignes-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="text-center">Qté</th>
                  <th className="text-right">Prix unit.</th>
                  <th className="text-right">Sous-total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne) => (
                  <tr key={ligne.id} className={ligne._isLocal ? 'devis-form__ligne--local' : ''}>
                    <td>
                      {ligne.description}
                      {ligne._isForfait && (
                        <span className="devis-form__forfait-badge"> ★ forfait</span>
                      )}
                      {ligne._isLocal && (
                        <span className="devis-form__local-badge"> (non sauvegardé)</span>
                      )}
                    </td>
                    <td className="text-center">{ligne.quantite}</td>
                    <td className="text-right">{euros(ligne.prix_unitaire)}</td>
                    <td className="text-right">
                      {euros(parseFloat(ligne.prix_unitaire) * parseInt(ligne.quantite, 10))}
                    </td>
                    <td>
                      <button
                        className="devis-form__btn-delete-ligne"
                        onClick={() => handleDeleteLigne(ligne)}
                        title="Supprimer cette ligne"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="devis-form__empty">
              Aucune ligne pour l'instant. Ajoutez une prestation ou une pièce ci-dessous.
            </p>
          )}

          {/* ── Formulaire d'ajout de ligne ── */}
          <div className="devis-form__add-ligne">
            <h4 className="devis-form__add-ligne-title">Ajouter une ligne</h4>

            {/* Toggle Service / Forfait / Pièce */}
            <div className="devis-form__type-toggle">
              <button
                type="button"
                className={`devis-form__type-btn ${ligneForm.type === TYPE_SERVICE ? 'devis-form__type-btn--active' : ''}`}
                onClick={() => handleLigneChange({ target: { name: 'type', value: TYPE_SERVICE } })}
              >
                🛠️ Main d'œuvre libre
              </button>
              <button
                type="button"
                className={`devis-form__type-btn ${ligneForm.type === TYPE_FORFAIT ? 'devis-form__type-btn--active' : ''}`}
                onClick={() => handleLigneChange({ target: { name: 'type', value: TYPE_FORFAIT } })}
              >
                ⭐ Forfait
              </button>
              <button
                type="button"
                className={`devis-form__type-btn ${ligneForm.type === TYPE_PIECE ? 'devis-form__type-btn--active' : ''}`}
                onClick={() => handleLigneChange({ target: { name: 'type', value: TYPE_PIECE } })}
              >
                🔩 Pièce du stock
              </button>
            </div>

            {/* ── Sélecteur de forfait ── */}
            {ligneForm.type === TYPE_FORFAIT && (
              <div className="devis-form__forfait-selector">
                <p className="devis-form__forfait-selector-title">
                  Choisissez un forfait (le prix est pré-rempli automatiquement)
                </p>
                {forfaits.length === 0 ? (
                  <p className="devis-form__no-forfaits">
                    Aucun forfait configuré. Allez dans les Paramètres pour en créer.
                  </p>
                ) : (
                  <div className="devis-form__forfait-grid">
                    {forfaits.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`devis-form__forfait-card ${ligneForm.forfait === f.id.toString() ? 'devis-form__forfait-card--active' : ''}`}
                        onClick={() => handleLigneChange({ target: { name: 'forfait', value: f.id.toString() } })}
                      >
                        <span className="devis-form__forfait-card-nom">{f.nom}</span>
                        <span className="devis-form__forfait-card-prix">{euros(f.prix_forfait)}</span>
                        {f.description && (
                          <span className="devis-form__forfait-card-desc">{f.description}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Sélecteur de pièce ── */}
            {ligneForm.type === TYPE_PIECE && (
              <div className="devis-form__group">
                <label className="devis-form__label">Choisir une pièce</label>
                <select
                  name="piece"
                  value={ligneForm.piece}
                  onChange={handleLigneChange}
                  className="devis-form__input"
                >
                  <option value="">— Sélectionner dans le stock —</option>
                  {pieces.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock_disponible <= 0}>
                      {p.nom} — {euros(p.prix_vente)}
                      {p.stock_disponible <= 0
                        ? ' (RUPTURE)'
                        : ` (dispo: ${p.stock_disponible})`}
                    </option>
                  ))}
                </select>
                {pieceSelectionnee && (
                  <p className="devis-form__stock-info">
                    Stock disponible : <strong>{pieceSelectionnee.stock_disponible}</strong> unité(s)
                    {pieceSelectionnee.stock_suspendu > 0 && (
                      <span className="devis-form__stock-suspendu">
                        {' '}({pieceSelectionnee.stock_suspendu} sur d'autres devis)
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Description + Quantité + Prix */}
            <div className="devis-form__row">
              <div className="devis-form__group devis-form__group--large">
                <label className="devis-form__label">
                  {ligneForm.type === TYPE_FORFAIT ? 'Description (modifiable)' : 'Description'}
                </label>
                <input
                  type="text"
                  name="description"
                  value={ligneForm.description}
                  onChange={handleLigneChange}
                  placeholder={
                    ligneForm.type === TYPE_SERVICE
                      ? "Ex : Main d'œuvre vidange — 1h"
                      : ligneForm.type === TYPE_FORFAIT
                      ? 'Sélectionnez un forfait ci-dessus…'
                      : 'Nom de la pièce'
                  }
                  className="devis-form__input"
                />
              </div>

              <div className="devis-form__group devis-form__group--small">
                <label className="devis-form__label">Quantité</label>
                <input
                  type="number"
                  name="quantite"
                  value={ligneForm.quantite}
                  onChange={handleLigneChange}
                  min={1}
                  className="devis-form__input"
                />
              </div>

              <div className="devis-form__group devis-form__group--small">
                <label className="devis-form__label">Prix HT (€)</label>
                <input
                  type="number"
                  name="prix_unitaire"
                  value={ligneForm.prix_unitaire}
                  onChange={handleLigneChange}
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  className="devis-form__input"
                />
              </div>
            </div>

            {/* Sous-total en live */}
            {ligneForm.prix_unitaire && ligneForm.quantite && (
              <p className="devis-form__sous-total-preview">
                Sous-total :{' '}
                <strong>
                  {euros(parseFloat(ligneForm.prix_unitaire) * parseInt(ligneForm.quantite, 10))}
                </strong>
              </p>
            )}

            <button
              type="button"
              className="devis-form__btn-add-ligne"
              onClick={handleAddLigne}
            >
              + Ajouter cette ligne
            </button>
          </div>
        </div>

        {/* ── Section 3 : Totaux ──────────────────────────────────────────── */}
        <div className="devis-form__totaux">
          <div className="devis-form__total-row">
            <span>Montant HT</span>
            <strong>{euros(totaux.ht)}</strong>
          </div>
          <div className="devis-form__total-row">
            <span>TVA (20%)</span>
            <strong>{euros(totaux.tva)}</strong>
          </div>
          <div className="devis-form__total-row devis-form__total-ttc">
            <span>Total TTC</span>
            <strong>{euros(totaux.ttc)}</strong>
          </div>
        </div>

        {/* ── Footer : actions ─────────────────────────────────────────────── */}
        <div className="devis-form__footer">
          <button className="devis-form__btn-cancel" onClick={onCancel} disabled={saving}>
            Annuler
          </button>
          <button className="devis-form__btn-save" onClick={handleSave} disabled={saving}>
            {saving
              ? 'Sauvegarde en cours...'
              : modeEdition
              ? 'Enregistrer les modifications'
              : `Créer le devis${lignes.length > 0 ? ` (${lignes.length} ligne${lignes.length > 1 ? 's' : ''})` : ''}`}
          </button>
        </div>

        {!modeEdition && lignes.length === 0 && (
          <p className="devis-form__info">
            💡 Vous pouvez créer le devis sans lignes et les ajouter ensuite.
          </p>
        )}
      </div>
    </div>
  );
};

export default DevisForm;
