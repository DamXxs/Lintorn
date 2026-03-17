// /frontend/src/utils/icons.js
//
// ══════════════════════════════════════════════════════════════════
//  CATALOGUE D'ICÔNES UI — point d'entrée unique pour toute l'app
//  Bibliothèque : Phosphor Icons (@phosphor-icons/react)
// ══════════════════════════════════════════════════════════════════
//
//  POURQUOI CE FICHIER ?
//  Tous les composants importent leurs icônes ICI plutôt que
//  directement depuis '@phosphor-icons/react'. Résultat :
//    → Tu veux changer une icône dans toute l'app ?
//      Tu changes UNE ligne ici. C'est tout.
//    → Tu veux essayer un autre style (fill, bold...) partout ?
//      Tu changes 'duotone' en bas en 'fill'. Les composants ne bougent pas.
//
//  COMMENT ÇA MARCHE ?
//  Chaque icône est enveloppée dans un petit wrapper qui applique
//  weight="duotone" par défaut. Tu peux toujours passer weight="fill"
//  ou weight="regular" sur un composant précis pour l'exception.
//
//  UTILISATION dans un composant :
//    import { Phone, Pencil, Trash2 } from '../../utils/icons';
//    <Phone size={20} color="#e74c3c" />           ← duotone automatique
//    <Phone size={20} color="#e74c3c" weight="fill" /> ← override possible
//
// ══════════════════════════════════════════════════════════════════

import React from 'react';

// ── Imports Phosphor (noms originaux, avec alias pour rester compatibles) ──
import {
  // CRUD & Actions
  Plus              as _Plus,
  UserPlus          as _UserPlus,
  PencilSimple      as _Pencil,
  Trash             as _Trash2,
  FloppyDisk        as _Save,
  Check             as _Check,
  CheckCircle       as _CheckCircle,
  Circle            as _Circle,

  // Navigation & Interface
  X                 as _X,
  MagnifyingGlass   as _Search,
  List              as _Menu,
  CaretDown         as _ChevronDown,
  CaretRight        as _ChevronRight,
  ArrowLeft         as _ArrowLeft,

  // Sidebar principale
  CalendarDots      as _CalendarDays,
  Users             as _Users,
  Car               as _Car,
  Package           as _Package,
  Factory           as _Factory,
  Receipt           as _Receipt,
  Gear              as _Settings,

  // RDV & Planning
  ClockClockwise    as _CalendarClock,
  CalendarPlus      as _CalendarPlus,
  PlayCircle        as _CirclePlay,
  XCircle           as _CircleX,

  // Contact Client
  Phone             as _Phone,
  Envelope          as _Mail,
  MapPin            as _MapPin,
  User              as _User,
  FileText          as _FileText,

  // Informations & États
  Info              as _Info,
  WarningCircle     as _CircleAlert,
  CircleNotch       as _Loader,
  Key               as _Key,
  Wrench            as _Wrench,
  Tag               as _Tag,
  Money             as _Banknote,
  GraduationCap     as _GraduationCap,
  CurrencyDollar    as _DollarSign,

  // Paramètres
  Palette           as _Palette,
  Bell              as _Bell,
  Robot             as _Bot,

} from '@phosphor-icons/react';


// ══════════════════════════════════════════════════════════════════
//  HELPER — applique weight="duotone" par défaut sur n'importe quelle icône
//
//  Exemple d'utilisation :
//    const Phone = ph(_Phone);
//    → <Phone size={20} />             ← rendu en duotone
//    → <Phone size={20} weight="fill" /> ← override possible
// ══════════════════════════════════════════════════════════════════
const ph = (Icon) => {
  const Wrapped = ({ weight = 'duotone', ...props }) =>
    React.createElement(Icon, { weight, ...props });
  Wrapped.displayName = Icon.displayName || Icon.name;
  return Wrapped;
};


// ── EXPORTS — mêmes noms qu'avant, compatibles avec tout le code existant ──

// Actions CRUD
export const Plus         = ph(_Plus);
export const UserPlus     = ph(_UserPlus);
export const Pencil       = ph(_Pencil);
export const Trash2       = ph(_Trash2);
export const Save         = ph(_Save);
export const Check        = ph(_Check);
export const CheckCircle  = ph(_CheckCircle);
export const CircleCheck  = ph(_CheckCircle);  // alias (même icône)
export const Circle       = ph(_Circle);

// Navigation & Interface
export const X            = ph(_X);
export const Search       = ph(_Search);
export const Menu         = ph(_Menu);
export const ChevronDown  = ph(_ChevronDown);
export const ChevronRight = ph(_ChevronRight);
export const ArrowLeft    = ph(_ArrowLeft);

// Sidebar principale
export const CalendarDays = ph(_CalendarDays);
export const Users        = ph(_Users);
export const Car          = ph(_Car);
export const Package      = ph(_Package);
export const Factory      = ph(_Factory);
export const Receipt      = ph(_Receipt);
export const Settings     = ph(_Settings);

// RDV & Planning
export const CalendarClock = ph(_CalendarClock);
export const CalendarPlus  = ph(_CalendarPlus);
export const CirclePlay    = ph(_CirclePlay);
export const CircleX       = ph(_CircleX);

// Contact Client
export const Phone    = ph(_Phone);
export const Mail     = ph(_Mail);
export const MapPin   = ph(_MapPin);
export const User     = ph(_User);
export const FileText = ph(_FileText);

// Informations & États
export const Info          = ph(_Info);
export const CircleAlert   = ph(_CircleAlert);
export const Loader        = ph(_Loader);
export const Key           = ph(_Key);
export const Wrench        = ph(_Wrench);
export const Tag           = ph(_Tag);
export const Banknote      = ph(_Banknote);
export const GraduationCap = ph(_GraduationCap);
export const DollarSign    = ph(_DollarSign);

// Paramètres
export const Palette = ph(_Palette);
export const Bell    = ph(_Bell);
export const Bot     = ph(_Bot);
