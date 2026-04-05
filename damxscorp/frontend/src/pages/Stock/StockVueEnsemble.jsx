// /frontend/src/pages/Stock/StockVueEnsemble.jsx
import React, { useState, useEffect } from 'react';
import { getAllPieces, searchPieces, addPiece, editPiece, removePiece, getStockStats } from './stockService';
import { Package, Plus } from '../../utils/icons';
import StockForm from './StockForm';
import './StockVueEnsemble.css';

const StockVueEnsemble = () => {
  const [pieces,     setPieces]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // modalForm : null = fermé | {} = création | {id,...} = édition
  const [modalForm, setModalForm] = useState(null);

  // ── Chargement ───────────────────────────────────────────────
  const loadPieces = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPieces();
      setPieces(data);
    } catch (err) {
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
    await loadPieces();
  };

  // ── Suppression ──────────────────────────────────────────────
  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Supprimer la pièce "${nom}" ?`)) return;
    try {
      await removePiece(id);
      await loadPieces();
    } catch {
      alert('❌ Erreur lors de la suppression');
    }
  };

  // ── Données filtrées et stats ────────────────────────────────
  const filteredPieces = searchPieces(pieces, searchTerm);
  const stats          = getStockStats(pieces);

  const getStatusColor = (status) => {
    const colors = { OK: '#27ae60', ALERTE: '#f39c12', RUPTURE: '#e74c3c' };
    return colors[status] || '#95a5a6';
  };

  // ── États intermédiaires ─────────────────────────────────────
  if (loading) return (
    <div className="stock-loading">
      <div className="spinner" />
      <p>Chargement du stock...</p>
    </div>
  );

  if (error) return (
    <div className="stock-error">
      <p>❌ {error}</p>
      <button onClick={loadPieces}>Réessayer</button>
    </div>
  );

  return (
    <div className="stock-vue-ensemble">

      {/* EN-TÊTE */}
      <div className="stock-header">
        <div>
          <h1><Package size={24} /> Stock — Vue d'ensemble</h1>
          <p className="stock-subtitle">{pieces.length} références en stock</p>
        </div>
        <button className="btn-add-piece" onClick={() => setModalForm({})}>
          <Plus size={16} /> Nouvelle pièce
        </button>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="stock-search">
        <input
          type="text"
          placeholder="🔍 Rechercher par nom, référence ou fournisseur..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* STATISTIQUES */}
      <div className="stock-stats">
        <div className="stat-card stat-ok">
          <div className="stat-value">{stats.ok}</div>
          <div className="stat-label">Stock OK</div>
        </div>
        <div className="stat-card stat-alerte">
          <div className="stat-value">{stats.alerte}</div>
          <div className="stat-label">Alertes</div>
        </div>
        <div className="stat-card stat-rupture">
          <div className="stat-value">{stats.rupture}</div>
          <div className="stat-label">Ruptures</div>
        </div>
      </div>

      {/* TABLEAU */}
      {filteredPieces.length === 0 ? (
        <div className="stock-empty"><p>Aucune pièce trouvée</p></div>
      ) : (
        <div className="stock-table-container">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Stock</th>
                <th>Statut</th>
                <th>Prix Achat</th>
                <th>Prix Vente</th>
                <th>Marge</th>
                <th>Fournisseur</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPieces.map(piece => (
                <tr key={piece.id}>
                  <td className="ref-cell">{piece.reference}</td>
                  <td className="nom-cell">{piece.nom}</td>
                  <td>{piece.categorie}</td>
                  <td className="stock-cell">
                    <span className="stock-actuel">{piece.stock_actuel}</span>
                    {' / '}
                    <span className="stock-minimum">{piece.stock_minimum}</span>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(piece.stock_status) }}
                    >
                      {piece.stock_status}
                    </span>
                  </td>
                  <td className="prix-cell">{parseFloat(piece.prix_achat).toFixed(2)} €</td>
                  <td className="prix-cell">{parseFloat(piece.prix_vente).toFixed(2)} €</td>
                  <td className="marge-cell">+{parseFloat(piece.marge).toFixed(2)} €</td>
                  <td>{piece.fournisseur_nom || '—'}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-edit"
                      onClick={() => setModalForm(piece)}
                      title="Modifier"
                    >✏️</button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(piece.id, piece.nom)}
                      title="Supprimer"
                    >🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
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

export default StockVueEnsemble;