import { PiArchiveFill } from 'react-icons/pi';
// /frontend/src/utils/icons.ts
// ══════════════════════════════════════════════════════════════════
//  CATALOGUE D'ICÔNES UI — point d'entrée unique pour toute l'app
//  Bibliothèque : react-icons/pi (Phosphor Icons — style Fill)
//
//  ⚠️ Pourquoi le cast ?
//  react-icons retourne ReactNode mais TSX attend ReactElement.
//  On wrappe chaque icône avec `ic()` une fois ici → plus aucun
//  problème de typage dans le reste de l'app.
// ══════════════════════════════════════════════════════════════════

import React                       from 'react';
import { IconType }                from 'react-icons';

import { PiPlusFill }              from 'react-icons/pi';
import { PiUserPlusFill }          from 'react-icons/pi';
import { PiPencilSimpleFill }      from 'react-icons/pi';
import { PiTrashFill }             from 'react-icons/pi';
import { PiFloppyDiskFill }        from 'react-icons/pi';
import { PiCheckCircleFill }       from 'react-icons/pi';
import { PiCircleFill }            from 'react-icons/pi';
import { PiXFill }                 from 'react-icons/pi';
import { PiMagnifyingGlassFill }   from 'react-icons/pi';
import { PiListFill }              from 'react-icons/pi';
import { PiCaretDownFill }         from 'react-icons/pi';
import { PiCaretRightFill }        from 'react-icons/pi';
import { PiArrowLeftFill }         from 'react-icons/pi';
import { PiCalendarDotsFill }      from 'react-icons/pi';
import { PiUsersFill }             from 'react-icons/pi';
import { PiCarFill }               from 'react-icons/pi';
import { PiPackageFill }           from 'react-icons/pi';
import { PiFactoryFill }           from 'react-icons/pi';
import { PiReceiptFill }           from 'react-icons/pi';
import { PiGearSixFill }           from 'react-icons/pi';
import { PiClockClockwiseFill }    from 'react-icons/pi';
import { PiCalendarPlusFill }      from 'react-icons/pi';
import { PiPlayCircleFill }        from 'react-icons/pi';
import { PiXCircleFill }           from 'react-icons/pi';
import { PiPhoneFill }             from 'react-icons/pi';
import { PiEnvelopeFill }          from 'react-icons/pi';
import { PiMapPinFill }            from 'react-icons/pi';
import { PiUserFill }              from 'react-icons/pi';
import { PiFileTextFill }          from 'react-icons/pi';
import { PiInfoFill }              from 'react-icons/pi';
import { PiWarningCircleFill }     from 'react-icons/pi';
import { PiCircleNotch }           from 'react-icons/pi';
import { PiKeyFill }               from 'react-icons/pi';
import { PiWrenchFill }            from 'react-icons/pi';
import { PiTagFill }               from 'react-icons/pi';
import { PiMoneyFill }             from 'react-icons/pi';
import { PiGraduationCapFill }     from 'react-icons/pi';
import { PiCurrencyDollarFill }    from 'react-icons/pi';
import { PiPaletteFill }           from 'react-icons/pi';
import { PiBellFill }              from 'react-icons/pi';
import { PiRobotFill }             from 'react-icons/pi';
import { PiShieldFill }            from 'react-icons/pi';
import { PiPrinterFill }           from 'react-icons/pi';

// ── Type corrigé ──────────────────────────────────────────────────
// IconType de react-icons retourne ReactNode mais TSX attend ReactElement.
// Ce helper cast une fois → toute l'app est propre sans cast répété.
type Icon = React.ComponentType<{ size?: number; className?: string; color?: string }>;
const ic = (i: IconType): Icon => i as unknown as Icon;

// ── Navigation & actions génériques ──────────────────────────────
export const Plus          = ic(PiPlusFill);
export const UserPlus      = ic(PiUserPlusFill);
export const Pencil        = ic(PiPencilSimpleFill);
export const Trash2        = ic(PiTrashFill);
export const Save          = ic(PiFloppyDiskFill);
export const Check         = ic(PiCheckCircleFill);
export const CheckCircle   = ic(PiCheckCircleFill);
export const CircleCheck   = ic(PiCheckCircleFill);
export const Circle        = ic(PiCircleFill);
export const X             = ic(PiXFill);
export const Search        = ic(PiMagnifyingGlassFill);
export const Menu          = ic(PiListFill);
export const ChevronDown   = ic(PiCaretDownFill);
export const ChevronRight  = ic(PiCaretRightFill);
export const ArrowLeft     = ic(PiArrowLeftFill);

// ── Navigation sidebar ────────────────────────────────────────────
export const CalendarDays  = ic(PiCalendarDotsFill);
export const Users         = ic(PiUsersFill);
export const Car           = ic(PiCarFill);
export const Package       = ic(PiPackageFill);
export const Factory       = ic(PiFactoryFill);
export const Receipt       = ic(PiReceiptFill);
export const Settings      = ic(PiGearSixFill);
export const Archive       = ic(PiArchiveFill);

// ── Planning / RDV ────────────────────────────────────────────────
export const CalendarClock = ic(PiClockClockwiseFill);
export const CalendarPlus  = ic(PiCalendarPlusFill);
export const CirclePlay    = ic(PiPlayCircleFill);
export const CircleX       = ic(PiXCircleFill);

// ── Coordonnées / contact ─────────────────────────────────────────
export const Phone         = ic(PiPhoneFill);
export const Mail          = ic(PiEnvelopeFill);
export const MapPin        = ic(PiMapPinFill);
export const User          = ic(PiUserFill);
export const FileText      = ic(PiFileTextFill);

// ── Statut / utilitaires ──────────────────────────────────────────
export const Info          = ic(PiInfoFill);
export const CircleAlert   = ic(PiWarningCircleFill);
export const Loader        = ic(PiCircleNotch);
export const Key           = ic(PiKeyFill);
export const Wrench        = ic(PiWrenchFill);
export const Tag           = ic(PiTagFill);
export const Banknote      = ic(PiMoneyFill);
export const GraduationCap = ic(PiGraduationCapFill);
export const DollarSign    = ic(PiCurrencyDollarFill);

// ── Divers ────────────────────────────────────────────────────────
export const Palette       = ic(PiPaletteFill);
export const Bell          = ic(PiBellFill);
export const Bot           = ic(PiRobotFill);
export const Shield        = ic(PiShieldFill);

// ── Imprimer / PDF ───────────────────────────────────────────────
export const Printer       = ic(PiPrinterFill);