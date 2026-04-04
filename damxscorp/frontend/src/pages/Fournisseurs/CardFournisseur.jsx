// /frontend/src/pages/Fournisseurs/CardFournisseur.jsx
import React from 'react';
import { useReferentiels } from '../../context/ReferentielsContext';
import './CardFournisseur.css';

/**
 * CardFournisseur
 * Affiche les infos d'un fournisseur sous forme de carte.
 * Les catégories viennent des référentiels (configurables dans Paramètres).
 *
 * Props :
 *   fournisseur   – objet fournisseur venant de l'API
 *   onEdit        – fn(fournisseur) → ouvre le modal d'édition
 *   onDelete      – fn(fournisseur) → supprime après confirmation
 *   onToggleFavori– fn(fournisseur) → toggle l'étoile favori
 *   onEmail       – fn(fournisseur) → ouvre le modal email
 */
const CardFournisseur = ({ fournisseur, onEdit, onDelete, onToggleFavori, onEmail }) => {
  const { getCategoriesFournisseur } = useReferentiels();
  const categories = getCategoriesFournisseur();

  // Trouve la catégorie pour afficher l'icône et le libellé
  // Fallback sur le dernier élément (AUTRE) si la catégorie n'est pas trouvée
  const cat = categories.find(c => c.valeur === fournisseur.categorie)
           || categories[categories.length - 1]
           || { valeur: 'AUTRE', label: 'Autre', icone: '📦' };

  return (
    <div className={`card-fournisseur ${fournisseur.est_favori ? 'card-fournisseur--favori' : ''} ${!fournisseur.actif ? 'card-fournisseur--inactif' : ''}`}>

      {/* Badge catégorie — en haut à gauche */}
      <span className="card-cat-badge">
        {cat.icone} {cat.label}
      </span>

      {/* Bouton étoile — en haut à droite */}
      <button
        className={`card-btn-favori ${fournisseur.est_favori ? 'card-btn-favori--actif' : ''}`}
        onClick={() => onToggleFavori(fournisseur)}
        title={fournisseur.est_favori ? 'Retirer des favoris' : 'Mettre en favori'}
      >
        {fournisseur.est_favori ? '⭐' : '☆'}
      </button>

      {/* Infos principales */}
      <div className="card-info">
        <h3 className="card-nom">
          {fournisseur.nom}
          {!fournisseur.actif && <span className="card-badge-inactif"> Inactif</span>}
        </h3>

        {fournisseur.contact_nom && (
          <p className="card-ligne">👤 {fournisseur.contact_nom}</p>
        )}
        <p className="card-ligne card-email">✉️ {fournisseur.email}</p>
        {fournisseur.telephone && (
          <p className="card-ligne">📞 {fournisseur.telephone}</p>
        )}
        {fournisseur.nb_pieces > 0 && (
          <p className="card-ligne card-pieces">
            🔩 {fournisseur.nb_pieces} pièce{fournisseur.nb_pieces > 1 ? 's' : ''} liée{fournisseur.nb_pieces > 1 ? 's' : ''}
          </p>
        )}
        {fournisseur.notes && (
          <p className="card-notes" title={fournisseur.notes}>
            📝 {fournisseur.notes.length > 60 ? fournisseur.notes.slice(0, 60) + '…' : fournisseur.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="card-actions">
        <button
          className="card-btn card-btn--email"
          onClick={() => onEmail(fournisseur)}
          title="Générer l'email de commande"
        >
          📧 Commander
        </button>
        <button
          className="card-btn card-btn--edit"
          onClick={() => onEdit(fournisseur)}
          title="Modifier ce fournisseur"
        >
          ✏️
        </button>
        <button
          className="card-btn card-btn--delete"
          onClick={() => onDelete(fournisseur)}
          title="Supprimer ce fournisseur"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default CardFournisseur;
