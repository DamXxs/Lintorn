// /frontend/src/pages/Stock/StockList.jsx
import React, { useState, useEffect } from 'react';
import { getAllPieces, searchPieces, addPiece, editPiece, removePiece, getStockStats } from './stockService';
import { Package, Plus } from '../../utils/icons';
import PageHeader from '../../components/shared/PageHeader';
import SearchBar from '../../components/shared/SearchBar/SearchBar';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import StockForm from './StockForm';
import './StockList.css';
import '../../components/shared/list-page.css';

/**
 * Retourne la classe CSS du point de statut selon la valeur Django.
 * OK → vert | ALERTE → orange | RUPTURE → rouge
 */
const getStatutDotClass = (statut) => {
  const map = {
    OK:      'stock-statut__dot--ok',
    ALERTE:  'stock-statut__dot--alerte',
    RUPTURE: 'stock-statut__dot--rupture',
  };
  return map[statut] || 'stock-statut__dot--ok';
};

/**
 * Retourne le label lisible du statut pour le tooltip.
 */
const getStatutLabel = (statut) => {
  const map = { OK: 'OK', ALERTE: 'Alerte', RUPTURE: 'Rupture' };
  return map[statut] || statut;
};

const StockList = () => {
  const [pieces,     setPieces]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // null = fermé | {} = création | {id,...} = édition
  const [modalForm, setModalForm] = useState(null);

  // ── Chargement ───────────────────────────────────────────────
  const loadPieces = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPieces();
      setPieces(data);
    } catch {
      setError('Impossible de charger les pièces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPieces(); }, []);

  // ── Sauvegarde (création ou modification) ────────────────────
  const handleSave = async (formData) => {
    if (formData.id) {
      await editPiece(formData.id, formData);
    } else {
      await addPiece(formData);
    }
    setModalForm(null);
    await loadPieces();
  };

  // ── Suppression ──────────────────────────────────────────────
  // Le e.stopPropagation() est IMPORTANT : il empêche le clic sur
  // "Supprimer" d'ouvrir aussi le formulaire d'édition de la ligne.
  const handleDelete = async (e, piece) => {
    e.stopPropagation();

    if (piece.stock_actuel > 0) {
      alert(`⚠️ Impossible de supprimer "${piece.nom}" : il reste ${piece.stock_actuel} unité(s) en stock.`);
      return;
    }

    if (!window.confirm(`🗑️ Supprimer définitivement "${piece.nom}" ?\n\nCette action est irréversible.`)) return;

    try {
      await removePiece(piece.id);
      await loadPieces();
    } catch {
      alert('❌ Erreur lors de la suppression');
    }
  };

  // ── Données filtrées et stats ────────────────────────────────
  const filteredPieces = searchPieces(pieces, searchTerm);
  const stats          = getStockStats(pieces);

  if (loading) return <LoadingState message="Chargement du stock..." />;
  if (error)   return <ErrorState message={error} onRetry={loadPieces} />;

  return (
    <div className="list-page">

      
        <PageHeader
          title={<><Package size={18} /> Stock</>}
          count={pieces.length}
          countLabel="référence"
          onAdd={() => setModalForm({})}
          addLabel="Nouvelle pièce"
          addIcon={<Plus size={16} />}
        />


      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Rechercher par nom, référence, fournisseur..."
      />

      {/* STATS */}
      <div className="stock-stats">
        <div className="stat-card stat-card--ok">
          <div className="stat-card__value">{stats.ok}</div>
          <div className="stat-card__label">Stock OK</div>
        </div>
        <div className="stat-card stat-card--alerte">
          <div className="stat-card__value">{stats.alerte}</div>
          <div className="stat-card__label">Alertes</div>
        </div>
        <div className="stat-card stat-card--rupture">
          <div className="stat-card__value">{stats.rupture}</div>
          <div className="stat-card__label">Ruptures</div>
        </div>
      </div>

      {/* TABLEAU */}
      {filteredPieces.length === 0 ? (
        <div className="stock-empty">
          <Package size={32} />
          <p>Aucune pièce trouvée</p>
        </div>
      ) : (
        <div className="stock-table-container">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Nom</th>
                <th className="stock-col--categorie">Catégorie</th>
                <th className="stock-col--fournisseur">Fournisseur</th>
                <th>Stock</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPieces.map(piece => (
                <tr
                  key={piece.id}
                  onClick={() => setModalForm(piece)}
                >
                  <td className="stock-cell--ref">{piece.reference}</td>
                  <td className="stock-cell--nom">{piece.nom}</td>
                  <td className="stock-col--categorie">{piece.categorie || '—'}</td>
                  <td className="stock-col--fournisseur">{piece.fournisseur_nom || '—'}</td>
                  <td className="stock-cell--stock">{piece.stock_actuel}</td>
                  <td>
                    {/* Point coloré + tooltip au survol */}
                    <div className="stock-statut">
                      <div className={`stock-statut__dot ${getStatutDotClass(piece.stock_status)}`} />
                      <div className="stock-statut__tooltip">
                        {getStatutLabel(piece.stock_status)}
                      </div>
                    </div>
                  </td>
                  <td className="stock-cell--center">
                    <button
                      className="stock-btn-delete"
                      onClick={(e) => handleDelete(e, piece)}
                      title="Supprimer cette pièce"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORMULAIRE */}
      {modalForm !== null && (
        <StockForm
          piece={modalForm?.id ? modalForm : null}
          onSave={handleSave}
          onClose={() => setModalForm(null)}
        />
      )}

    </div>
  );
};

export default StockList;