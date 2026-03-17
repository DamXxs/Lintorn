// /frontend/src/components/shared/IconChip.jsx
import React from 'react';
import './IconChip.css';

/**
 * 🎨 Composant IconChip — Icône "style iOS" avec fond coloré
 *
 * Donne un rendu "rempli" et travaillé, bien plus lisible qu'un emoji.
 * Parfait pour les infos de contact, les sections importantes, etc.
 *
 * Rendu visuel :
 *   ┌──────┐
 *   │  📞  │  ← icône blanche sur fond coloré arrondi
 *   └──────┘
 *
 * Utilisation :
 *   <IconChip icon={Phone} color="#e74c3c" />           // téléphone rouge
 *   <IconChip icon={Mail}  color="#3498db" size="lg" /> // mail bleu, grand
 *   <IconChip icon={MapPin} color="#e67e22" size="sm" />// adresse orange, petit
 *
 * Props :
 *   icon  : composant Phosphor — ex: Phone, Mail, MapPin
 *   color : string           — couleur de fond hex/rgb
 *   size  : 'sm'|'md'|'lg'  — taille (défaut: 'md')
 */

// Palette de couleurs prédéfinies — importe ces constantes
// pour garder les couleurs cohérentes dans toute l'app
export const CHIP_COLORS = {
  phone:    '#e74c3c',  // Rouge    — téléphone
  mail:     '#3498db',  // Bleu     — email
  location: '#e67e22',  // Orange   — adresse
  calendar: '#27ae60',  // Vert     — rendez-vous / dates
  car:      '#2980b9',  // Bleu ciel — véhicule
  user:     '#8e44ad',  // Violet   — client / personne
  notes:    '#16a085',  // Teal     — notes / documents
  wrench:   '#d35400',  // Orange foncé — mécanique
  money:    '#27ae60',  // Vert     — factures / argent
  settings: '#7f8c8d',  // Gris     — paramètres
  package:  '#2c3e50',  // Bleu nuit — stock
  alert:    '#c0392b',  // Rouge foncé — alerte / erreur
};

const SIZES = {
  sm: { box: 26, icon: 13, radius: 7  },
  md: { box: 34, icon: 17, radius: 9  },
  lg: { box: 44, icon: 22, radius: 12 },
};

const IconChip = ({ icon: Icon, color, size = 'md' }) => {
  const { box, icon, radius } = SIZES[size] || SIZES.md;

  return (
    <span
      className="icon-chip"
      style={{
        width:           box,
        height:          box,
        borderRadius:    radius,
        backgroundColor: color,
        minWidth:        box,   // empêche la compression dans les flex
      }}
    >
      <Icon size={icon} color="white" weight="fill" />
    </span>
  );
};

export default IconChip;
