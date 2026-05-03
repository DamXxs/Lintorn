# Composants Partagés — Gestion Garage

## Fichiers Créés

### Composants React (JSX + CSS)

#### 1. **LigneArticleForm** (7.5 KB JSX + 5.9 KB CSS)
```
/components/shared/LigneArticleForm.jsx
/components/shared/LigneArticleForm.css
```

**Rôle** : Formulaire pour ajouter/modifier une ligne dans un devis ou une facture

**Fonctionnalités principales** :
- Toggle "🔧 Pièce" / "🛠️ Service"
- Select de pièces (filtrées par stock disponible)
- Pré-remplissage automatique de la description et du prix
- Affichage du stock disponible
- Input description libre (pour services)
- Champs quantité et prix unitaire
- Calcul du sous-total en temps réel
- Reset du formulaire après ajout

**Props** :
```jsx
<LigneArticleForm
  onAjouter={(ligneData) => {...}}  // callback d'ajout
  pieces={[...]}                     // tableau des pièces
  loading={false}                    // état de chargement
/>
```

---

#### 2. **LigneArticleList** (4.7 KB JSX + 6.0 KB CSS)
```
/components/shared/LigneArticleList.jsx
/components/shared/LigneArticleList.css
```

**Rôle** : Tableau d'affichage des lignes avec suppression optionnelle

**Fonctionnalités principales** :
- Tableau formaté avec colonnes : Description | Type | Quantité | Prix unit. | Sous-total
- Badges "🔧 Pièce" ou "🛠️ Service"
- Bouton 🗑️ supprimer (optionnel)
- Alternance des couleurs de fond
- Ligne de total HT en bas
- Responsive avec scroll horizontal sur mobile

**Props** :
```jsx
<LigneArticleList
  lignes={[...]}              // tableau des lignes
  onDelete={(ligneId) => {}}  // callback de suppression
  readOnly={false}            // masquer les boutons supprimer
/>
```

---

### Utilitaires (JS)

#### 3. **pdfExport.js** (6.9 KB)
```
/utils/pdfExport.js
```

**Rôle** : Génère et télécharge des PDFs pour devis/factures

**Fonctionnalités principales** :
- Génération de PDF formaté avec jsPDF
- Support devis et factures
- En-têtes personnalisés
- Infos client et véhicule
- Tableau des lignes
- Calcul des totaux (HT, TVA, TTC)
- Infos de paiement (factures)
- Notes et footer

**Utilisation** :
```jsx
import { genererPDF } from '../../utils/pdfExport';

// Générer et télécharger
genererPDF(devisObject, 'devis');
genererPDF(factureObject, 'facture');
```

---

## Documentation d'Intégration

### COMPONENTS_GUIDE.md
Guide complet avec :
- Exemples d'utilisation
- Détail de toutes les props
- Structure des données attendues
- Formatage des montants
- Checklist d'intégration
- Troubleshooting

### INTEGRATION_EXAMPLE.jsx
Exemple complet et commenté montrant :
- Comment charger les pièces
- Gestion de l'état des lignes
- Calcul des totaux
- Utilisation des trois composants ensemble
- Gestion des erreurs
- Export PDF
- Styles CSS minimaux

---

## Checklist Rapide

### Installation
- [x] LigneArticleForm.jsx + .css
- [x] LigneArticleList.jsx + .css
- [x] pdfExport.js
- [x] Documentation complète

### Intégration
- [ ] Importer les composants dans DevisForm/FactureForm
- [ ] Charger les pièces via `fetchPieces()`
- [ ] Gérer l'état des lignes
- [ ] Connecter les callbacks onAjouter/onDelete
- [ ] Tester avec données réelles
- [ ] Adapter les styles à votre thème
- [ ] Tester responsive
- [ ] Tester export PDF

---

## Points Clés d'Intégration

### 1. Import des composants
```jsx
import LigneArticleForm from './components/shared/LigneArticleForm';
import LigneArticleList from './components/shared/LigneArticleList';
import { genererPDF } from './utils/pdfExport';
```

### 2. Charger les pièces
```jsx
useEffect(() => {
  fetchPieces()
    .then(setPieces)
    .catch(handleError);
}, []);
```

### 3. Gérer les lignes
```jsx
const [lignes, setLignes] = useState([]);

const handleAjouter = (ligneData) => {
  setLignes([...lignes, { ...ligneData, id: generateId() }]);
};

const handleDelete = (ligneId) => {
  setLignes(lignes.filter(l => l.id !== ligneId));
};
```

### 4. Calculer les totaux
```jsx
const montant_ht = lignes.reduce((sum, l) =>
  sum + (l.prix_unitaire * l.quantite), 0
);
const tva = montant_ht * 0.2;
const montant_ttc = montant_ht + tva;
```

### 5. Exporter en PDF
```jsx
const devisComplet = {
  numero: 'DV-2024-001',
  date_creation: new Date().toISOString(),
  client_nom: formData.client_nom,
  // ... autres infos
  lignes_devis: lignes,
  montant_ht,
  tva,
  montant_ttc,
};

genererPDF(devisComplet, 'devis');
```

---

## Styles et Variables CSS

### Variables CSS utilisées
```css
--accent       /* Couleur primaire (bleu par défaut) */
--text         /* Couleur du texte */
--panel        /* Fond des panels/cards */
--bg           /* Arrière-plan général */
--border       /* Couleur des bordures */
```

### Formatage des montants
Utilise `Intl.NumberFormat` pour tous les montants :
```javascript
new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR'
}).format(montant)
```

---

## Tailles et Performances

| Fichier | Taille | Type |
|---------|--------|------|
| LigneArticleForm.jsx | 7.5 KB | Composant |
| LigneArticleForm.css | 5.9 KB | Styles |
| LigneArticleList.jsx | 4.7 KB | Composant |
| LigneArticleList.css | 6.0 KB | Styles |
| pdfExport.js | 6.9 KB | Utilitaire |
| **Total** | **31 KB** | - |

---

## Dépendances

### NPM packages requis
```json
{
  "react": "^18.0.0",
  "jspdf": "^2.5.0"
}
```

Note: `jsPDF` doit déjà être installé pour la génération PDF.

---

## Questions Fréquentes

**Q: Peut-on modifier une ligne après l'avoir ajoutée ?**
A: Actuellement non. À ajouter : clic sur une ligne pour édition, puis mise à jour dans la liste.

**Q: Comment pré-remplir le formulaire avec un devis existant ?**
A: Passer les lignes à `LigneArticleList` avec `readOnly={true}`, puis recharger le formulaire complet.

**Q: Peut-on avoir des TVA différentes ?**
A: Actuellement, TVA fixée à 20%. À adapter : ajouter un champ TVA par ligne ou au niveau du formulaire.

**Q: Peut-on supprimer des lignes après validation ?**
A: Utiliser la prop `readOnly={true}` pour masquer les boutons supprimer sur les factures définitives.

---

## Support et Maintenance

Pour des questions ou améliorations :
1. Consulter le guide complet (COMPONENTS_GUIDE.md)
2. Vérifier l'exemple complet (INTEGRATION_EXAMPLE.jsx)
3. Adapter selon vos besoins spécifiques
