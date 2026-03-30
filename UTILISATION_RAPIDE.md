# Système de gestion des devis - Guide d'utilisation rapide

## Installation

### 1. Installer jsPDF (obligatoire pour export PDF)

```bash
cd frontend
npm install jspdf jspdf-autotable
```

### 2. Vérifier que les services existent

Assurez-vous que ces fichiers existent :
- `src/services/devisService.js` - ✓ (déjà créé)
- `src/services/api.js` - ✓ (déjà existant)
- `src/components/shared/LoadingState.jsx` - ✓ (existant)
- `src/components/shared/ErrorState.jsx` - ✓ (existant)
- `src/components/shared/Modal.jsx` - ✓ (existant)

## Intégration simple (5 minutes)

### Option 1 : Utiliser DevisManager (recommandé)

```jsx
// Dans App.js
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

C'est tout ! Vous avez un système complet de gestion des devis.

### Option 2 : Intégrer dans une route spécifique

```jsx
// Dans votre système de routing
import { DevisManager } from './components/Devis';

const routes = [
  { path: '/devis', component: DevisManager },
  // ... autres routes
];
```

## Chemin des fichiers

```
frontend/src/
├── components/
│   └── Devis/
│       ├── DevisManager.jsx      (conteneur principal)
│       ├── DevisList.jsx         (liste)
│       ├── DevisForm.jsx         (formulaire)
│       ├── DevisDetail.jsx       (détail)
│       ├── DevisDocument.jsx     (PDF)
│       ├── DevisList.css
│       ├── DevisForm.css
│       ├── DevisDetail.css
│       ├── DevisDocument.css
│       ├── index.js              (exports)
│       └── DEVIS_README.md       (documentation)
└── services/
    ├── devisService.js          (services devis)
    └── api.js                   (services API)
```

## Flux utilisateur

```
1. Liste des devis (DevisList)
   ├─ Bouton "+ Nouveau devis"
   ├─ Filtre par statut
   └─ Actions rapides (voir, valider, refuser)

2. Créer/Modifier devis (DevisForm)
   ├─ Sélectionner client
   ├─ Sélectionner intervention (optionnel)
   ├─ Ajouter lignes (services/pièces)
   └─ Sauvegarder

3. Détail du devis (DevisDetail)
   ├─ Voir infos complètes
   ├─ Aperçu PDF
   ├─ Actions (Valider, Refuser, Créer facture)
   └─ Retour à la liste
```

## Actions principales

### Créer un devis
1. Cliquer sur "+ Nouveau devis"
2. Sélectionner un client
3. Ajouter des lignes (services ou pièces)
4. Cliquer "Créer le devis"

### Valider un devis
1. Cliquer sur 👁️ (voir le devis)
2. Cliquer sur "✅ Valider"

### Créer une facture
1. Valider un devis
2. Cliquer sur "📄 Créer facture"
3. Choisir la date d'échéance
4. Cliquer "Créer"

### Imprimer/Télécharger PDF
1. Afficher le devis en détail
2. Cliquer sur "🖨️ Aperçu PDF"
3. Cliquer "Imprimer" ou "Télécharger PDF"

## Statuts des devis

| Statut | Couleur | Actions | Terminal |
|--------|--------|---------|----------|
| CREE | Bleu | Valider, Refuser | Non |
| VALIDE | Vert | Créer facture, Refuser | Non |
| REFUSE | Rouge | Aucune | Oui |
| EXPIRE | Gris | Aucune | Oui |
| FACTURE | Violet | Aucune | Oui |

## Fonctionnalités principales

- ✅ Création/modification de devis
- ✅ Gestion des lignes (service/pièce)
- ✅ Calcul automatique des totaux (HT, TVA 20%, TTC)
- ✅ Validation/Refus de devis
- ✅ Conversion en facture
- ✅ Aperçu et export PDF
- ✅ Filtrage par statut
- ✅ Confirmations pour actions destructives
- ✅ Formatage français (dates, montants)

## Formulaire création/modification

```
Client *                    (obligatoire)
Intervention                (optionnel)
Date validité *             (obligatoire, défaut +30j)
Notes                       (optionnel)

Lignes:
  - Type: Service ou Pièce
  - Si Pièce: prix_vente auto-rempli
  - Description, Quantité, Prix unitaire
  - Bouton "Ajouter"
  - Liste avec bouton supprimer 🗑️

Totaux calculés en direct:
  - HT = somme des sous-totaux
  - TVA = HT * 20%
  - TTC = HT + TVA
```

## Détail devis

Affiche:
- Infos client (nom, tél, email, adresse)
- Infos véhicule (si présent)
- Infos intervention (si présente)
- Tableau des lignes
- Totaux
- Actions selon statut
- Boutons: Aperçu PDF, Retour

## Format des dates

- Affichage: Français (JJ/MM/AAAA)
- API: ISO (AAAA-MM-JJ ou ISO complet)
- Conversion automatique

Exemple: `2026-04-30` → `30/04/2026`

## Format des montants

- Format: 150,00 €
- Utilise: `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`
- Conversion automatique depuis les strings de l'API

Exemple: `"150.50"` → `150,50 €`

## Erreurs et gestion

- Chargement: affichage d'un spinner
- Erreur: affichage message d'erreur
- Confirmation: `window.confirm()` pour actions destructives
- Messages: `alert()` pour erreurs

## Tests basiques

```bash
# 1. Créer un devis
   - Client: sélectionner
   - Intervention: optionnel
   - Ajouter 2 lignes
   - Vérifier calculs

# 2. Valider
   - Cliquer voir → détail
   - Cliquer Valider
   - Vérifier statut change

# 3. Créer facture
   - Depuis devis validé
   - Choisir date échéance
   - Vérifier statut = FACTURE

# 4. PDF
   - Cliquer Aperçu PDF
   - Vérifier affichage
   - Tester impression
   - Tester téléchargement
```

## Dépannage

**Erreur: "Module not found: jsPDF"**
→ Installer: `npm install jspdf jspdf-autotable`

**Erreur: "Cannot read property 'map' of undefined"**
→ Vérifier que les services retournent des tableaux

**PDF ne s'affiche pas**
→ Vérifier jsPDF est installé et importé

**Montants affichés "0.00 €"**
→ Vérifier que API retourne des strings avec parseFloat()

## Documentation complète

Voir `DEVIS_README.md` dans `/src/components/Devis/`
Voir `DEVIS_SETUP.md` dans `/frontend/`

## Support

Pour les questions, consulter:
1. `DEVIS_README.md` - Documentation technique
2. `DEVIS_SETUP.md` - Guide d'intégration
3. Code source avec commentaires JSDoc

---

**Créé le**: 2026-03-30
**Version**: 1.0
**État**: Production-ready
