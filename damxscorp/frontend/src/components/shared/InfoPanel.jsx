import React from 'react';
import './InfoPanel.css';  // ← Import du CSS dédié

const InfoPanel = ({ event, onDelete, onEdit }) => { //Ajout de onEdit //
    // Si aucun événement sélectionné, afficher le placeholder
    if (!event) {
        return (
            <aside id="info-column">
                <div className="info-card">
                    <h3>📋 Détails du Rendez-vous</h3>
                    <hr />
                    <p className="placeholder-text">
                        👈 Cliquez sur un rendez-vous<br />
                        dans le calendrier pour voir<br />
                        les détails complets
                    </p>
                </div>
            </aside>
        );
    }

    // Extraction des données
    const { 
        id,
        clientName = "Inconnu", 
        clientFirstName = "", 
        clientPhone = "Non renseigné",
        vehicleModel = "Non spécifié", 
        plate = "Aucune", 
        description = "",
        statut = "PLANIFIE",
        departement = "ATELIER"
    } = event;

    // Fonction pour obtenir la classe CSS du statut
    const getStatutClass = (statut) => {
        const statusMap = {
            'PLANIFIE': 'planifie',
            'EN_COURS': 'en-cours',
            'TERMINE': 'termine',
            'ANNULE': 'annule'
        };
        return statusMap[statut] || 'planifie';
    };

    // Fonction pour obtenir le label du statut
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
        <aside id="info-column">
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
                            {departement === 'ATELIER' ? '🔧 Atelier (Mécanique)' : '🎓 Académie (Cours)'}
                        </span>
                    </div>
                </div>

                {/* INFORMATIONS CLIENT */}
                <div className="detail-section">
                    <h4>👤 Client</h4>
                    <div className="detail-row">
                        <strong>Nom :</strong>
                        <span>{clientName} {clientFirstName}</span>
                    </div>
                    <div className="detail-row">
                        <strong>Téléphone :</strong>
                        <span>{clientPhone}</span>
                    </div>
                </div>

                {/* INFORMATIONS VÉHICULE (si ATELIER) */}
                {departement === 'ATELIER' && (
                    <div className="detail-section">
                        <h4>🚗 Véhicule</h4>
                        <div className="detail-row">
                            <strong>Modèle :</strong>
                            <span>{vehicleModel}</span>
                        </div>
                        <div className="detail-row">
                            <strong>Plaque :</strong>
                            <span style={{fontWeight: 'bold', color: 'var(--accent)'}}>{plate}</span>
                        </div>
                    </div>
                )}

                {/* DESCRIPTION / TRAVAUX */}
                <div className="detail-section">
                    <h4>📝 {departement === 'ATELIER' ? 'Travaux à effectuer' : 'Description du cours'}</h4>
                    <div className="description-box">
                        {description || <em style={{color: '#666'}}>Pas de description</em>}
                    </div>
                </div>

                {/* BOUTONS D'ACTION */}
                <div className="action-buttons">
                    <button 
                        className="btn-modify"
                        onClick={onEdit} // Appelle la fonction onEdit passée en props //
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
        </aside>
    );
};

export default InfoPanel;