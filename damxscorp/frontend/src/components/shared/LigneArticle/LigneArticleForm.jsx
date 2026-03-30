import React, { useState } from 'react';
import './LigneArticleForm.css';

/**
 * 📝 LigneArticleForm — Formulaire pour ajouter/modifier une ligne dans un devis ou une facture
 *
 * Props :
 *   onAjouter(ligneData) : callback appelé quand l'utilisateur clique sur "Ajouter"
 *   pieces             : tableau de pièces disponibles (avec stock_disponible, etc.)
 *   loading            : booléen indiquant si les pièces sont en cours de chargement
 *
 * Rendu :
 *   - Toggle "Type" : "🔧 Pièce" | "🛠️ Service"
 *   - Si Pièce : Select des pièces + affichage stock
 *   - Si Service : Input description libre
 *   - Champ quantité, prix unitaire
 *   - Sous-total calculé en live
 *   - Bouton "Ajouter"
 */

const LigneArticleForm = ({ onAjouter, pieces = [], loading = false }) => {
  const [type, setType] = useState('piece'); // 'piece' ou 'service'
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [description, setDescription] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [prixUnitaire, setPrixUnitaire] = useState('');

  // Filtrer les pièces avec stock disponible > 0
  const piecesDisponibles = pieces.filter(p => (p.stock_disponible || 0) > 0);

  // Quand on sélectionne une pièce, pré-remplir description et prix
  const handleSelectPiece = (e) => {
    const pieceId = parseInt(e.target.value, 10);
    const piece = pieces.find(p => p.id === pieceId);

    if (piece) {
      setSelectedPiece(piece);
      setDescription(piece.nom || '');
      setPrixUnitaire(piece.prix_vente?.toString() || '');
    }
  };

  // Calculer le sous-total
  const sousTotal = (quantite || 0) * (parseFloat(prixUnitaire) || 0);

  // Formater un montant en EUR
  const formaterMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(montant);
  };

  // Ajouter la ligne
  const handleAjouter = () => {
    // Validations
    if (!description.trim()) {
      alert('Veuillez entrer une description');
      return;
    }
    if (!quantite || quantite < 1) {
      alert('Veuillez entrer une quantité valide');
      return;
    }
    if (!prixUnitaire || parseFloat(prixUnitaire) < 0) {
      alert('Veuillez entrer un prix valide');
      return;
    }

    // Créer l'objet ligne
    const ligneData = {
      id: Math.random().toString(36).substr(2, 9), // ID temporaire
      type,
      piece_id: selectedPiece?.id || null,
      description: description.trim(),
      quantite: parseInt(quantite, 10),
      prix_unitaire: parseFloat(prixUnitaire),
      sous_total: sousTotal,
    };

    // Appeler le callback
    onAjouter(ligneData);

    // Réinitialiser le formulaire
    setType('piece');
    setSelectedPiece(null);
    setDescription('');
    setQuantite(1);
    setPrixUnitaire('');
  };

  return (
    <div className="ligne-article-form">
      {/* ── EN-TÊTE ─────────────────────────────────────────── */}
      <h3 className="ligne-article-form__title">Ajouter une ligne</h3>

      {/* ── TYPE (Pièce ou Service) ───────────────────────── */}
      <div className="ligne-article-form__type-toggle">
        <button
          type="button"
          className={`ligne-article-form__type-btn ${type === 'piece' ? 'active' : ''}`}
          onClick={() => {
            setType('piece');
            setSelectedPiece(null);
            setDescription('');
            setPrixUnitaire('');
          }}
        >
          🔧 Pièce
        </button>
        <button
          type="button"
          className={`ligne-article-form__type-btn ${type === 'service' ? 'active' : ''}`}
          onClick={() => {
            setType('service');
            setSelectedPiece(null);
            setDescription('');
            setPrixUnitaire('');
          }}
        >
          🛠️ Service
        </button>
      </div>

      {/* ── DESCRIPTION / SÉLECTION PIÈCE ──────────────────── */}
      <div className="ligne-article-form__grid">
        {type === 'piece' ? (
          <div className="ligne-article-form__field">
            <label htmlFor="select-piece">Pièce *</label>
            {loading ? (
              <p className="ligne-article-form__loading">Chargement des pièces...</p>
            ) : piecesDisponibles.length > 0 ? (
              <>
                <select
                  id="select-piece"
                  value={selectedPiece?.id || ''}
                  onChange={handleSelectPiece}
                  disabled={loading}
                >
                  <option value="">— Sélectionner une pièce —</option>
                  {piecesDisponibles.map((piece) => (
                    <option key={piece.id} value={piece.id}>
                      {piece.reference} — {piece.nom}
                    </option>
                  ))}
                </select>
                {selectedPiece && (
                  <div className="ligne-article-form__stock-info">
                    Stock disponible : <strong>{selectedPiece.stock_disponible}</strong>
                  </div>
                )}
              </>
            ) : (
              <p className="ligne-article-form__error">
                Aucune pièce disponible en stock
              </p>
            )}
          </div>
        ) : (
          <div className="ligne-article-form__field">
            <label htmlFor="input-description">Description *</label>
            <input
              id="input-description"
              type="text"
              placeholder="Ex: Révision moteur, Changement de plaquettes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* ── QUANTITÉ ET PRIX ────────────────────────────────── */}
      <div className="ligne-article-form__grid ligne-article-form__grid--2cols">
        <div className="ligne-article-form__field">
          <label htmlFor="input-quantite">Quantité *</label>
          <input
            id="input-quantite"
            type="number"
            min="1"
            step="1"
            value={quantite}
            onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
        </div>

        <div className="ligne-article-form__field">
          <label htmlFor="input-prix">Prix unitaire (€) *</label>
          <input
            id="input-prix"
            type="number"
            step="0.01"
            min="0"
            value={prixUnitaire}
            onChange={(e) => setPrixUnitaire(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* ── SOUS-TOTAL ──────────────────────────────────────── */}
      <div className="ligne-article-form__subtotal">
        <span>Sous-total :</span>
        <strong>{formaterMontant(sousTotal)}</strong>
      </div>

      {/* ── BOUTON AJOUTER ──────────────────────────────────── */}
      <button
        type="button"
        className="ligne-article-form__btn-add"
        onClick={handleAjouter}
      >
        ➕ Ajouter
      </button>
    </div>
  );
};

export default LigneArticleForm;
