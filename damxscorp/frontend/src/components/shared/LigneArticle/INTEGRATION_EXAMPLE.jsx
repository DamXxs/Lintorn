/**
 * 📝 INTEGRATION_EXAMPLE.jsx
 *
 * Exemple complet d'intégration des composants partagés LigneArticle
 * dans un formulaire de Devis.
 *
 * Ce fichier montre :
 *   - Comment charger les pièces
 *   - Comment gérer les lignes
 *   - Comment calculer les totaux
 *   - Comment utiliser LigneArticleForm et LigneArticleList
 *   - Comment générer un PDF
 *
 * À adapter selon votre structure de formulaire existante.
 */

import React, { useState, useEffect } from 'react';
import LigneArticleForm from './LigneArticleForm';
import LigneArticleList from './LigneArticleList';
import { genererPDF } from '../../utils/pdfExport';
import { fetchPieces } from '../../services/api';
// import './DevisForm.css'; // Votre CSS du formulaire

/**
 * Composant exemple — Formulaire de création de devis
 *
 * Utilise :
 *   - LigneArticleForm pour ajouter des lignes
 *   - LigneArticleList pour les afficher
 *   - genererPDF pour exporter en PDF
 */
function DevisFormExample() {
  // ── État global du formulaire
  const [formData, setFormData] = useState({
    // Client
    client_nom: '',
    client_prenom: '',
    client_adresse: '',
    client_telephone: '',
    // Dates
    date_creation: new Date().toISOString().split('T')[0],
    date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    // Véhicule
    vehicule_marque: '',
    vehicule_modele: '',
    vehicule_immatriculation: '',
    // Notes
    notes: '',
  });

  // ── État des lignes
  const [lignes, setLignes] = useState([]);

  // ── État des pièces
  const [pieces, setPieces] = useState([]);
  const [loadingPieces, setLoadingPieces] = useState(false);

  // ── État du formulaire
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // ── Charger les pièces au montage
  useEffect(() => {
    const chargerPieces = async () => {
      try {
        setLoadingPieces(true);
        const data = await fetchPieces();
        setPieces(data);
      } catch (err) {
        setError('Erreur lors du chargement des pièces : ' + err.message);
      } finally {
        setLoadingPieces(false);
      }
    };

    chargerPieces();
  }, []);

  // ── Calculer les montants
  const montant_ht = lignes.reduce((sum, ligne) => {
    return sum + ligne.prix_unitaire * ligne.quantite;
  }, 0);

  const tva = montant_ht * 0.2;
  const montant_ttc = montant_ht + tva;

  // ── Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAjouterLigne = (ligneData) => {
    // Ajouter un ID unique si absent
    const newLigne = {
      ...ligneData,
      id: ligneData.id || `ligne-${Date.now()}`,
    };
    setLignes([...lignes, newLigne]);
    setSuccess('Ligne ajoutée');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleDeleteLigne = (ligneId) => {
    setLignes(lignes.filter((l) => l.id !== ligneId));
    setSuccess('Ligne supprimée');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleExporterPDF = () => {
    // Valider qu'il y a au moins une ligne
    if (lignes.length === 0) {
      setError('Veuillez ajouter au moins une ligne');
      return;
    }

    // Construire l'objet devis complet
    const devisComplet = {
      numero: 'DV-2024-001', // À générer côté backend
      date_creation: new Date(formData.date_creation).toISOString(),
      date_validite: new Date(formData.date_validite).toISOString(),
      client_nom: formData.client_nom,
      client_prenom: formData.client_prenom,
      client_adresse: formData.client_adresse,
      client_telephone: formData.client_telephone,
      vehicule_info: formData.vehicule_marque
        ? {
            marque: formData.vehicule_marque,
            modele: formData.vehicule_modele,
            immatriculation: formData.vehicule_immatriculation,
          }
        : null,
      lignes_devis: lignes,
      montant_ht,
      tva,
      montant_ttc,
      notes: formData.notes,
    };

    try {
      genererPDF(devisComplet, 'devis');
      setSuccess('PDF généré et téléchargé');
    } catch (err) {
      setError('Erreur lors de la génération du PDF : ' + err.message);
    }
  };

  const handleSauvegarder = async () => {
    // Valider qu'il y a au moins une ligne
    if (lignes.length === 0) {
      setError('Veuillez ajouter au moins une ligne');
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      // Préparer les données
      const devisData = {
        client_nom: formData.client_nom,
        client_prenom: formData.client_prenom,
        client_adresse: formData.client_adresse,
        client_telephone: formData.client_telephone,
        date_creation: new Date(formData.date_creation).toISOString(),
        date_validite: new Date(formData.date_validite).toISOString(),
        vehicule_marque: formData.vehicule_marque,
        vehicule_modele: formData.vehicule_modele,
        vehicule_immatriculation: formData.vehicule_immatriculation,
        notes: formData.notes,
        lignes_devis: lignes,
        montant_ht,
        tva,
        montant_ttc,
      };

      // Appeler l'API (à adapter selon votre endpoint)
      // const response = await saveDevis(devisData);

      setSuccess('Devis sauvegardé avec succès');
      // Rediriger ou réinitialiser le formulaire
      // navigate(`/devis/${response.id}`);
    } catch (err) {
      setError('Erreur lors de la sauvegarde : ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="devis-form-example">
      <h1>Créer un Devis</h1>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* ── SECTION CLIENT ──────────────────────────────────────── */}
      <section className="form-section">
        <h2>Informations Client</h2>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="client_nom">Nom *</label>
            <input
              id="client_nom"
              type="text"
              name="client_nom"
              value={formData.client_nom}
              onChange={handleInputChange}
              placeholder="Dupont"
            />
          </div>

          <div className="form-group">
            <label htmlFor="client_prenom">Prénom</label>
            <input
              id="client_prenom"
              type="text"
              name="client_prenom"
              value={formData.client_prenom}
              onChange={handleInputChange}
              placeholder="Jean"
            />
          </div>

          <div className="form-group form-group--full">
            <label htmlFor="client_adresse">Adresse</label>
            <input
              id="client_adresse"
              type="text"
              name="client_adresse"
              value={formData.client_adresse}
              onChange={handleInputChange}
              placeholder="123 Rue de la Paix, 75000 Paris"
            />
          </div>

          <div className="form-group">
            <label htmlFor="client_telephone">Téléphone</label>
            <input
              id="client_telephone"
              type="tel"
              name="client_telephone"
              value={formData.client_telephone}
              onChange={handleInputChange}
              placeholder="01 23 45 67 89"
            />
          </div>
        </div>
      </section>

      {/* ── SECTION VÉHICULE ─────────────────────────────────────── */}
      <section className="form-section">
        <h2>Informations Véhicule</h2>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="vehicule_marque">Marque</label>
            <input
              id="vehicule_marque"
              type="text"
              name="vehicule_marque"
              value={formData.vehicule_marque}
              onChange={handleInputChange}
              placeholder="Toyota"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehicule_modele">Modèle</label>
            <input
              id="vehicule_modele"
              type="text"
              name="vehicule_modele"
              value={formData.vehicule_modele}
              onChange={handleInputChange}
              placeholder="Yaris"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehicule_immatriculation">Immatriculation</label>
            <input
              id="vehicule_immatriculation"
              type="text"
              name="vehicule_immatriculation"
              value={formData.vehicule_immatriculation}
              onChange={handleInputChange}
              placeholder="AB-123-CD"
            />
          </div>
        </div>
      </section>

      {/* ── SECTION DATES ────────────────────────────────────────── */}
      <section className="form-section">
        <h2>Dates</h2>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="date_creation">Date de création *</label>
            <input
              id="date_creation"
              type="date"
              name="date_creation"
              value={formData.date_creation}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="date_validite">Valide jusqu'au *</label>
            <input
              id="date_validite"
              type="date"
              name="date_validite"
              value={formData.date_validite}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </section>

      {/* ── SECTION LIGNES ──────────────────────────────────────── */}
      <section className="form-section">
        <h2>Articles et Services</h2>

        {/* Formulaire d'ajout */}
        <LigneArticleForm
          onAjouter={handleAjouterLigne}
          pieces={pieces}
          loading={loadingPieces}
        />

        {/* Liste des lignes */}
        {lignes.length > 0 && (
          <>
            <h3 style={{ marginTop: '30px' }}>Lignes ajoutées</h3>
            <LigneArticleList
              lignes={lignes}
              onDelete={handleDeleteLigne}
              readOnly={false}
            />
          </>
        )}
      </section>

      {/* ── SECTION NOTES ───────────────────────────────────────── */}
      <section className="form-section">
        <h2>Notes et Remarques</h2>
        <div className="form-group form-group--full">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Paiement par chèque accepté..."
            rows={4}
          />
        </div>
      </section>

      {/* ── SECTION MONTANTS ────────────────────────────────────── */}
      {lignes.length > 0 && (
        <section className="form-section form-section--summary">
          <h2>Résumé</h2>
          <div className="summary">
            <div className="summary-row">
              <span>Montant HT :</span>
              <strong>
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(montant_ht)}
              </strong>
            </div>
            <div className="summary-row">
              <span>TVA (20%) :</span>
              <strong>
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(tva)}
              </strong>
            </div>
            <div className="summary-row summary-row--total">
              <span>Total TTC :</span>
              <strong>
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(montant_ttc)}
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* ── BOUTONS D'ACTION ────────────────────────────────────── */}
      <div className="form-actions">
        <button
          type="button"
          onClick={handleExporterPDF}
          disabled={lignes.length === 0 || submitLoading}
          className="btn btn-secondary"
        >
          📄 Exporter PDF
        </button>
        <button
          type="button"
          onClick={handleSauvegarder}
          disabled={lignes.length === 0 || submitLoading}
          className="btn btn-primary"
        >
          {submitLoading ? 'Sauvegarde...' : '💾 Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

export default DevisFormExample;

/**
 * Styles CSS minimaux pour cet exemple (à adapter selon votre design) :
 *
 * .devis-form-example {
 *   max-width: 900px;
 *   margin: 0 auto;
 *   padding: 20px;
 * }
 *
 * .form-section {
 *   background: var(--panel);
 *   border: 1px solid var(--border);
 *   border-radius: 12px;
 *   padding: 20px;
 *   margin-bottom: 20px;
 * }
 *
 * .form-section h2 {
 *   margin-top: 0;
 *   margin-bottom: 16px;
 *   font-size: 18px;
 *   color: var(--text);
 * }
 *
 * .form-grid {
 *   display: grid;
 *   grid-template-columns: 1fr 1fr;
 *   gap: 16px;
 * }
 *
 * .form-group {
 *   display: flex;
 *   flex-direction: column;
 *   gap: 6px;
 * }
 *
 * .form-group--full {
 *   grid-column: 1 / -1;
 * }
 *
 * .form-group label {
 *   font-weight: 600;
 *   font-size: 13px;
 *   color: var(--text);
 * }
 *
 * .form-group input,
 * .form-group textarea {
 *   padding: 10px 12px;
 *   border: 1px solid var(--border);
 *   border-radius: 8px;
 *   font-family: inherit;
 *   font-size: 14px;
 * }
 *
 * .form-actions {
 *   display: flex;
 *   gap: 12px;
 *   justify-content: flex-end;
 *   padding-top: 20px;
 *   border-top: 2px solid var(--border);
 * }
 *
 * .btn {
 *   padding: 12px 24px;
 *   border: none;
 *   border-radius: 8px;
 *   font-weight: 700;
 *   cursor: pointer;
 *   transition: all 0.2s;
 * }
 *
 * .btn-primary {
 *   background: var(--accent);
 *   color: white;
 * }
 *
 * .btn-secondary {
 *   background: #e1e8ed;
 *   color: var(--text);
 * }
 *
 * .alert {
 *   padding: 12px 16px;
 *   border-radius: 8px;
 *   margin-bottom: 16px;
 * }
 *
 * .alert-error {
 *   background: rgba(192, 57, 43, 0.1);
 *   color: #c0392b;
 * }
 *
 * .alert-success {
 *   background: rgba(39, 174, 96, 0.1);
 *   color: #27ae60;
 * }
 *
 * .summary {
 *   display: flex;
 *   flex-direction: column;
 *   gap: 8px;
 * }
 *
 * .summary-row {
 *   display: flex;
 *   justify-content: space-between;
 *   padding: 8px 0;
 *   border-bottom: 1px solid var(--border);
 * }
 *
 * .summary-row--total {
 *   border-bottom: none;
 *   padding-top: 12px;
 *   font-size: 16px;
 * }
 *
 * @media (max-width: 768px) {
 *   .form-grid {
 *     grid-template-columns: 1fr;
 *   }
 *
 *   .form-actions {
 *     flex-direction: column;
 *   }
 *
 *   .btn {
 *     width: 100%;
 *   }
 * }
 */
