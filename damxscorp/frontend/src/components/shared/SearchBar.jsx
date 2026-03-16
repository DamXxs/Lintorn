// /frontend/src/components/shared/SearchBar.jsx
import React from 'react';
import { Search, X } from '../../utils/icons';
import './shared.css';

/**
 * 🔍 Composant SearchBar
 *
 * Barre de recherche avec icône loupe, input texte, et bouton ✕ pour effacer.
 *
 * Utilisation :
 *   <SearchBar
 *     value={searchQuery}
 *     onChange={setSearchQuery}
 *     placeholder="Rechercher par nom, prénom..."
 *   />
 *
 * Props :
 *   value       : string   — valeur actuelle (contrôlé par le parent)
 *   onChange    : function — appelée avec la nouvelle valeur (string)
 *   placeholder : string   — texte indicatif dans l'input
 */
const SearchBar = ({ value, onChange, placeholder = 'Rechercher...' }) => (
  <div className="search-bar">

    {/* Icône loupe à gauche */}
    <Search size={16} className="search-bar__icon" />

    {/* Champ de saisie */}
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="search-bar__input"
    />

    {/* Bouton ✕ pour effacer (visible seulement si du texte est saisi) */}
    {value && (
      <button
        className="search-bar__clear"
        onClick={() => onChange('')}
        title="Effacer la recherche"
      >
        <X size={14} />
      </button>
    )}

  </div>
);

export default SearchBar;
