// /frontend/src/components/shared/InfoPanel.jsx
import React from 'react';
import './InfoPanel.css';

const InfoPanel = ({ event, onDelete, onEdit, onClose }) => {
    // ✅ CHANGEMENT : Toujours afficher le conteneur, mais vide si pas d'event
    const isVisible = !!event;

    const { 
        id,
        type_rdv = "ATELIER",
        client_nom = "Inconnu",
        client_prenom = "",
        vehicule_modele = "Non spécifié",
        description = "",
        statut = "PLANIFIE"
    } = event || {};

    const getStatutClass = (statut) => {
        const statusMap = {
            'PLANIFIE': 'planifie',
            'EN_COURS': 'en-cours',
            'TERMINE': 'termine',
            'ANNULE': 'annule'
        };
        return statusMap[statut] || 'planifie';
    };

    const getStatutLabel = (statut) => {
        const labels = {
            'PLANIFIE': '📅 Planifié',
            'EN_COURS': '⚙️ En cours',
            'TERMINE': '✅ Terminé',
            'ANNULE': '❌ Annulé'
        };
        return labels[statut] || statut;
    };

    return (
        <aside id="info-column" className={isVisible ? 'visible' : ''}>
            {isVisible && (
                <>
                    <button 
                        className="info-panel__close" 
                        onClick={onClose}
                    >
                        ✕
                    </button>
                    
                    <div className="info-card">
                        <h3>📋 Détails du Rendez-vous</h3>
                        <hr />
                        
                        {/* STATUT */}
                        <div style={{marginBottom: '20px'}}>
                            <span className={`status-badge ${getStatutClass(statut)}`}>
                                {getStatutLabel(statut)}
                            </span>
                        </div>

                        {/* TYPE DE RDV */}
                        <div className="detail-section">
                            <h4>📌 Type</h4>
                            <div className="detail-row">
                                <span style={{fontSize: '14px'}}>
                                    {type_rdv === 'ATELIER' ? '🔧 Atelier (Mécanique)' : '🎓 Académie (Cours)'}
                                </span>
                            </div>
                        </div>

                        {/* INFORMATIONS CLIENT */}
                        <div className="detail-section">
                            <h4>👤 Client</h4>
                            <div className="detail-row">
                                <strong>Nom :</strong>
                                <span>{client_nom} {client_prenom}</span>
                            </div>
                        </div>

                        {/* INFORMATIONS VÉHICULE (si ATELIER) */}
                        {type_rdv === 'ATELIER' && vehicule_modele && (
                            <div className="detail-section">
                                <h4>🚗 Véhicule</h4>
                                <div className="detail-row">
                                    <strong>Modèle :</strong>
                                    <span>{vehicule_modele}</span>
                                </div>
                            </div>
                        )}

                        {/* DESCRIPTION / TRAVAUX */}
                        <div className="detail-section">
                            <h4>📝 {type_rdv === 'ATELIER' ? 'Travaux à effectuer' : 'Description du cours'}</h4>
                            <div className="description-box">
                                {description || <em style={{color: '#666'}}>Pas de description</em>}
                            </div>
                        </div>

                        {/* BOUTONS D'ACTION */}
                        <div className="action-buttons">
                            <button 
                                className="btn-modify"
                                onClick={onEdit}
                            >
                                ✏️ Modifier
                            </button>
                            <button 
                                className="btn-delete"
                                onClick={() => {
                                    if (window.confirm('🗑️ Supprimer ce rendez-vous ?')) {
                                        onDelete(id);
                                    }
                                }}
                            >
                                🗑️ Supprimer
                            </button>
                        </div>
                    </div>
                </>
            )}
        </aside>
    );
};

export default InfoPanel;