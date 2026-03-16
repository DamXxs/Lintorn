// /frontend/src/components/shared/AddressAutocomplete.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Loader, MapPin } from '../../utils/icons';
import './AddressAutocomplete.css';

/**
 * 📍 AUTOCOMPLÉTION D'ADRESSE
 *
 * Utilise l'API Adresse du gouvernement français (data.gouv.fr)
 * 100% gratuit, sans clé API, sans inscription.
 *
 * Props :
 *   value        → valeur actuelle du champ (contrôlé par le parent)
 *   onChange     → appelé à chaque frappe avec la nouvelle valeur (string)
 *   onSelect     → appelé quand l'utilisateur choisit une suggestion (objet adresse complet)
 *   placeholder  → texte placeholder du champ
 *   className    → classes CSS supplémentaires
 */
const AddressAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = '123 Rue de la République, 75001 Paris',
  className = '',
}) => {

  const [suggestions, setSuggestions] = useState([]);   // Liste des suggestions
  const [isOpen, setIsOpen]           = useState(false); // Dropdown visible ?
  const [loading, setLoading]         = useState(false); // Chargement en cours ?
  const [activeIndex, setActiveIndex] = useState(-1);    // Suggestion sélectionnée au clavier

  // Refs pour gérer les clics en dehors et le debounce
  const containerRef = useRef(null);
  const debounceRef  = useRef(null);

  // =========================================================================
  // APPEL API GOUV — déclenché après 300ms sans frappe
  // =========================================================================
  useEffect(() => {

    // On efface le timer précédent à chaque frappe (debounce)
    clearTimeout(debounceRef.current);

    // Moins de 3 caractères → pas la peine d'appeler l'API
    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // On attend 300ms avant d'appeler l'API
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);

        // Encode l'adresse pour l'URL (remplace espaces, accents, etc.)
        const query = encodeURIComponent(value.trim());

        // Appel API gouvernementale française — gratuit, sans clé !
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${query}&limit=5&autocomplete=1`
        );

        if (!response.ok) throw new Error('Erreur API adresse');

        const data = await response.json();

        // L'API renvoie un objet GeoJSON avec un tableau "features"
        setSuggestions(data.features || []);
        setIsOpen((data.features || []).length > 0);
        setActiveIndex(-1); // Reset de la sélection clavier

      } catch (err) {
        // En cas d'erreur réseau, on n'affiche rien
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300); // ← 300ms de debounce

    // Nettoyage du timer si le composant se démonte
    return () => clearTimeout(debounceRef.current);

  }, [value]); // Se relance à chaque changement de valeur

  // =========================================================================
  // FERMER SI CLIC EN DEHORS
  // =========================================================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // =========================================================================
  // SÉLECTION D'UNE SUGGESTION
  // =========================================================================
  const handleSelect = (feature) => {
    // "label" contient l'adresse complète formatée
    const adresseComplete = feature.properties.label;

    // On remplit le champ avec l'adresse choisie
    onChange(adresseComplete);

    // On envoie l'objet complet au parent si besoin
    // (utile pour récupérer code postal, ville, coordonnées GPS, etc.)
    if (onSelect) {
      onSelect({
        adresse:     feature.properties.label,
        rue:         feature.properties.name,
        codePostal:  feature.properties.postcode,
        ville:       feature.properties.city,
        departement: feature.properties.context,
        // Coordonnées GPS si besoin plus tard (ex: carte)
        lat:         feature.geometry.coordinates[1],
        lng:         feature.geometry.coordinates[0],
      });
    }

    // Ferme la liste
    setSuggestions([]);
    setIsOpen(false);
  };

  // =========================================================================
  // NAVIGATION AU CLAVIER (↑ ↓ Entrée Échap)
  // =========================================================================
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        // Descend dans la liste
        e.preventDefault();
        setActiveIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        // Monte dans la liste
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : 0);
        break;

      case 'Enter':
        // Sélectionne la suggestion active
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelect(suggestions[activeIndex]);
        }
        break;

      case 'Escape':
        // Ferme la liste
        setIsOpen(false);
        setActiveIndex(-1);
        break;

      default:
        break;
    }
  };

  // =========================================================================
  // RENDU
  // =========================================================================
  return (
    <div className="address-autocomplete" ref={containerRef}>

      {/* CHAMP DE SAISIE */}
      <div className="address-autocomplete__input-wrapper">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={`form-input address-autocomplete__input ${className}`}
          autoComplete="off" // Désactive l'autocomplétion native du navigateur
        />

        {/* Indicateur de chargement */}
        {loading && (
          <span className="address-autocomplete__spinner"><Loader size={14} /></span>
        )}

        {/* Icône adresse */}
        {!loading && (
          <span className="address-autocomplete__icon"><MapPin size={14} /></span>
        )}
      </div>

      {/* LISTE DE SUGGESTIONS */}
      {isOpen && suggestions.length > 0 && (
        <ul className="address-autocomplete__dropdown">
          {suggestions.map((feature, index) => (
            <li
              key={feature.properties.id || index}
              className={`address-autocomplete__item ${
                index === activeIndex ? 'address-autocomplete__item--active' : ''
              }`}
              onMouseDown={(e) => {
                // onMouseDown au lieu de onClick pour éviter le conflit
                // avec handleClickOutside qui se déclenche en premier
                e.preventDefault();
                handleSelect(feature);
              }}
            >
              {/* Icône selon le type de résultat */}
              <span className="address-autocomplete__item-icon">
                {feature.properties.type === 'municipality' ? '🏙️' : '📍'}
              </span>

              <div className="address-autocomplete__item-text">
                {/* Nom de la rue */}
                <span className="address-autocomplete__item-main">
                  {feature.properties.name}
                </span>
                {/* Ville + code postal */}
                <span className="address-autocomplete__item-sub">
                  {feature.properties.postcode} {feature.properties.city}
                </span>
              </div>
            </li>
          ))}

          {/* Footer discret avec la source */}
          <li className="address-autocomplete__footer">
            Données : — data.gouv.fr
          </li>
        </ul>
      )}

    </div>
  );
};

export default AddressAutocomplete;