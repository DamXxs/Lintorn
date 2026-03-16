// /frontend/src/utils/icons.js
//
// ══════════════════════════════════════════════════════════════════
//  CATALOGUE D'ICÔNES UI — point d'entrée unique pour toute l'app
// ══════════════════════════════════════════════════════════════════
//
//  POURQUOI CE FICHIER ?
//  Tous les composants importent leurs icônes ICI plutôt que
//  directement depuis 'lucide-react'. Résultat :
//    → Tu veux changer l'icône "Modifier" dans toute l'app ?
//      Tu changes UNE ligne ici. C'est tout.
//    → Tu veux remplacer Lucide par une autre bibliothèque un jour ?
//      Tu changes CE fichier. Les composants ne bougent pas.
//
//  UTILISATION dans un composant :
//    import { IconModifier, IconSupprimer } from '../../utils/icons';
//    // ou si tu as besoin de l'icône originale :
//    import { Pencil, Trash2 } from '../../utils/icons';  ← même chose
//
// ══════════════════════════════════════════════════════════════════

export {

  // ── ACTIONS CRUD ─────────────────────────────────────────────────
  Plus,          // ➕ Ajouter un élément générique
  UserPlus,      // ➕ Ajouter un client
  Pencil,        // ✏️  Modifier / Éditer
  Trash2,        // 🗑️  Supprimer
  Save,          // 💾 Enregistrer
  Check,         // ✓  Validé (petit checkmark)
  CheckCircle,   // ✅ Actif / Validé (cercle)
  Circle,        // ⭕ Inactif (cercle vide)

  // ── NAVIGATION & INTERFACE ────────────────────────────────────────
  X,             // ✕  Fermer une modal / Effacer une recherche
  Search,        // 🔍 Rechercher
  Menu,          // ☰  Menu burger (sidebar)
  ChevronDown,   // ˅  Accordéon / Select
  ChevronRight,  // >  Flèche navigation
  ArrowLeft,     // ←  Retour

  // ── NAVIGATION PRINCIPALE (Sidebar) ──────────────────────────────
  CalendarDays,  // 📅 Planning / Historique RDV
  Users,         // 👥 Clients
  Car,           // 🚗 Véhicules
  Package,       // 📦 Stock
  Factory,       // 🏭 Atelier
  Receipt,       // 🧾 Factures & Devis
  Settings,      // ⚙️  Paramètres

  // ── RDV & PLANNING ───────────────────────────────────────────────
  CalendarClock, // 🕐 Date/heure de planification
  CalendarPlus,  // 📅 Nouveau rendez-vous
  CirclePlay,    // ▶️  Démarrer / En cours
  CircleCheck,   // ✅ Terminé / Validé
  CircleX,       // ❌ Annulé

  // ── CONTACT CLIENT ───────────────────────────────────────────────
  Phone,         // 📞 Téléphone
  Mail,          // ✉️  Email
  MapPin,        // 📍 Adresse / Localisation
  User,          // 👤 Client (générique)
  FileText,      // 📄 Notes / Document

  // ── INFORMATIONS ─────────────────────────────────────────────────
  Info,          // ℹ️  Information
  CircleAlert,   // ⚠️  Alerte / Avertissement
  Loader,        // ⏳ Chargement (animé avec CSS)
  Key,           // 🔑 Identification / Sécurité
  Wrench,        // 🔧 Mécanique / Interventions
  Tag,           // 🏷️  Statut / Catégorie
  Banknote,      // 💰 Factures / Finances
  GraduationCap, // 🎓 Formation / Aide
  DollarSign,    // $ Prix / Tarif

  // ── PARAMÈTRES ───────────────────────────────────────────────────
  Palette,       // 🎨 Thème / Couleurs
  Bell,          // 🔔 Notifications
  Bot,           // 🤖 IA / Assistant

} from 'lucide-react';
