# Index — Composants Partagés Ligne d'Article

Cette page répertorie tous les composants et utilitaires pour la gestion des lignes d'articles (devis/factures).

## Composants

### LigneArticleForm

**Fichiers :**
- `LigneArticleForm.jsx` (219 lignes)
- `LigneArticleForm.css` (219 lignes)

**Rôle :** Formulaire pour ajouter une ligne (pièce ou service)

**Import :**
```jsx
import LigneArticleForm from './LigneArticleForm';
```

**Utilisation :**
```jsx
<LigneArticleForm
  onAjouter={handleAjouter}
  pieces={pieces}
  loading={false}
/>
```

**Props :**
| Prop | Type | Description |
|------|------|-------------|
| `onAjouter` | function | Callback d'ajout de ligne |
| `pieces` | array | Tableau des pièces disponibles |
| `loading` | boolean | État de chargement |

**Événements :**
- Appelle `onAjouter(ligneData)` avec un objet contenant : `{ id, type, piece_id, description, quantite, prix_unitaire, sous_total }`

---

### LigneArticleList

**Fichiers :**
- `LigneArticleList.jsx` (127 lignes)
- `LigneArticleList.css` (241 lignes)

**Rôle :** Tableau d'affichage des lignes avec suppression

**Import :**
```jsx
import LigneArticleList from './LigneArticleList';
```

**Utilisation :**
```jsx
<LigneArticleList
  lignes={lignes}
  onDelete={handleDelete}
  readOnly={false}
/>
```

**Props :**
| Prop | Type | Description |
|------|------|-------------|
| `lignes` | array | Tableau des lignes à afficher |
| `onDelete` | function | Callback de suppression |
| `readOnly` | boolean | Masquer boutons suppression |

**Événements :**
- Appelle `onDelete(ligneId)` au clic sur le bouton 🗑️

---

## Utilitaires

### pdfExport.js

**Fichier :** `/utils/pdfExport.js` (186 lignes)

**Rôle :** Générer et télécharger des PDFs (devis/factures)

**Import :**
```jsx
import { genererPDF } from '../../utils/pdfExport';
```

**Utilisation :**
```jsx
const devis = { ... };
genererPDF(devis, 'devis');
// Télécharge : "DV-2024-001.pdf"
```

**Fonction :**
```javascript
genererPDF(document, type)
```

| Paramètre | Type | Valeurs |
|-----------|------|---------|
| `document` | object | Objet devis ou facture |
| `type` | string | `'devis'` ou `'facture'` |

---

## Documentation

### Guides Disponibles

1. **COMPONENTS_GUIDE.md** (317 lignes)
   - Guide exhaustif d'intégration
   - Exemples détaillés
   - Structure des données
   - Checklist

2. **README_COMPOSANTS.md** (264 lignes)
   - Vue d'ensemble rapide
   - Points clés
   - Variables CSS
   - FAQ

3. **INTEGRATION_EXAMPLE.jsx** (559 lignes)
   - Exemple complet commenté
   - Code prêt à adapter
   - Gestion d'état
   - Styles CSS inclus

---

## Architecture

### Structure de données — Ligne

```javascript
{
  id: "ligne-1234567890",           // identifiant unique
  type: "piece" | "service",        // type de ligne
  piece_id: 42,                     // id pièce (si type='piece')
  description: "Courroie de distribution",
  quantite: 1,
  prix_unitaire: 200.00,
  sous_total: 200.00                // quantite * prix_unitaire
}
```

### Structure de données — Pièce

```javascript
{
  id: 42,
  reference: "CRT-001",
  nom: "Courroie de distribution",
  prix_vente: 200.00,
  stock_actuel: 5,
  stock_suspendu: 1,
  stock_disponible: 4,              // actuel - suspendu
  stock_status: "available"
}
```

### Structure de données — Devis/Facture

```javascript
{
  // Identification
  numero: "DV-2024-001",
  type: "devis",  // ou 'facture'

  // Dates
  date_creation: "2024-03-30T10:00:00Z",
  date_validite: "2024-04-30T23:59:59Z",  // devis
  date_emission: "2024-03-30T10:00:00Z",  // facture
  date_echeance: "2024-04-30T23:59:59Z",  // facture

  // Client
  client_nom: "Dupont",
  client_prenom: "Jean",
  client_adresse: "123 Rue de la Paix, 75000 Paris",
  client_telephone: "01 23 45 67 89",

  // Véhicule
  vehicule_info: {
    marque: "Toyota",
    modele: "Yaris",
    immatriculation: "AB-123-CD"
  },

  // Lignes
  lignes_devis: [...],   // ou lignes_facture

  // Montants
  montant_ht: 350.00,
  tva: 70.00,            // 20% de HT
  montant_ttc: 420.00,
  montant_paye: 200.00,  // facture
  solde_restant: 220.00, // facture

  // Notes
  notes: "Paiement par chèque"
}
```

---

## Flux d'intégration

```
DevisForm
├─ [Charger les pièces] → fetchPieces()
├─ [État] → const [lignes, setLignes] = useState([])
│
├─ <LigneArticleForm />
│  └─ onAjouter() → setLignes([...])
│
├─ <LigneArticleList />
│  ├─ lignes={lignes}
│  └─ onDelete() → setLignes(filter)
│
└─ [Exporter]
   └─ genererPDF(devisData, 'devis')
```

---

## Variables CSS Requises

À définir dans votre CSS global ou dans un fichier d'import :

```css
:root {
  --accent: #2980b9;     /* Couleur primaire (bleu) */
  --text: #1a1a1a;       /* Texte */
  --panel: #fff;         /* Fond panels */
  --bg: #f8f9fa;         /* Arrière-plan */
  --border: #e1e8ed;     /* Bordures */
}
```

---

## Checklist Rapide

- [ ] Copier les 5 fichiers dans les bons répertoires
- [ ] Importer les composants dans DevisForm/FactureForm
- [ ] Charger pièces via `fetchPieces()`
- [ ] Gérer état des lignes
- [ ] Connecter les callbacks
- [ ] Tester avec données réelles
- [ ] Adapter styles
- [ ] Tester responsivité
- [ ] Tester export PDF

---

## Support

**Questions ?** Consulter :
1. COMPONENTS_GUIDE.md (exhaustif)
2. INTEGRATION_EXAMPLE.jsx (exemple)
3. README_COMPOSANTS.md (FAQ)

---

Dernière mise à jour : 30/03/2026
