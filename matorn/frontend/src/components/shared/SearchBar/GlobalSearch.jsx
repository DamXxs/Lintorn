// /frontend/src/components/shared/SearchBar/GlobalSearch.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAll, countResults } from '../../../services/searchService';
import { Search, X, Loader } from '../../../utils/icons';
import './GlobalSearch.css';

/**
 * 🔍 RECHERCHE UNIVERSELLE
 *
 * Barre de recherche globale dans le header.
 * Cherche dans : clients, véhicules, pièces, interventions.
 *
 * Comportement :
 *   - Debounce 300ms pour éviter de spammer l'API
 *   - Dropdown avec résultats groupés par catégorie
 *   - Navigation clavier (↑ ↓ Entrée Échap)
 *   - Clic sur un résultat → callback onSelectItem (ouvre la fiche)
 *   - Petit lien "voir la page" → navigue vers la section
 *
 * Props :
 *   onSelectItem(item) — appelé quand l'utilisateur clique un résultat
 *                         item contient _type, _id et toutes les données
 */

// Catégories affichées dans le dropdown (dans cet ordre)
const CATEGORIES = [
  { key: 'clients',       label: 'Clients',       icon: '👤' },
  { key: 'vehicules',     label: 'Véhicules',     icon: '🚗' },
  { key: 'pieces',        label: 'Pièces',        icon: '🔩' },
  { key: 'interventions', label: 'Rendez-vous',   icon: '📅' },
];

const GlobalSearch = ({ onSelectItem }) => {
  const navigate = useNavigate();

  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [isOpen, setIsOpen]           = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Refs
  const containerRef = useRef(null);
  const inputRef     = useRef(null);
  const debounceRef  = useRef(null);

  // ── Liste à plat de tous les résultats (pour la navigation clavier) ──
  const flatResults = results
    ? CATEGORIES.flatMap(cat => (results[cat.key] || []))
    : [];

  // ── DEBOUNCE — appel API 300ms après la dernière frappe ──────────
  useEffect(() => {
    clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setResults(null);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchAll(query);
        setResults(data);
        setIsOpen(countResults(data) > 0);
        setActiveIndex(-1);
      } catch {
        setResults(null);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ── FERMER au clic en dehors ────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── SÉLECTION d'un résultat (clic = ouvre la fiche) ─────────────
  const handleSelect = useCallback((item) => {
    setQuery('');
    setIsOpen(false);
    setResults(null);
    if (onSelectItem) onSelectItem(item);
  }, [onSelectItem]);

  // ── NAVIGATION vers la page correspondante ──────────────────────
  const handleGoToPage = useCallback((e, item) => {
    e.stopPropagation(); // Empêche le handleSelect du parent
    setQuery('');
    setIsOpen(false);
    setResults(null);
    navigate(item._pageUrl);
  }, [navigate]);

  // ── NAVIGATION CLAVIER (↑ ↓ Entrée Échap) ──────────────────────
  const handleKeyDown = (e) => {
    if (!isOpen || flatResults.length === 0) {
      // Échap ferme quand même si le dropdown est ouvert
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev =>
          prev < flatResults.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : 0);
        break;

      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && flatResults[activeIndex]) {
          handleSelect(flatResults[activeIndex]);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;

      default:
        break;
    }
  };

  // ── EFFACER la recherche ────────────────────────────────────────
  const handleClear = () => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // ── Compteur pour l'index global dans la liste à plat ───────────
  let globalIndex = 0;

  // ── RENDU ───────────────────────────────────────────────────────
  return (
    <div className="global-search" ref={containerRef}>

      {/* BARRE DE SAISIE */}
      <div className="global-search__input-wrapper">
        <span className="global-search__input-icon">
          {loading ? <Loader size={16} className="global-search__spin" /> : <Search size={16} />}
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results && countResults(results) > 0 && setIsOpen(true)}
          placeholder="Rechercher un client, véhicule, pièce, RDV..."
          className="global-search__input"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Bouton effacer (visible si du texte est saisi) */}
        {query && (
          <button className="global-search__clear" onClick={handleClear} title="Effacer">
            <X size={14} />
          </button>
        )}

        {/* Raccourci clavier indicatif */}
        {!query && (
          <span className="global-search__shortcut">Ctrl+K</span>
        )}
      </div>

      {/* DROPDOWN RÉSULTATS */}
      {isOpen && results && (
        <div className="global-search__dropdown">

          {CATEGORIES.map(cat => {
            const items = results[cat.key] || [];
            if (items.length === 0) return null;

            return (
              <div key={cat.key} className="global-search__category">
                {/* Titre de catégorie */}
                <div className="global-search__category-header">
                  <span className="global-search__category-icon">{cat.icon}</span>
                  <span className="global-search__category-label">{cat.label}</span>
                  <span className="global-search__category-count">{items.length}</span>
                </div>

                {/* Résultats de la catégorie */}
                {items.map(item => {
                  const currentIndex = globalIndex++;
                  return (
                    <div
                      key={`${cat.key}-${item._id}`}
                      className={`global-search__item ${
                        currentIndex === activeIndex ? 'global-search__item--active' : ''
                      }`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(item);
                      }}
                      onMouseEnter={() => setActiveIndex(currentIndex)}
                    >
                      {/* Icône + infos */}
                      <span className="global-search__item-icon">{item._icon}</span>
                      <div className="global-search__item-info">
                        <span className="global-search__item-label">{item._label}</span>
                        <span className="global-search__item-sublabel">{item._sublabel}</span>
                      </div>

                      {/* Lien "voir la page" */}
                      <button
                        className="global-search__item-goto"
                        onMouseDown={(e) => handleGoToPage(e, item)}
                        title={`Aller à la page ${cat.label}`}
                      >
                        Voir →
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Footer avec le total */}
          <div className="global-search__footer">
            {countResults(results)} résultat{countResults(results) > 1 ? 's' : ''} trouvé{countResults(results) > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Message "aucun résultat" */}
      {isOpen && results && countResults(results) === 0 && query.length >= 2 && !loading && (
        <div className="global-search__dropdown">
          <div className="global-search__empty">
            Aucun résultat pour « {query} »
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;