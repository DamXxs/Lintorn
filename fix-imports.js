/**
 * fix-imports.js
 *
 * Corrige les imports cassés ET les convertit vers les alias @ (chemin absolu depuis src/).
 *
 * AVANT :  import X from '../../services/api'
 * APRES :  import X from '@/services/api'
 *
 * AVANT :  import X from '../shared/LoadingState'
 * APRES :  import X from '@/components/shared/LoadingState'
 *
 * USAGE : Dans un terminal, depuis le dossier damxscorp_gestion/ :
 *   node fix-imports.js
 */

const fs = require('fs');
const path = require('path');

// Dossiers a corriger (relatifs depuis ce script, dans damxscorp_gestion/)
const DOSSIERS = [
  'damxscorp/frontend/src/pages/Factures/Devis',
  'damxscorp/frontend/src/pages/Factures/Factures',
];

// Remplacements : [ce qu'on cherche, ce qu'on met]
const REMPLACEMENTS = [
  // --- Services (guillemets simples) ---
  ["from '../../services/api'",              "from '@/services/api'"],
  ["from '../../services/devisService'",     "from '@/services/devisService'"],
  ["from '../../services/factureService'",   "from '@/services/factureService'"],
  ["from '../../services/parametresService'","from '@/services/parametresService'"],
  // --- Services (guillemets doubles) ---
  ['from "../../services/api"',              'from "@/services/api"'],
  ['from "../../services/devisService"',     'from "@/services/devisService"'],
  ['from "../../services/factureService"',   'from "@/services/factureService"'],
  ['from "../../services/parametresService"','from "@/services/parametresService"'],

  // --- Composants shared (guillemets simples) ---
  ["from '../shared/LoadingState'",   "from '@/components/shared/LoadingState'"],
  ["from '../shared/ErrorState'",     "from '@/components/shared/ErrorState'"],
  ["from '../shared/Modals/Modal'",   "from '@/components/shared/Modals/Modal'"],
  ["from '../shared/PageHeader'",     "from '@/components/shared/PageHeader'"],
  ["from '../shared/SearchBar'",      "from '@/components/shared/SearchBar'"],
  ["from '../shared/StatutBadge'",    "from '@/components/shared/StatutBadge'"],
  ["from '../shared/HistoriqueList'", "from '@/components/shared/HistoriqueList'"],
  // --- Composants shared (guillemets doubles) ---
  ['from "../shared/LoadingState"',   'from "@/components/shared/LoadingState"'],
  ['from "../shared/ErrorState"',     'from "@/components/shared/ErrorState"'],
  ['from "../shared/Modals/Modal"',   'from "@/components/shared/Modals/Modal"'],
  ['from "../shared/PageHeader"',     'from "@/components/shared/PageHeader"'],
  ['from "../shared/SearchBar"',      'from "@/components/shared/SearchBar"'],
  ['from "../shared/StatutBadge"',    'from "@/components/shared/StatutBadge"'],
];

let totalFichiersModifies = 0;
let totalRemplacements = 0;

function corrigerFichier(cheminFichier) {
  let contenu = fs.readFileSync(cheminFichier, 'utf8');
  const original = contenu;
  let count = 0;

  for (const [ancien, nouveau] of REMPLACEMENTS) {
    while (contenu.includes(ancien)) {
      contenu = contenu.replace(ancien, nouveau);
      count++;
      console.log('    OK  ' + ancien);
      console.log('    =>  ' + nouveau);
    }
  }

  if (contenu !== original) {
    fs.writeFileSync(cheminFichier, contenu, 'utf8');
    totalFichiersModifies++;
    totalRemplacements += count;
    return true;
  }
  return false;
}

function corrigerDossier(dossier) {
  const absPath = path.resolve(__dirname, dossier);
  if (!fs.existsSync(absPath)) {
    console.log('ATTENTION : Dossier introuvable : ' + absPath);
    console.log('Verifie que tu lances ce script depuis damxscorp_gestion/');
    return;
  }
  console.log('\n[Dossier] ' + dossier);
  const fichiers = fs.readdirSync(absPath).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
  for (const f of fichiers) {
    console.log('\n  [Fichier] ' + f);
    const ok = corrigerFichier(path.join(absPath, f));
    if (!ok) console.log('     (rien a changer)');
  }
}

console.log('Correction des imports + migration vers alias @...\n');
console.log('='.repeat(60));
for (const d of DOSSIERS) corrigerDossier(d);
console.log('\n' + '='.repeat(60));
console.log('\nTermine !');
console.log('   Fichiers modifies  : ' + totalFichiersModifies);
console.log('   Remplacements      : ' + totalRemplacements);
console.log('\nEtapes suivantes :');
console.log('   1. cd damxscorp\\frontend');
console.log('   2. npm uninstall craco   (supprimer le mauvais package)');
console.log('   3. npm start             (demarrer avec CRACO)\n');
