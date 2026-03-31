# Système de gestion des devis

Ensemble complet de composants React pour gérer les devis (création, modification, validation, conversion en facture).

## Composants disponibles

### 1. DevisManager (conteneur principal)
Gère les transitions entre les différentes vues.

```jsx
import { DevisManager } from './components/Devis';

export default function App() {
  return <DevisManager />;
}
```

### 2. DevisList (liste des devis)
Affiche un tableau des devis avec filtres et actions rapides.

**Props:**
- `onSelectDevis(devis)` - Callback quand un devis est sélectionné
- `onCreateDevis()` - Callback au clic sur "+ Nouveau devis"

**Fonctionnalités:**
- Filtre par statut (CREE, VALIDE, REFUSE, EXPIRE, FACTURE)
- Actions rapides : voir, valider, refuser
- Actualisation manuelle
- Formatage des montants et dates en français

### 3. DevisForm (formulaire)
Création ou modification d'un devis avec gestion des lignes.

**Props:**
- `devisId` (optional, null = nouveau devis) - ID du devis à éditer
- `onSave(devis)` - Callback après sauvegarde
- `onCancel()` - Callback annulation

**Fonctionnalités:**
- Sélection du client (obligatoire)
- Sélection optionnelle de l'intervention
- Date de validité (par défaut +30 jours)
- Notes
- Gestion des lignes :
  - Type : Service ou Pièce
  - Si Pièce : sélection automatique du prix_vente
  - Description, quantité, prix unitaire
  - Calcul automatique des sous-totaux
- Calcul en direct : HT, TVA (20%), TTC
- Création du devis en premier, puis ajout des lignes via addLigneDevis

### 4. DevisDetail (détail du devis)
Affichage complet d'un devis avec toutes les informations et actions.

**Props:**
- `devisId` (required) - ID du devis à afficher
- `onBack()` - Callback retour à la liste
- `onFactureCreee(facture)` - Callback après création de facture

**Affichage:**
- Informations client
- Informations véhicule (si présent)
- Intervention (si présente)
- Tableau des lignes
- Totaux (HT, TVA, TTC)
- Aperçu PDF imprimable

**Actions selon statut:**
- CREE : Valider, Refuser, (Aperçu PDF)
- VALIDE : Créer facture, Refuser, (Aperçu PDF)
- REFUSE/EXPIRE/FACTURE : Lecture seule

### 5. DevisDocument (aperçu PDF)
Affichage imprimable/exportable du devis.

**Props:**
- `devis` (required) - Objet devis complet

**Fonctionnalités:**
- Aperçu formaté pour impression
- Bouton Imprimer (window.print)
- Bouton Télécharger PDF (jsPDF)
- Styles optimisés pour @media print

## Architecture et flux

```
DevisManager
├── DevisList (vue par défaut)
│   ├── Affiche tableau des devis
│   ├── Appelle onSelectDevis(devis) → affiche DevisDetail
│   └── Appelle onCreateDevis() → affiche DevisForm
│
├── DevisForm (création/édition)
│   └── Appelle onSave() → retour à DevisList
│
└── DevisDetail (consultation)
    ├── Appelle onBack() → retour à DevisList
    ├── Actions : Valider / Refuser
    ├── Modal : Créer facture
    └── Modal : Aperçu PDF (DevisDocument)
```

## Services API utilisés

Tous depuis `src/services/`:

**devisService.js:**
- `fetchDevis(filtres)` - Liste des devis
- `fetchDevisById(id)` - Détail d'un devis
- `createDevis(data)` - Créer devis
- `updateDevis(id, data)` - Modifier devis
- `deleteDevis(id)` - Supprimer devis
- `validerDevis(id)` - Valider (statut CREE → VALIDE)
- `refuserDevis(id)` - Refuser (libère le stock)
- `creerFactureDepuisDevis(devisId, dateEcheance, notes)` - Convertir en facture
- `addLigneDevis(devisId, ligneData)` - Ajouter ligne
- `updateLigneDevis(ligneId, ligneData)` - Modifier ligne
- `deleteLigneDevis(ligneId)` - Supprimer ligne

**api.js:**
- `fetchClients()` - Liste des clients
- `fetchInterventions()` - Liste des interventions
- `fetchPieces()` - Liste des pièces

## Modèle Devis (API)

```json
{
  "id": 1,
  "numero": "DEV-26-00001",
  "client": 5,
  "client_nom": "Dupont",
  "client_prenom": "Jean",
  "client_telephone": "0600000000",
  "client_email": "jean@example.com",
  "client_adresse": "1 rue de la Paix",
  "intervention": 3,
  "intervention_date": "2026-03-30T10:00:00",
  "intervention_description": "Vidange + filtres",
  "vehicule_info": {
    "id": 2,
    "marque": "Renault",
    "modele": "Clio",
    "immatriculation": "AB-123-CD"
  },
  "date_creation": "2026-03-30",
  "date_validite": "2026-04-30",
  "montant_ht": "150.00",
  "tva": "30.00",
  "montant_ttc": "180.00",
  "statut": "CREE",
  "statut_display": "Créé",
  "notes": "",
  "lignes_devis": [
    {
      "id": 1,
      "devis": 1,
      "piece": 3,
      "piece_nom": "Filtre à huile",
      "description": "Filtre à huile",
      "quantite": 1,
      "prix_unitaire": "12.50",
      "sous_total": 12.5
    }
  ]
}
```

## Statuts devis

| Statut | Description | Actions disponibles |
|--------|-------------|---------------------|
| CREE | Devis créé | Valider, Refuser, Aperçu PDF |
| VALIDE | Devis accepté | Créer facture, Refuser, Aperçu PDF |
| REFUSE | Devis refusé (terminal) | Aucune |
| EXPIRE | Devis expiré (terminal) | Aucune |
| FACTURE | Converti en facture (terminal) | Aucune |

## Installation des dépendances

**jsPDF (pour export PDF dans DevisDocument):**
```bash
npm install jspdf jspdf-autotable
```

## Intégration dans l'app

### Option 1 : Utiliser DevisManager (recommandé)

```jsx
// Dans App.js ou routing
import { DevisManager } from './components/Devis';

function App() {
  return (
    <>
      <Header />
      <Sidebar />
      <DevisManager />
    </>
  );
}
```

### Option 2 : Utiliser les composants individuellement

```jsx
import { DevisList, DevisForm, DevisDetail } from './components/Devis';
import { useState } from 'react';

function DevisPage() {
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      {view === 'list' && (
        <DevisList
          onSelectDevis={(d) => { setSelectedId(d.id); setView('detail'); }}
          onCreateDevis={() => setView('form')}
        />
      )}
      {view === 'form' && (
        <DevisForm
          devisId={null}
          onSave={() => setView('list')}
          onCancel={() => setView('list')}
        />
      )}
      {view === 'detail' && (
        <DevisDetail
          devisId={selectedId}
          onBack={() => setView('list')}
          onFactureCreee={() => setView('list')}
        />
      )}
    </>
  );
}
```

## Fonctionnalités principales

- ✅ Création de devis avec client, intervention, dates
- ✅ Gestion des lignes (services + pièces)
- ✅ Calcul automatique des totaux (HT, TVA 20%, TTC)
- ✅ Validation / Refus de devis
- ✅ Conversion en facture
- ✅ Aperçu PDF imprimable
- ✅ Export PDF téléchargeable
- ✅ Filtres par statut
- ✅ Confirmations pour actions destructives
- ✅ Formatage français (montants, dates)
- ✅ Responsive design

## Styles

Tous les styles sont dans les fichiers `.css` dédiés :
- `DevisList.css`
- `DevisForm.css`
- `DevisDetail.css`
- `DevisDocument.css`

**Couleurs de statut:**
- CREE : Bleu (#3498db)
- VALIDE : Vert (#27ae60)
- REFUSE : Rouge (#e74c3c)
- EXPIRE : Gris (#95a5a6)
- FACTURE : Violet (#9b59b6)

## Notes de développement

- Les montants dans l'API sont des strings → utiliser `parseFloat()` pour les calculs
- Les dates au format ISO → formater avec `toLocaleDateString('fr-FR')`
- TVA fixée à 20% dans les calculs
- Les confirmations utilisent `window.confirm()`
- Gestion d'erreur via `try/catch` et affichage d'alertes
- Chargement et erreurs gérés via `LoadingState` et `ErrorState`
