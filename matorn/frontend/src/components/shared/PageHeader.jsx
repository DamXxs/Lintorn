// /frontend/src/components/shared/PageHeader.jsx
import React from 'react';
import './shared.css';

/**
 * 🏷️ Composant PageHeader
 *
 * En-tête standardisé pour toutes les pages listes.
 * Structure : [Titre + compteur] — [Bouton d'ajout]
 *
 * Utilisation :
 *   <PageHeader
 *     title="Clients"
 *     count={filtered.length}
 *     countLabel="client"
 *     onAdd={() => setIsFormOpen(true)}
 *     addLabel="Nouveau client"
 *     addIcon={<UserPlus size={16} />}
 *   />
 *
 * Props :
 *   title      : string    — titre de la page (ex: "Clients")
 *   count      : number    — nombre d'éléments affichés (optionnel)
 *   countLabel : string    — mot à accorder (ex: "client" → "2 clients")
 *   onAdd      : function  — action du bouton d'ajout (optionnel)
 *   addLabel   : string    — texte du bouton (ex: "Nouveau client")
 *   addIcon    : ReactNode — icône du bouton (optionnel)
 */
const PageHeader = ({ title, count, countLabel, onAdd, addLabel, addIcon }) => (
  <div className="page-header">

    {/* Partie gauche : titre + compteur */}
    <div className="page-header__left">
      <h1 className="page-header__title">{title}</h1>
      {count !== undefined && countLabel && (
        <span className="page-header__count">
          {count} {countLabel}{count > 1 ? 's' : ''}
        </span>
      )}
    </div>

    {/* Bouton d'ajout (optionnel) */}
    {onAdd && (
      <button className="page-header__btn-add" onClick={onAdd}>
        {addIcon}
        {addLabel}
      </button>
    )}

  </div>
);

export default PageHeader;
