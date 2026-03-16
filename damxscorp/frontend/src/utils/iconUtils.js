// /frontend/src/utils/iconUtils.jsx
import React from 'react';
import {
  Car,
  Truck,
  Bike,
  Tractor,
  Waves,
  Anchor,
  Wrench,
  Hammer,
  Cog,
  Settings,
  Fuel,
  Zap,
  Battery,
  CircleDot,
  Flame,
  Package,
  Box,
  Tag,
  Shield,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Leaf,
  Snowflake,
  Wind,
} from 'lucide-react';

/**
 * 🎨 CATALOGUE D'ICÔNES LUCIDE
 */
export const ICONES_CATALOGUE = {
  'Véhicules': [
    { nom: 'Car',     label: 'Voiture',    Composant: Car },
    { nom: 'Truck',   label: 'Camion',     Composant: Truck },
    { nom: 'Bike',    label: 'Moto/Vélo',  Composant: Bike },
    { nom: 'Tractor', label: 'Tracteur',   Composant: Tractor },
    { nom: 'Waves',   label: 'Bateau/Eau', Composant: Waves },
    { nom: 'Anchor',  label: 'Ancre',      Composant: Anchor },
  ],
  'Mécanique': [
    { nom: 'Wrench',      label: 'Clé',        Composant: Wrench },
    { nom: 'Hammer',      label: 'Marteau',    Composant: Hammer },
    { nom: 'Cog',         label: 'Engrenage',  Composant: Cog },
    { nom: 'Settings',    label: 'Réglages',   Composant: Settings },
    { nom: 'Fuel',        label: 'Carburant',  Composant: Fuel },
    { nom: 'Zap',         label: 'Électrique', Composant: Zap },
    { nom: 'Battery',     label: 'Batterie',   Composant: Battery },
    { nom: 'CircleDot',   label: 'Pneu',       Composant: CircleDot },
    { nom: 'Flame',       label: 'Moteur',     Composant: Flame },
    { nom: 'Shield',      label: 'Protection', Composant: Shield },
    { nom: 'CheckCircle', label: 'Validé',     Composant: CheckCircle },
  ],
  'Stock & Divers': [
    { nom: 'Package',       label: 'Colis',      Composant: Package },
    { nom: 'Box',           label: 'Boîte',      Composant: Box },
    { nom: 'Tag',           label: 'Étiquette',  Composant: Tag },
    { nom: 'Star',          label: 'Favori',     Composant: Star },
    { nom: 'AlertTriangle', label: 'Alerte',     Composant: AlertTriangle },
    { nom: 'Clock',         label: 'Temps',      Composant: Clock },
    { nom: 'Leaf',          label: 'Écologie',   Composant: Leaf },
    { nom: 'Snowflake',     label: 'Froid',      Composant: Snowflake },
    { nom: 'Wind',          label: 'Air',        Composant: Wind },
  ],
};

// ── MAP à plat nom → composant ────────────────────────────────────
// Construit automatiquement depuis le catalogue
const ICONES_MAP = {};
Object.values(ICONES_CATALOGUE).forEach(groupe => {
  groupe.forEach(({ nom, Composant }) => {
    ICONES_MAP[nom] = Composant;
  });
});

/**
 * Rend une icône Lucide depuis son nom stocké en base
 * @param {string} nom   - Nom de l'icône (ex: "Car")
 * @param {object} props - Props SVG (size, color, strokeWidth...)
 */
export const renderIcone = (nom, props = {}) => {
  const Composant = ICONES_MAP[nom];
  if (!Composant) {
    // Fallback visible : Package avec couleur d'alerte pour repérer
    // les icônes manquantes en dev
    return <Package size={props.size || 20} {...props} />;
  }
  return <Composant size={props.size || 20} {...props} />;
};

/**
 * Suggère automatiquement une icône selon les mots-clés du label
 */
export const suggererIcone = (label) => {
  const l = label.toLowerCase();

  // Véhicules
  if (/voiture|auto|car|berline|citadine|suv|4x4|coupé/.test(l))  return 'Car';
  if (/moto|motocycle|scooter|bike|deux.roues/.test(l))            return 'Bike';
  if (/camion|truck|van|utilitaire|fourgon|poids.lourd/.test(l))   return 'Truck';
  if (/tracteur|tractor|agricole|motoculture|tondeuse|quad/.test(l)) return 'Tractor';
  if (/bateau|boat|jet.ski|marin|nautique/.test(l))                return 'Waves';

  // Mécanique
  if (/vidange|huile|oil|carburant|fuel/.test(l))   return 'Fuel';
  if (/pneu|pneumatique|roue|jante/.test(l))        return 'CircleDot';
  if (/électr|elec|batterie|battery/.test(l))       return 'Zap';
  if (/frein|brake/.test(l))                        return 'Shield';
  if (/moteur|engine|distribution/.test(l))         return 'Flame';
  if (/revision|entretien|contrôle|vidange/.test(l)) return 'Wrench';
  if (/diagnostic|diag/.test(l))                    return 'Settings';
  if (/carrosserie/.test(l))                        return 'Car';

  // Stock
  if (/filtration|filtre/.test(l))  return 'Package';
  if (/mécanique|mecanique/.test(l)) return 'Cog';

  return 'Package'; // Fallback
};