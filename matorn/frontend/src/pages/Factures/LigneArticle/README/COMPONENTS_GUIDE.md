# Guide des Composants Partagés — Gestion Garage

## 📋 Fichiers créés

### 1. **LigneArticleForm.jsx** + **LigneArticleForm.css**
Formulaire pour ajouter/modifier une ligne dans un devis ou une facture.

#### Utilisation
```jsx
import LigneArticleForm from './LigneArticleForm';
import { fetchPieces } from '../../services/api';

function DevisForm() {
  const [pieces, setPieces] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les pièces au montage
  useEffect(() => {
    setLoading(true);
    fetchPieces()
      .then(setPieces)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAjouterLigne = (ligneData) => {
    setLignes([...lignes, ligneData]);
  };

  return (
    <div>
      <LigneArticleForm
        onAjouter={handleAjouterLigne}
        pieces={pieces}
        loading={loading}
      />
      {/* ... */}
    </div>
  );
}
```

#### Props
- `onAjouter(ligneData)` : Callback déclenché quand l'utilisateur clique sur "Ajouter"
- `pieces` : Tableau de pièces avec `{ id, reference, nom, prix_vente, stock_disponible, ... }`
- `loading` : Booléen indiquant si les pièces sont en chargement

#### Fonctionnalités
- Toggle "🔧 Pièce" / "🛠️ Service"
- Si Pièce : Select filtré (stock_disponible > 0), pré-remplissage auto de description et prix
- Si Service : Input texte libre pour description
- Champ quantité et prix unitaire
- Calcul du sous-total en temps réel
- Reset du formulaire après ajout

---

### 2. **LigneArticleList.jsx** + **LigneArticleList.css**
Tableau d'affichage des lignes avec suppression optionnelle.

#### Utilisation
```jsx
import LigneArticleList from './LigneArticleList';

function DevisForm() {
  const [lignes, setLignes] = useState([]);

  const handleDeleteLigne = (ligneId) => {
    setLignes(lignes.filter(l => (l.id || l) !== ligneId));
  };

  return (
    <LigneArticleList
      lignes={lignes}
      onDelete={handleDeleteLigne}
      readOnly={false}
    />
  );
}
```

#### Props
- `lignes` : Tableau des lignes à afficher
- `onDelete(ligneId)` : Callback déclenché au clic sur le bouton supprimer
- `readOnly` : Booléen — si true, cache le bouton supprimer (utile pour les factures validées)

#### Fonctionnalités
- Tableau avec colonnes : Description | Type | Quantité | Prix unit. | Sous-total | Actions
- Badge "🔧 Pièce" ou "🛠️ Service"
- Bouton 🗑️ pour supprimer (optionnel)
- Alternance des couleurs de fond des lignes
- Ligne de total HT en bas
- Responsive (scroll horizontal sur mobile)

---

### 3. **pdfExport.js**
Utilitaire pour générer et télécharger des PDFs pour devis/factures.

#### Utilisation
```jsx
import { genererPDF } from '../../utils/pdfExport';

function DevisForm() {
  const [devis, setDevis] = useState({...});

  const handleExporterPDF = () => {
    genererPDF(devis, 'devis');
    // Génère un fichier "N°123.pdf" et le télécharge
  };

  return (
    <button onClick={handleExporterPDF}>
      📄 Exporter en PDF
    </button>
  );
}
```

#### Paramètres
- `document` : Objet devis/facture complet
- `type` : `'devis'` ou `'facture'`

#### Champs attendus dans l'objet
```javascript
{
  // Identifiant et dates
  numero: "DV-2024-001",
  date_creation: "2024-03-30T10:00:00Z",
  date_validite: "2024-04-30T23:59:59Z",  // devis uniquement
  date_emission: "2024-03-30T10:00:00Z",  // facture uniquement
  date_echeance: "2024-04-30T23:59:59Z",  // facture uniquement

  // Client
  client_nom: "Dupont",
  client_prenom: "Jean",
  client_adresse: "123 Rue de la Paix, 75000 Paris",
  client_telephone: "01 23 45 67 89",

  // Véhicule (optionnel)
  vehicule_info: {
    marque: "Toyota",
    modele: "Yaris",
    immatriculation: "AB-123-CD"
  },

  // Lignes
  lignes_devis: [
    { description: "Révision moteur", quantite: 1, prix_unitaire: 150.00 },
    { description: "Courroie de distribution", quantite: 1, prix_unitaire: 200.00 }
  ],
  // ou lignes_facture pour factures

  // Montants
  montant_ht: 350.00,
  tva: 70.00,
  montant_ttc: 420.00,
  montant_paye: 200.00,      // facture uniquement
  solde_restant: 220.00,      // facture uniquement

  // Notes
  notes: "Paiement par chèque accepté"
}
```

#### Format du PDF
- En-tête avec titre (DEVIS/FACTURE) et numéro
- Bloc dates
- Section client avec infos de contact
- Section véhicule (si présent)
- Tableau des lignes avec colonnes : Description | Qté | Prix unit. | Montant
- Totaux : HT, TVA, TTC
- Infos de paiement (facture)
- Notes
- Footer avec nom entreprise

---

## 🎨 Styles et Thème

### Variables CSS utilisées
```css
--accent     /* Couleur primaire (bleu par défaut) */
--text       /* Texte principal */
--panel      /* Fond des panels */
--bg         /* Arrière-plan */
--border     /* Couleurs des bordures */
```

### Formatage des montants
Tous les composants utilisent :
```javascript
new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR'
}).format(montant)
```

---

## 📦 Intégration dans Devis/Facture

### Structure recommandée
```jsx
import React, { useState, useEffect } from 'react';
import LigneArticleForm from './LigneArticleForm';
import LigneArticleList from './LigneArticleList';
import { genererPDF } from '../utils/pdfExport';
import { fetchPieces } from '../services/api';

function DevisForm() {
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lignes, setLignes] = useState([]);
  const [formData, setFormData] = useState({
    // Client
    client_nom: '',
    client_prenom: '',
    client_adresse: '',
    client_telephone: '',
    // Dates
    date_creation: new Date().toISOString(),
    date_validite: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
    // Véhicule
    vehicule_info: null,
    // Notes
    notes: '',
  });

  // Charger les pièces
  useEffect(() => {
    setLoading(true);
    fetchPieces()
      .then(setPieces)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Calculer les montants
  const montant_ht = lignes.reduce((sum, l) => sum + (l.prix_unitaire * l.quantite), 0);
  const tva = montant_ht * 0.2;
  const montant_ttc = montant_ht + tva;

  const handleAjouterLigne = (ligneData) => {
    setLignes([...lignes, ligneData]);
  };

  const handleDeleteLigne = (ligneId) => {
    setLignes(lignes.filter(l => (l.id || l) !== ligneId));
  };

  const handleExporterPDF = () => {
    const devisComplet = {
      ...formData,
      numero: 'DV-2024-001', // À générer côté backend
      lignes_devis: lignes,
      montant_ht,
      tva,
      montant_ttc,
    };
    genererPDF(devisComplet, 'devis');
  };

  return (
    <div className="devis-form">
      {/* Formulaire client et véhicule */}
      {/* ... */}

      {/* Ajouter une ligne */}
      <LigneArticleForm
        onAjouter={handleAjouterLigne}
        pieces={pieces}
        loading={loading}
      />

      {/* Liste des lignes */}
      <LigneArticleList
        lignes={lignes}
        onDelete={handleDeleteLigne}
        readOnly={false}
      />

      {/* Boutons d'action */}
      <button onClick={handleExporterPDF}>📄 Exporter PDF</button>
      <button onClick={handleSauvegarder}>💾 Sauvegarder</button>
    </div>
  );
}
```

---

## ✅ Checklist d'intégration

- [ ] Importer les composants dans vos formulaires Devis/Facture
- [ ] Charger les pièces via `fetchPieces()` au montage
- [ ] Gérer l'état des lignes avec `useState`
- [ ] Calculer les totaux dynamiquement
- [ ] Tester la sélection de pièces et le pré-remplissage
- [ ] Tester la suppression de lignes
- [ ] Tester l'export PDF
- [ ] Adapter les styles avec vos variables CSS (--accent, etc.)
- [ ] Tester la responsivité sur mobile

---

## 🐛 Troubleshooting

### Les pièces ne s'affichent pas
Vérifier que `fetchPieces()` retourne un tableau valide avec les champs `stock_disponible` et `prix_vente`.

### Le PDF n'a pas le bon format
Vérifier que l'objet `document` contient tous les champs attendus (voir section "Champs attendus").

### Styles non appliqués
Vérifier que les fichiers CSS sont importés dans les composants JSX et que les variables CSS sont définies dans votre feuille de style globale.
