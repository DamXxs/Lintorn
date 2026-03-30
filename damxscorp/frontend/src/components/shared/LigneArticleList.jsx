import React from 'react';
import './LigneArticleList.css';

/**
 * 📋 LigneArticleList — Affichage d'une liste de lignes avec option suppression
 *
 * Props :
 *   lignes            : tableau des lignes à afficher
 *   onDelete(ligneId) : callback appelé quand l'utilisateur clique sur supprimer
 *   readOnly         : booléen — si true, cache le bouton supprimer
 *
 * Affiche :
 *   - Tableau avec colonnes : Description | Pièce | Quantité | Prix unit. | Sous-total | (Actions)
 *   - Bouton 🗑️ supprimer si !readOnly
 *   - Ligne de total HT en bas
 */

const LigneArticleList = ({ lignes = [], onDelete, readOnly = false }) => {
  // Formater un montant en EUR
  const formaterMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(montant);
  };

  // Calculer les totaux
  const totalHT = lignes.reduce((acc, ligne) => {
    return acc + (ligne.prix_unitaire * ligne.quantite);
  }, 0);

  // Si aucune ligne, afficher un message vide
  if (lignes.length === 0) {
    return (
      <div className="ligne-article-list">
        <div className="ligne-article-list__empty">
          <p>Aucune ligne ajoutée pour le moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ligne-article-list">
      <div className="ligne-article-list__wrapper">
        <table className="ligne-article-list__table">
          <thead className="ligne-article-list__thead">
            <tr>
              <th className="ligne-article-list__th ligne-article-list__th--description">
                Description
              </th>
              <th className="ligne-article-list__th ligne-article-list__th--type">
                Type
              </th>
              <th className="ligne-article-list__th ligne-article-list__th--qty">
                Quantité
              </th>
              <th className="ligne-article-list__th ligne-article-list__th--price">
                Prix unit.
              </th>
              <th className="ligne-article-list__th ligne-article-list__th--subtotal">
                Sous-total
              </th>
              {!readOnly && (
                <th className="ligne-article-list__th ligne-article-list__th--actions">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="ligne-article-list__tbody">
            {lignes.map((ligne, index) => (
              <tr
                key={ligne.id || index}
                className={`ligne-article-list__tr ${index % 2 === 0 ? 'even' : 'odd'}`}
              >
                <td className="ligne-article-list__td ligne-article-list__td--description">
                  {ligne.description}
                </td>
                <td className="ligne-article-list__td ligne-article-list__td--type">
                  <span className={`badge badge--${ligne.type}`}>
                    {ligne.type === 'piece' ? '🔧 Pièce' : '🛠️ Service'}
                  </span>
                </td>
                <td className="ligne-article-list__td ligne-article-list__td--qty">
                  {ligne.quantite}
                </td>
                <td className="ligne-article-list__td ligne-article-list__td--price">
                  {formaterMontant(ligne.prix_unitaire)}
                </td>
                <td className="ligne-article-list__td ligne-article-list__td--subtotal">
                  <strong>{formaterMontant(ligne.prix_unitaire * ligne.quantite)}</strong>
                </td>
                {!readOnly && (
                  <td className="ligne-article-list__td ligne-article-list__td--actions">
                    <button
                      type="button"
                      className="ligne-article-list__btn-delete"
                      onClick={() => onDelete(ligne.id || index)}
                      title="Supprimer cette ligne"
                      aria-label="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── LIGNE DE TOTAL HT ─────────────────────────────── */}
      <div className="ligne-article-list__footer">
        <div className="ligne-article-list__total">
          <span className="ligne-article-list__total-label">Total HT :</span>
          <span className="ligne-article-list__total-value">
            {formaterMontant(totalHT)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LigneArticleList;
