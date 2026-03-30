// /frontend/src/components/Factures/FactureForm.jsx
import React, { useState, useEffect } from 'react';
import { fetchClients, fetchPieces } from '../../services/api';
import { fetchParametres } from '../../services/parametresService';
import { createFacture } from '../../services/factureService';
import LoadingState from '../shared/LoadingState';
import ErrorState from '../shared/ErrorState';
import './FactureForm.css';

const FactureForm = ({ onSave, onCancel }) => {
  const [clients, setClients] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [tva, setTva] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    client: '',
    date_echeance: '',
    notes: '',
  });

  const [lignes, setLignes] = useState([]);
  const [nouvelleLigne, setNouvelleLigne] = useState({
    type: 'piece',
    piece: '',
    description: '',
    quantite: 1,
    prix_unitaire: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [clientsData, piecesData, paramsData] = await Promise.all([
          fetchClients(),
          fetchPieces(),
          fetchParametres(),
        ]);
        setClients(Array.isArray(clientsData) ? clientsData : []);
        setPieces(Array.isArray(piecesData) ? piecesData : []);
        if (paramsData?.tva_pourcentage) {
          setTva(paramsData.tva_pourcentage);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNouvelleLigneChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'quantite') {
      newValue = parseFloat(value) || 0;
    } else if (name === 'prix_unitaire') {
      newValue = parseFloat(value) || 0;
    } else if (name === 'type') {
      setNouvelleLigne({
        type: value,
        piece: '',
        description: '',
        quantite: 1,
        prix_unitaire: 0,
      });
      return;
    }
    setNouvelleLigne((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handlePieceSelect = (e) => {
    const pieceId = e.target.value;
    const piece = pieces.find((p) => p.id === parseInt(pieceId));
    if (piece) {
      setNouvelleLigne((prev) => ({
        ...prev,
        piece: pieceId,
        description: piece.nom,
        prix_unitaire: parseFloat(piece.prix_vente) || 0,
      }));
    } else {
      setNouvelleLigne((prev) => ({
        ...prev,
        piece: pieceId,
      }));
    }
  };

  const ajouterLigne = () => {
    if (nouvelleLigne.type === 'piece' && !nouvelleLigne.piece) {
      alert('Veuillez sélectionner une pièce');
      return;
    }
    if (nouvelleLigne.type === 'service' && !nouvelleLigne.description) {
      alert('Veuillez saisir une description');
      return;
    }
    if (nouvelleLigne.quantite <= 0) {
      alert('La quantité doit être > 0');
      return;
    }
    if (nouvelleLigne.prix_unitaire < 0) {
      alert('Le prix unitaire ne peut pas être négatif');
      return;
    }

    const ligne = {
      ...nouvelleLigne,
      id: Date.now(),
    };
    setLignes((prev) => [...prev, ligne]);
    setNouvelleLigne({
      type: 'piece',
      piece: '',
      description: '',
      quantite: 1,
      prix_unitaire: 0,
    });
  };

  const supprimerLigne = (id) => {
    setLignes((prev) => prev.filter((l) => l.id !== id));
  };

  const calculTotaux = () => {
    const montantHT = lignes.reduce(
      (sum, ligne) => sum + ligne.quantite * ligne.prix_unitaire,
      0
    );
    const montantTVA = montantHT * (tva / 100);
    const montantTTC = montantHT + montantTVA;
    return { montantHT, montantTVA, montantTTC };
  };

  const { montantHT, montantTVA, montantTTC } = calculTotaux();

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(montant);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client) {
      alert('Veuillez sélectionner un client');
      return;
    }
    if (!formData.date_echeance) {
      alert('Veuillez saisir une date d\'échéance');
      return;
    }
    if (lignes.length === 0) {
      alert('Veuillez ajouter au moins une ligne');
      return;
    }

    setSubmitting(true);
    try {
      const facturePayload = {
        client: parseInt(formData.client),
        date_echeance: formData.date_echeance,
        notes: formData.notes,
      };
      const facture = await createFacture(facturePayload);

      // Ajouter les lignes
      for (const ligne of lignes) {
        // Les lignes seront ajoutées via l'API si nécessaire
        // Pour cette implémentation basique, on suppose que créer la facture ajoute les lignes
      }

      onSave(facture);
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="facture-form">
      <h2 className="facture-form__title">Nouvelle facture</h2>

      <form onSubmit={handleSubmit} className="facture-form__form">
        {/* Section Infos générales */}
        <div className="facture-form__section">
          <h3>Informations générales</h3>

          <div className="facture-form__group">
            <label htmlFor="client">Client *</label>
            <select
              id="client"
              name="client"
              value={formData.client}
              onChange={handleFormChange}
              required
            >
              <option value="">-- Sélectionner un client --</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.prenom} {client.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="facture-form__group">
            <label htmlFor="date_echeance">Date d'échéance *</label>
            <input
              type="date"
              id="date_echeance"
              name="date_echeance"
              value={formData.date_echeance}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className="facture-form__group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              placeholder="Notes ou conditions particulières..."
              rows="4"
            />
          </div>
        </div>

        {/* Section Lignes */}
        <div className="facture-form__section">
          <h3>Lignes de facturation</h3>

          <div className="facture-form__ligne-new">
            <div className="facture-form__ligne-group">
              <label>Type</label>
              <select
                name="type"
                value={nouvelleLigne.type}
                onChange={handleNouvelleLigneChange}
              >
                <option value="piece">Pièce</option>
                <option value="service">Service</option>
              </select>
            </div>

            {nouvelleLigne.type === 'piece' ? (
              <div className="facture-form__ligne-group">
                <label>Pièce</label>
                <select
                  name="piece"
                  value={nouvelleLigne.piece}
                  onChange={handlePieceSelect}
                >
                  <option value="">-- Sélectionner --</option>
                  {pieces.map((piece) => (
                    <option key={piece.id} value={piece.id}>
                      {piece.nom} - {piece.reference} ({piece.stock_disponible} dispo)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="facture-form__ligne-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={nouvelleLigne.description}
                  onChange={handleNouvelleLigneChange}
                  placeholder="Décrivez le service..."
                />
              </div>
            )}

            <div className="facture-form__ligne-group">
              <label>Quantité</label>
              <input
                type="number"
                name="quantite"
                value={nouvelleLigne.quantite}
                onChange={handleNouvelleLigneChange}
                min="1"
                step="0.01"
              />
            </div>

            <div className="facture-form__ligne-group">
              <label>Prix unitaire (€)</label>
              <input
                type="number"
                name="prix_unitaire"
                value={nouvelleLigne.prix_unitaire}
                onChange={handleNouvelleLigneChange}
                min="0"
                step="0.01"
              />
            </div>

            <button
              type="button"
              className="facture-form__btn-add-ligne"
              onClick={ajouterLigne}
            >
              + Ajouter
            </button>
          </div>

          {lignes.length > 0 && (
            <table className="facture-form__lignes-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>Montant</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne) => (
                  <tr key={ligne.id}>
                    <td>{ligne.description}</td>
                    <td>{ligne.quantite}</td>
                    <td>{formatMontant(ligne.prix_unitaire)}</td>
                    <td>
                      {formatMontant(ligne.quantite * ligne.prix_unitaire)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="facture-form__btn-delete-ligne"
                        onClick={() => supprimerLigne(ligne.id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Section Totaux */}
        <div className="facture-form__totaux">
          <div className="facture-form__total-row">
            <span>Total HT</span>
            <strong>{formatMontant(montantHT)}</strong>
          </div>
          <div className="facture-form__total-row">
            <span>TVA ({tva}%)</span>
            <strong>{formatMontant(montantTVA)}</strong>
          </div>
          <div className="facture-form__total-row facture-form__total-ttc">
            <span>Total TTC</span>
            <strong>{formatMontant(montantTTC)}</strong>
          </div>
        </div>

        {/* Boutons */}
        <div className="facture-form__actions">
          <button
            type="button"
            className="facture-form__btn-cancel"
            onClick={onCancel}
            disabled={submitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="facture-form__btn-save"
            disabled={submitting}
          >
            {submitting ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FactureForm;
