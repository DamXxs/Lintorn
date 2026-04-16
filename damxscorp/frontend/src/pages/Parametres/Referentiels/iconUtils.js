// /frontend/src/pages/Parametres/Referentiels/iconUtils.js
//
// ══════════════════════════════════════════════════════════════════
//  UTILITAIRE ICÔNES RÉFÉRENTIELS — À NE PAS CONFONDRE AVEC icons.js
//
//  CE FICHIER sert UNIQUEMENT à la page Paramètres > Référentiels.
//  Il permet à l'utilisateur de choisir une icône pour chaque entrée
//  configurable (types de véhicules, types d'interventions, etc.)
//
//  ICONES_CATALOGUE  → la palette d'icônes proposées dans le sélecteur
//                      visuel de ReferentielEditor.jsx
//
//  renderIcone(nom)  → prend un nom stocké en base Django (ex: "Car")
//                      et retourne le composant React correspondant
//                      Utilisé pour afficher l'icône dans les listes
//
//  suggererIcone(label) → suggère automatiquement une icône quand
//                         l'utilisateur tape un nom (ex: "Voiture" → "Car")
//
//  ──────────────────────────────────────────────────────────────────
//  icons.js    = icônes FIXES de l'interface (boutons, sidebar...)
//  iconUtils.js = icônes CONFIGURABLES par l'utilisateur (référentiels)
// ══════════════════════════════════════════════════════════════════

import React from 'react';
import {
  PiCarFill, PiTruckFill, PiBicycleFill, PiTractorFill,
  PiAnchorFill, PiWavesFill, PiWrenchFill, PiHammerFill,
  PiGearSixFill, PiFlameFill, PiShieldFill, PiLightningFill,
  PiBatteryFullFill, PiCircleFill, PiPackageFill, PiTagFill,
  PiStarFill, PiWarningCircleFill, PiClockClockwiseFill,
  PiLeafFill, PiSnowflakeFill, PiWindFill,
} from 'react-icons/pi';

export const ICONES_CATALOGUE = {
  'Véhicules': [
    { nom: 'Car',     label: 'Voiture',    Composant: PiCarFill },
    { nom: 'Truck',   label: 'Camion',     Composant: PiTruckFill },
    { nom: 'Bike',    label: 'Moto/Vélo',  Composant: PiBicycleFill },
    { nom: 'Tractor', label: 'Tracteur',   Composant: PiTractorFill },
    { nom: 'Waves',   label: 'Bateau/Eau', Composant: PiWavesFill },
    { nom: 'Anchor',  label: 'Ancre',      Composant: PiAnchorFill },
  ],
  'Mécanique': [
    { nom: 'Wrench',      label: 'Clé',        Composant: PiWrenchFill },
    { nom: 'Hammer',      label: 'Marteau',     Composant: PiHammerFill },
    { nom: 'Cog',         label: 'Engrenage',   Composant: PiGearSixFill },
    { nom: 'Settings',    label: 'Réglages',    Composant: PiGearSixFill },
    { nom: 'Fuel',        label: 'Carburant',   Composant: PiLightningFill },
    { nom: 'Zap',         label: 'Électrique',  Composant: PiLightningFill },
    { nom: 'Battery',     label: 'Batterie',    Composant: PiBatteryFullFill },
    { nom: 'CircleDot',   label: 'Pneu',        Composant: PiCircleFill },
    { nom: 'Flame',       label: 'Moteur',      Composant: PiFlameFill },
    { nom: 'Shield',      label: 'Protection',  Composant: PiShieldFill },
    { nom: 'CheckCircle', label: 'Validé',      Composant: PiShieldFill },
  ],
  'Stock & Divers': [
    { nom: 'Package',       label: 'Colis',      Composant: PiPackageFill },
    { nom: 'Box',           label: 'Boîte',      Composant: PiPackageFill },
    { nom: 'Tag',           label: 'Étiquette',  Composant: PiTagFill },
    { nom: 'Star',          label: 'Favori',     Composant: PiStarFill },
    { nom: 'AlertTriangle', label: 'Alerte',     Composant: PiWarningCircleFill },
    { nom: 'Clock',         label: 'Temps',      Composant: PiClockClockwiseFill },
    { nom: 'Leaf',          label: 'Écologie',   Composant: PiLeafFill },
    { nom: 'Snowflake',     label: 'Froid',      Composant: PiSnowflakeFill },
    { nom: 'Wind',          label: 'Air',        Composant: PiWindFill },
  ],
};

// ── Map à plat nom → composant ────────────────────────────────────
const ICONES_MAP = {};
Object.values(ICONES_CATALOGUE).forEach(groupe => {
  groupe.forEach(({ nom, Composant }) => {
    ICONES_MAP[nom] = Composant;
  });
});

export const renderIcone = (nom, props = {}) => {
  // Si pas de nom, ou nom vide → icône par défaut selon le contexte
  if (!nom || nom === 'null') {
    return <PiPackageFill size={props.size || 20} {...props} />;
  }
  const Composant = ICONES_MAP[nom];
  // Si le nom existe en map → on affiche le bon composant
  if (Composant) return <Composant size={props.size || 20} {...props} />;
  // Fallback si nom inconnu → Package
  return <PiPackageFill size={props.size || 20} {...props} />;
};
/**
 * Suggère automatiquement une icône selon les mots-clés du label
 */
export const suggererIcone = (label) => {
  const l = label.toLowerCase();

  //Véhicules
  if (/voiture|auto|car|berline|suv|4x4/.test(l))      return 'Car';
  if (/moto|scooter|bike|deux.roues/.test(l))           return 'Bike';
  if (/camion|truck|van|utilitaire|fourgon/.test(l))    return 'Truck';
  if (/tracteur|tractor|agricole|motoculture/.test(l))  return 'Tractor';
  if (/bateau|boat|jet.ski|marin|nautique/.test(l))     return 'Waves';

  //Maintenance
  if (/vidange|huile|oil|carburant|fuel/.test(l))       return 'Fuel';
  if (/pneu|pneumatique|roue|jante/.test(l))            return 'CircleDot';
  if (/électr|elec|batterie|battery/.test(l))           return 'Zap';
  if (/frein|brake/.test(l))                            return 'Shield';
  if (/moteur|engine|distribution/.test(l))             return 'Flame';
  if (/revision|entretien|contrôle/.test(l))            return 'Wrench';
  if (/diagnostic|diag/.test(l))                        return 'Settings';
  if (/filtration|filtre/.test(l))                      return 'Package';
  if (/mécanique|mecanique/.test(l))                    return 'Cog';
  return 'Package';
};