# Configuration du système de gestion des devis

## Fichiers créés

Tous les fichiers ont été créés dans `/src/components/Devis/` :

### Composants React
1. **DevisManager.jsx** - Conteneur principal, gère les transitions entre vues
2. **DevisList.jsx** - Liste des devis avec filtres et actions rapides
3. **DevisForm.jsx** - Formulaire de création/modification
4. **DevisDetail.jsx** - Affichage détaillé d'un devis
5. **DevisDocument.jsx** - Aperçu PDF imprimable/exportable

### Styles CSS
6. **DevisList.css** - Styles de la liste
7. **DevisForm.css** - Styles du formulaire
8. **DevisDetail.css** - Styles du détail
9. **DevisDocument.css** - Styles du document PDF

### Configuration
10. **index.js** - Exports centralisés pour les imports faciles
11. **DEVIS_README.md** - Documentation complète du système
12. **DEVIS_SETUP.md** - Ce fichier

## Installation des dépendances

### jsPDF (obligatoire pour export PDF)

```bash
npm install jspdf jspdf-autotable
```

Ou avec yarn :
```bash
yarn add jspdf jspdf-autotable
```

**Vérification de l'installation:**
```bash
npm list jspdf jspdf-autotable
```

## Intégration dans l'application

### Méthode 1 : Utiliser DevisManager (recommandée)

Dans votre App.js ou votre fichier de routing :

```jsx
import { DevisManager } from './components/Devis';

function App() {
  return (
    <div className="app">
      <Header />
      <Sidebar />
      <main>
        <DevisManager />
      </main>
    </div>
  );
}

export default App;
```

### Méthode 2 : Intégrer dans un routing existant

```jsx
import { DevisList, DevisDetail, DevisForm } from './components/Devis';
import { useState } from 'react';

function DevisPage() {
  const [view, setView] = useState('list');
  const [selectedDevisId, setSelectedDevisId] = useState(null);

  return (
    <>
      {view === 'list' && (
        <DevisList
          onSelectDevis={(devis) => {
            setSelectedDevisId(devis.id);
            setView('detail');
          }}
          onCreateDevis={() => setView('form')}
        />
      )}
      {view === 'detail' && selectedDevisId && (
        <DevisDetail
          devisId={selectedDevisId}
          onBack={() => setView('list')}
          onFactureCreee={() => setView('list')}
        />
      )}
      {view === 'form' && (
        <DevisForm
          devisId={null}
          onSave={() => setView('list')}
          onCancel={() => setView('list')}
        />
      )}
    </>
  );
}

export default DevisPage;
```

## Services API supposés

Le système utilise ces services (supposés exister) :

### `src/services/devisService.js`

Toutes les fonctions suivantes doivent être disponibles :

```javascript
export const fetchDevis(filtres = {}) → Promise<Array>
export const fetchDevisById(id) → Promise<Object>
export const createDevis(data) → Promise<Object>
export const updateDevis(id, data) → Promise<Object>
export const deleteDevis(id) → Promise<void>
export const validerDevis(id) → Promise<Object>
export const refuserDevis(id) → Promise<Object>
export const creerFactureDepuisDevis(devisId, dateEcheance, notes) → Promise<Object>
export const addLigneDevis(devisId, ligneData) → Promise<Object>
export const updateLigneDevis(ligneId, ligneData) → Promise<Object>
export const deleteLigneDevis(ligneId) → Promise<void>
```

### `src/services/api.js`

Les fonctions suivantes doivent être disponibles :

```javascript
export const fetchClients() → Promise<Array<Client>>
export const fetchInterventions() → Promise<Array<Intervention>>
export const fetchPieces() → Promise<Array<Piece>>
```

## Composants partagés supposés

Le système utilise ces composants partagés (supposés exister) :

- `src/components/shared/LoadingState.jsx` - État de chargement
- `src/components/shared/ErrorState.jsx` - État d'erreur
- `src/components/shared/Modal.jsx` - Modale réutilisable

## Structure des données

### Objet Devis (retourné par l'API)

```typescript
{
  id: number,
  numero: string,                          // Ex: "DEV-26-00001"
  client: number,                          // ID client
  client_nom: string,
  client_prenom: string,
  client_telephone: string,
  client_email: string,
  client_adresse: string,
  intervention: number | null,             // ID intervention (optionnel)
  intervention_date: string,               // ISO format
  intervention_description: string,
  vehicule_info: {
    id: number,
    marque: string,
    modele: string,
    immatriculation: string
  } | null,
  date_creation: string,                   // ISO format
  date_validite: string,                   // ISO format
  montant_ht: string,                      // Format décimal string
  tva: string,                             // Format décimal string
  montant_ttc: string,                     // Format décimal string
  statut: 'CREE' | 'VALIDE' | 'REFUSE' | 'EXPIRE' | 'FACTURE',
  statut_display: string,
  notes: string,
  lignes_devis: Array<{
    id: number,
    devis: number,
    piece: number | null,
    piece_nom: string | null,
    description: string,
    quantite: number,
    prix_unitaire: string,
    sous_total: number
  }>
}
```

### Objet Client

```typescript
{
  id: number,
  nom: string,
  prenom: string,
  telephone: string,
  email: string,
  adresse: string
}
```

### Objet Pièce

```typescript
{
  id: number,
  reference: string,
  nom: string,
  prix_vente: string,
  stock_actuel: number,
  stock_suspendu: number,
  stock_disponible: number,
  stock_status: string
}
```

### Objet Intervention

```typescript
{
  id: number,
  client: number,
  vehicule: number,
  date_debut: string,
  date_fin: string,
  description: string,
  statut: string,
  departement: string
}
```

## Fonctionnalités principales implémentées

### DevisList
- ✅ Affichage tableau des devis
- ✅ Filtre par statut
- ✅ Bouton actualiser
- ✅ Actions rapides (voir, valider, refuser)
- ✅ Badges de statut colorés
- ✅ Formatage montants et dates français
- ✅ État vide si aucun devis

### DevisForm
- ✅ Création d'un nouveau devis
- ✅ Modification d'un devis existant
- ✅ Sélection client (obligatoire)
- ✅ Sélection intervention (optionnel)
- ✅ Date validité (par défaut +30 jours)
- ✅ Notes libres
- ✅ Gestion des lignes :
  - ✅ Type : Service ou Pièce
  - ✅ Sélection pièce avec prix_vente automatique
  - ✅ Description, quantité, prix unitaire
  - ✅ Calcul sous-total en direct
  - ✅ Suppression de lignes
- ✅ Calcul totaux en direct (HT, TVA 20%, TTC)
- ✅ Boutons Sauvegarder/Annuler

### DevisDetail
- ✅ Affichage complet du devis
- ✅ Informations client
- ✅ Informations véhicule (si présent)
- ✅ Informations intervention (si présente)
- ✅ Tableau des lignes
- ✅ Totaux (HT, TVA, TTC)
- ✅ Aperçu PDF intégré
- ✅ Actions selon statut :
  - ✅ CREE : Valider, Refuser
  - ✅ VALIDE : Créer facture, Refuser
  - ✅ REFUSE/EXPIRE/FACTURE : Lecture seule
- ✅ Modal création facture (date échéance + notes)
- ✅ Confirmations pour actions destructives

### DevisDocument
- ✅ Affichage formaté pour impression
- ✅ Bouton Imprimer (window.print)
- ✅ Bouton Télécharger PDF (jsPDF)
- ✅ Styles @media print optimisés
- ✅ Export PDF avec jsPDF-autotable

## Utilisation des hooks React

Tous les composants utilisent les hooks modernes :
- `useState` - Gestion d'état
- `useEffect` - Effets secondaires et chargement des données
- `useCallback` - Optimisation des fonctions de rappel

## Gestion des erreurs

- Try/catch sur tous les appels API
- Affichage des erreurs via `ErrorState`
- Confirmations `window.confirm()` pour actions destructives
- Messages d'alerte `alert()` pour erreurs

## Formatage français

- Montants : `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`
- Dates : `toLocaleDateString('fr-FR')`

## Points importants

1. **jsPDF doit être installé** pour que l'export PDF fonctionne
2. **Les montants dans l'API sont des strings** → utiliser `parseFloat()`
3. **TVA fixée à 20%** dans tous les calculs
4. **Les devis se créent d'abord, puis les lignes sont ajoutées** (workflow 2 étapes)
5. **Les confirmations utilisent `window.confirm()`**
6. **Les dates sont en format ISO de l'API** → converties en français au affichage

## Tests recommandés

1. Créer un nouveau devis
2. Ajouter des lignes (services et pièces)
3. Valider le devis
4. Refuser le devis
5. Créer une facture depuis un devis validé
6. Vérifier l'aperçu PDF
7. Télécharger le PDF
8. Tester l'impression

## Support

Pour plus d'informations, consultez `DEVIS_README.md` dans le même répertoire.
