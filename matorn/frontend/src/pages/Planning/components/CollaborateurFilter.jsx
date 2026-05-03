// /frontend/src/pages/Planning/components/CollaborateurFilter.jsx
import React from 'react';
import { Users } from '../../../utils/icons';
import './CollaborateurFilter.css';

/**
 * 🧑‍🔧 Barre de filtre par collaborateur
 *
 * Affiche un chip "Tous" + un chip par collaborateur.
 * Cliquer un chip filtre le calendrier pour n'afficher que ses interventions.
 * Cliquer "Tous" réinitialise le filtre.
 *
 * Props :
 *   collaborateurs    : [{id, nom, couleur}]
 *   selectedIds       : [id] — IDs actifs ([] = tous)
 *   onToggle(id)      : bascule un collaborateur on/off
 *   onSelectAll()     : réinitialise le filtre (tout afficher)
 */
const CollaborateurFilter = ({ collaborateurs, selectedIds, onToggle, onSelectAll }) => {

  // Pas de collaborateurs = on n'affiche rien
  if (!collaborateurs || collaborateurs.length === 0) return null;

  const allSelected = selectedIds.length === 0;

  // Génère les initiales depuis le nom complet (ex: "Jean Dupont" → "JD")
  const getInitiales = (nom) => {
    return nom
      .split(' ')
      .filter(Boolean)
      .map(w => w[0].toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div className="collab-filter">
      <span className="collab-filter__label">
        <Users size={13} /> Filtrer :
      </span>

      {/* Chip "Tous" */}
      <button
        className={`collab-filter__chip collab-filter__chip--all ${allSelected ? 'collab-filter__chip--active-all' : ''}`}
        onClick={onSelectAll}
        title="Afficher tous les collaborateurs"
      >
        Tous
      </button>

      {/* Un chip par collaborateur */}
      {collaborateurs.map(c => {
        const isActive = selectedIds.includes(c.id);
        return (
          <button
            key={c.id}
            className={`collab-filter__chip ${isActive ? 'collab-filter__chip--active' : ''}`}
            style={isActive ? { borderColor: c.couleur, color: c.couleur } : {}}
            onClick={() => onToggle(c.id)}
            title={`Filtrer : ${c.nom}`}
          >
            {/* Avatar couleur */}
            <span
              className="collab-filter__avatar"
              style={{ background: c.couleur }}
            >
              {getInitiales(c.nom)}
            </span>
            {c.nom}
          </button>
        );
      })}
    </div>
  );
};

export default CollaborateurFilter;
