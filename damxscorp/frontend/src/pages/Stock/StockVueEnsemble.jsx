import React, { useState, useEffect } from 'react';
import { fetchPieces, deletePiece } from '../../services/api';
import { Package, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import './StockVueEnsemble.css';


const StockVueEnsemble = () => {
    const [pieces, setPieces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Chargement des pièces
    const loadPieces = async () => {
        try {
            setLoading(true);
            const data = await fetchPieces();
            setPieces(data);
        } catch (err) {
            setError("Impossible de charger les pièces");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPieces();
    }, []);

    // Suppression d'une pièce
    const handleDelete = async (id, nom) => {
        if (window.confirm(`Supprimer la pièce "${nom}" ?`)) {
            try {
                await deletePiece(id);
                await loadPieces();
                alert('✅ Pièce supprimée !');
            } catch (err) {
                alert('❌ Erreur lors de la suppression');
                console.error(err);
            }
        }
    };

    // Filtrage des pièces
    const filteredPieces = pieces.filter(piece =>
        piece.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        piece.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (piece.fournisseur && piece.fournisseur.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Fonction pour obtenir la couleur du badge de statut
    const getStatusColor = (status) => {
        switch(status) {
            case 'OK': return '#27ae60';
            case 'ALERTE': return '#f39c12';
            case 'RUPTURE': return '#e74c3c';
            default: return '#95a5a6';
        }
    };

    if (loading) {
        return (
            <div className="stock-loading">
                <div className="spinner"></div>
                <p>Chargement du stock...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stock-error">
                <p>❌ {error}</p>
                <button onClick={loadPieces}>Réessayer</button>
            </div>
        );
    }

    return (
        <div className="stock-vue-ensemble">
            {/* EN-TÊTE */}
            <div className="stock-header">
                <div>
                    <h1><Package size={24} /> Stock — Vue d'ensemble</h1>
                    <p className="stock-subtitle">{pieces.length} pièces en stock</p>
                </div>
                <button className="btn-add-piece">
                    <Plus size={16} /> Nouvelle pièce
                </button>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="stock-search">
                <input
                    type="text"
                    placeholder="🔍 Rechercher par nom, référence ou fournisseur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* STATISTIQUES RAPIDES */}
            <div className="stock-stats">
                <div className="stat-card stat-ok">
                    <div className="stat-value">
                        {pieces.filter(p => p.stock_status === 'OK').length}
                    </div>
                    <div className="stat-label">Stock OK</div>
                </div>
                <div className="stat-card stat-alerte">
                    <div className="stat-value">
                        {pieces.filter(p => p.stock_status === 'ALERTE').length}
                    </div>
                    <div className="stat-label">Alertes</div>
                </div>
                <div className="stat-card stat-rupture">
                    <div className="stat-value">
                        {pieces.filter(p => p.stock_status === 'RUPTURE').length}
                    </div>
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
                                    <td className="prix-cell">{parseFloat(piece.prix_achat).toFixed(2)}€</td>
                                    <td className="prix-cell">{parseFloat(piece.prix_vente).toFixed(2)}€</td>
                                    <td className="marge-cell">
                                        +{parseFloat(piece.marge).toFixed(2)}€
                                    </td>
                                    <td>{piece.fournisseur || '-'}</td>
                                    <td className="actions-cell">
                                        <button 
                                            className="btn-edit"
                                            onClick={() => alert('Modification à venir')}
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="btn-delete"
                                            onClick={() => handleDelete(piece.id, piece.nom)}
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
        </div>
    );
};

export default StockVueEnsemble;