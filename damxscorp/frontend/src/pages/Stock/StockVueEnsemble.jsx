// /frontend/src/pages/Stock/StockVueEnsemble.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus } from '../../utils/icons';
import StockForm from './StockForm';
import './StockVueEnsemble.css';

// ── API stock (create / update / delete) ─────────────────────────────────────
const stockApi = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const fetchPieces    = () => stockApi.get('/stock/pieces/').then(r => r.data);
const createPiece    = (data) => stockApi.post('/stock/pieces/', data).then(r => r.data);
const updatePiece    = (id, data) => stockApi.put(`/stock/pieces/${id}/`, data).then(r => r.data);
const deletePieceApi = (id) => stockApi.delete(`/stock/pieces/${id}/`);

// ─────────────────────────────────────────────────────────────────────────────

const StockVueEnsemble = () => {
    const [pieces,     setPieces]     = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // modalForm : null = fermé | {} = création | {id,...} = édition
    const [modalForm,  setModalForm]  = useState(null);

    // ── Chargement ────────────────────────────────────────────────────────────
    const loadPieces = async () => {
        try {
            setLoading(true);
            setPieces(await fetchPieces());
        } catch (err) {
            setError("Impossible de charger les pièces");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPieces(); }, []);

    // ── Sauvegarde (création ou modification) ─────────────────────────────────
    const handleSave = async (formData) => {
        try {
            if (formData.id) {
                await updatePiece(formData.id, formData);
            } else {
                await createPiece(formData);
            }
            await loadPieces();
        } catch (err) {
            // On remonte l'erreur au StockForm pour qu'il l'affiche
            const msg = err.response?.data
                ? Object.entries(err.response.data)
                    .map(([k, v]) => `${k}: ${v.join ? v.join(', ') : v}`)
                    .join('\n')
                : 'Erreur lors de la sauvegarde';
            throw new Error(msg);
        }
    };

    // ── Suppression ───────────────────────────────────────────────────────────
    const handleDelete = async (id, nom) => {
        if (window.confirm(`Supprimer la pièce "${nom}" ?`)) {
            try {
                await deletePieceApi(id);
                await loadPieces();
            } catch (err) {
                alert('❌ Erreur lors de la suppression');
                console.error(err);
            }
        }
    };

    // ── Filtrage ──────────────────────────────────────────────────────────────
    const filteredPieces = pieces.filter(piece =>
        piece.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        piece.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (piece.fournisseur_nom && piece.fournisseur_nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (piece.fournisseur && piece.fournisseur.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'OK':      return '#27ae60';
            case 'ALERTE':  return '#f39c12';
            case 'RUPTURE': return '#e74c3c';
            default:        return '#95a5a6';
        }
    };

    // ── Rendu états intermédiaires ────────────────────────────────────────────
    if (loading) return (
        <div className="stock-loading">
            <div className="spinner"></div>
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

            {/* STATISTIQUES RAPIDES */}
            <div className="stock-stats">
                <div className="stat-card stat-ok">
                    <div className="stat-value">{pieces.filter(p => p.stock_status === 'OK').length}</div>
                    <div className="stat-label">Stock OK</div>
                </div>
                <div className="stat-card stat-alerte">
                    <div className="stat-value">{pieces.filter(p => p.stock_status === 'ALERTE').length}</div>
                    <div className="stat-label">Alertes</div>
                </div>
                <div className="stat-card stat-rupture">
                    <div className="stat-value">{pieces.filter(p => p.stock_status === 'RUPTURE').length}</div>
                    <div className="stat-label">Ruptures</div>
                </div>
            </div>

            {/* TABLEAU DES PIÈCES */}
            {filteredPieces.length === 0 ? (
                <div className="stock-empty">
                    <p>Aucune pièce trouvée</p>
                </div>
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
                                    <td>
                                        {/* Affiche le nom depuis la fiche fournisseur, sinon le champ texte */}
                                        {piece.fournisseur_nom || piece.fournisseur || '—'}
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="btn-edit"
                                            onClick={() => setModalForm(piece)}
                                            title="Modifier cette pièce"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(piece.id, piece.nom)}
                                            title="Supprimer cette pièce"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL CRÉATION / MODIFICATION */}
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
