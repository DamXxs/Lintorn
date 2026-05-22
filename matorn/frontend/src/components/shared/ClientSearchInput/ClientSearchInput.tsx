// /frontend/src/components/shared/ClientSearchInput/ClientSearchInput.tsx
//
// Barre de recherche de client avec dropdown + badge sélectionné.
// Auto-contenu : charge la liste des clients, gère l'état interne.
// Utilise exclusivement des CSS variables → s'adapte à tous les thèmes.
//
// Usage :
//   <ClientSearchInput
//     selected={clientSelected}
//     onSelect={(client) => handleClientSelect(client)}
//     onClear={() => handleClearClient()}
//   />

import React, { useState, useEffect, useRef } from 'react';
import { fetchClients } from '../../../services/api';
import { Search, X } from '../../../utils/icons';
import './ClientSearchInput.css';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE — réexporté pour les composants parents
// ─────────────────────────────────────────────────────────────────────────────

export interface ClientLite {
  id:         number;
  nom:        string;
  prenom:     string;
  telephone:  string;
  email?:     string;
  adresse?:   string;
}

interface Props {
  /** Client actuellement sélectionné (null = aucun) */
  selected:    ClientLite | null;
  /** Appelé quand l'utilisateur choisit un client dans la liste */
  onSelect:    (client: ClientLite) => void;
  /** Appelé quand l'utilisateur clique sur X pour désélectionner */
  onClear:     () => void;
  placeholder?: string;
  /** Classe CSS supplémentaire sur le wrapper racine */
  className?:  string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

const ClientSearchInput: React.FC<Props> = ({
  selected,
  onSelect,
  onClear,
  placeholder = 'Rechercher un client existant...',
  className = '',
}) => {

  const [allClients,   setAllClients]   = useState<ClientLite[]>([]);
  const [search,       setSearch]       = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Chargement unique au montage
  useEffect(() => {
    fetchClients()
      .then((data: any[]) => setAllClients(data as ClientLite[]))
      .catch(() => {});
  }, []);

  // Fermeture au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Réinitialise la recherche si le parent efface la sélection
  useEffect(() => {
    if (!selected) setSearch('');
  }, [selected]);

  // Filtre : nom complet OU téléphone — max 8 résultats
  const filtered = search.trim().length >= 1
    ? allClients
        .filter(c =>
          `${c.nom} ${c.prenom || ''}`.toLowerCase().includes(search.toLowerCase()) ||
          (c.telephone || '').includes(search)
        )
        .slice(0, 8)
    : [];

  const handleSelect = (client: ClientLite) => {
    setSearch('');
    setShowDropdown(false);
    onSelect(client);
  };

  // ── RENDU ────────────────────────────────────────────────────
  return (
    <div className={`csi-wrapper ${className}`} ref={wrapperRef}>

      {selected ? (
        /* ── Badge client sélectionné ─────────────────────── */
        <div className="csi-badge">
          <span className="csi-badge__info">
            <strong>{selected.nom} {selected.prenom || ''}</strong>
            {selected.telephone && <> · {selected.telephone}</>}
          </span>
          <button
            type="button"
            className="csi-badge__clear"
            onClick={onClear}
            title="Changer de client"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        /* ── Barre de recherche + dropdown ────────────────── */
        <div className="csi-search-zone">
          <div className="csi-search-bar">
            <Search size={13} className="csi-search-bar__icon" />
            <input
              type="text"
              className="csi-search-bar__input"
              placeholder={placeholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => search.trim() && setShowDropdown(true)}
              autoComplete="off"
            />
          </div>

          {showDropdown && filtered.length > 0 && (
            <div className="csi-dropdown">
              {filtered.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className="csi-dropdown__item"
                  onMouseDown={() => handleSelect(c)}
                >
                  <span className="csi-dropdown__nom">{c.nom} {c.prenom || ''}</span>
                  {c.telephone && (
                    <span className="csi-dropdown__tel">{c.telephone}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {showDropdown && search.trim().length >= 2 && filtered.length === 0 && (
            <div className="csi-dropdown csi-dropdown--empty">
              Aucun client trouvé pour « {search} »
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientSearchInput;
