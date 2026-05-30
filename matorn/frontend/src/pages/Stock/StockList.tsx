// /frontend/src/pages/Stock/StockList.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Piece } from '../../services/api';
import { getAllPieces, searchPieces, addPiece, editPiece, removePiece, getStockStats } from './stockService';
import { Package, Plus, Pencil, Trash2 } from '../../utils/icons';
import PageHeader   from '../../components/shared/PageHeader';
import SearchBar    from '../../components/shared/SearchBar/SearchBar';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import StockForm    from './StockForm';
import ConfirmModal from '../../components/shared/ConfirmModal/ConfirmModal';
import './StockList.css';
import '../../components/shared/list-page.css';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type StatusFilter = 'ALERTE' | 'RUPTURE' | null;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getStatutDotClass = (statut: Piece['stock_status']): string => ({
  OK:      'stock-statut__dot--ok',
  ALERTE:  'stock-statut__dot--alerte',
  RUPTURE: 'stock-statut__dot--rupture',
}[statut] ?? 'stock-statut__dot--ok');

const getStatutLabel = (statut: Piece['stock_status']): string => ({
  OK:      'OK',
  ALERTE:  'Alerte stock',
  RUPTURE: 'Rupture stock',
}[statut] ?? statut);

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

const StockList: React.FC = () => {

  const [pieces,       setPieces]       = useState<Piece[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);

  // null = fermé | {} = création | Piece = édition
  const [modalForm,  setModalForm]  = useState<Piece | Record<string, never> | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [confirmSuppr, setConfirmSuppr] = useState(false);
  const [pieceToDelete, setPieceToDelete] = useState<Piece | null>(null);
  const menuRef = useRef<HTMLTableDataCellElement>(null);

  // Ferme le menu au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  // ── Sauvegarde ───────────────────────────────────────────────
  const handleSave = async (formData: any) => {
    if (formData.id) {
      await editPiece(formData.id, formData);
    } else {
      await addPiece(formData);
    }
    setModalForm(null);
    await loadPieces();
  };

  // ── Suppression ──────────────────────────────────────────────
  const handleDelete = (piece: Piece) => {
    setMenuOpenId(null);

    if (piece.stock_actuel > 0) {
      alert(`⚠️ Impossible de supprimer "${piece.nom}" : il reste ${piece.stock_actuel} unité(s) en stock.`);
      return;
    }
    setPieceToDelete(piece);
    setConfirmSuppr(true);
  };

  const doSupprimer = async () => {
    if (!pieceToDelete) return;
    setConfirmSuppr(false);
    try {
      await removePiece(pieceToDelete.id);
      await loadPieces();
    } catch {
      alert('❌ Erreur lors de la suppression');
    } finally {
      setPieceToDelete(null);
    }
  };

  // ── Toggle filtre statut ─────────────────────────────────────
  const toggleStatusFilter = (status: 'ALERTE' | 'RUPTURE') => {
    setStatusFilter(prev => prev === status ? null : status);
  };

  // ── Données filtrées (texte + statut) ───────────────────────
  const bySearch = searchPieces(pieces, searchTerm) as Piece[];
  const filteredPieces = statusFilter
    ? bySearch.filter(p => p.stock_status === statusFilter)
    : bySearch;

  const stats = getStockStats(pieces) as { ok: number; alerte: number; rupture: number };

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

      {/* ── BADGES FILTRE ─────────────────────────────────────── */}
      <div className="stock-filter-chips">

        <button
          className={`stock-filter-chip stock-filter-chip--alerte${statusFilter === 'ALERTE' ? ' active' : ''}`}
          onClick={() => toggleStatusFilter('ALERTE')}
          title="Filtrer les pièces en alerte"
        >
          <span className="stock-filter-chip__dot" />
          <span className="stock-filter-chip__count">{stats.alerte}</span>
          <span className="stock-filter-chip__label">Alerte</span>
          {statusFilter === 'ALERTE' && <span className="stock-filter-chip__clear">×</span>}
        </button>

        <button
          className={`stock-filter-chip stock-filter-chip--rupture${statusFilter === 'RUPTURE' ? ' active' : ''}`}
          onClick={() => toggleStatusFilter('RUPTURE')}
          title="Filtrer les pièces en rupture"
        >
          <span className="stock-filter-chip__dot" />
          <span className="stock-filter-chip__count">{stats.rupture}</span>
          <span className="stock-filter-chip__label">Rupture</span>
          {statusFilter === 'RUPTURE' && <span className="stock-filter-chip__clear">×</span>}
        </button>

        {/* Indication du filtre actif */}
        {statusFilter && (
          <span className="stock-filter-info">
            {filteredPieces.length} pièce{filteredPieces.length > 1 ? 's' : ''} affichée{filteredPieces.length > 1 ? 's' : ''}
            <button className="stock-filter-reset" onClick={() => setStatusFilter(null)}>
              Tout afficher
            </button>
          </span>
        )}
      </div>

      {/* ── TABLEAU ───────────────────────────────────────────── */}
      {filteredPieces.length === 0 ? (
        <div className="stock-empty">
          <Package size={32} />
          <p>
            {statusFilter
              ? `Aucune pièce en ${statusFilter.toLowerCase()}`
              : 'Aucune pièce trouvée'}
          </p>
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
                <th className="stock-col--center">Stock</th>
                <th className="stock-col--center">Statut</th>
                <th className="stock-col--center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPieces.map(piece => (
                <tr key={piece.id} onClick={() => setModalForm(piece)}>
                  <td className="stock-cell--ref">{piece.reference}</td>
                  <td className="stock-cell--nom">{piece.nom}</td>
                  <td className="stock-col--categorie">{piece.categorie || '—'}</td>
                  <td className="stock-col--fournisseur">{piece.fournisseur_nom || '—'}</td>
                  <td className="stock-cell--stock stock-col--center">{piece.stock_actuel}</td>
                  <td className="stock-col--center">
                    <div className="stock-statut">
                      <div className={`stock-statut__dot ${getStatutDotClass(piece.stock_status)}`} />
                      <div className="stock-statut__tooltip">{getStatutLabel(piece.stock_status)}</div>
                    </div>
                  </td>
                  <td
                    className="stock-cell--actions"
                    onClick={e => e.stopPropagation()}
                    ref={menuOpenId === piece.id ? menuRef : null}
                  >
                    <div className="stock-action-wrap">
                      <button
                        className="stock-action-trigger"
                        onClick={() => setMenuOpenId(menuOpenId === piece.id ? null : piece.id)}
                        title="Actions"
                      >⋯</button>

                      {menuOpenId === piece.id && (
                        <div className="stock-action-menu">
                          <button
                            className="stock-action-item"
                            onClick={() => { setMenuOpenId(null); setModalForm(piece); }}
                          >
                            <Pencil size={12} /> Modifier
                          </button>
                          <button
                            className="stock-action-item stock-action-item--danger"
                            onClick={() => handleDelete(piece)}
                          >
                            <Trash2 size={12} /> Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL FORMULAIRE ──────────────────────────────────── */}
      {modalForm !== null && (
        <StockForm
          piece={'id' in modalForm ? modalForm as Piece : null}
          onSave={handleSave}
          onClose={() => setModalForm(null)}
        />
      )}

      <ConfirmModal
        isOpen={confirmSuppr}
        title="Supprimer cette pièce ?"
        message="Il reste 0 unité en stock. Cette action est irréversible."
        variant="danger"
        labelConfirm="Supprimer"
        onConfirm={doSupprimer}
        onCancel={() => { setConfirmSuppr(false); setPieceToDelete(null); }}
      />

    </div>
  );
};

export default StockList;
