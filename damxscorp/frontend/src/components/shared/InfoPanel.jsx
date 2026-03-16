// /frontend/src/components/shared/InfoPanel.jsx
import React from 'react';
import { getDepartementLabel, getDepartementDescription, getStatutLabel, getStatutClass } from '../../utils/constants';
import { CalendarClock, Tag, User, Car, FileText, Pencil, Trash2, X } from '../../utils/icons';
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

    return (
        <aside id="info-column" className={isVisible ? 'visible' : ''}>
            {isVisible && (
                <>
                    <button 
                        className="info-panel__close" 
                        onClick={onClose}
                    >
                        <X size={16} />
                    </button>
                    
                    <div className="info-card">
                        <h3><CalendarClock size={15} /> Détails du Rendez-vous</h3>
                        <hr />
                        
                        {/* STATUT - Utilise les constantes */}
                        <div style={{marginBottom: '20px'}}>
                            <span className={`status-badge ${getStatutClass(statut)}`}>
                                {getStatutLabel(statut)}
                            </span>
                        </div>

                        {/* TYPE DE RDV - Utilise les constantes */}
                        <div className="detail-section">
                            <h4><Tag size={13} /> Type</h4>
                            <div className="detail-row">
                                <span style={{fontSize: '14px'}}>
                                    {getDepartementLabel(type_rdv)} ({getDepartementDescription(type_rdv)})
                                </span>
                            </div>
                        </div>

                        {/* INFORMATIONS CLIENT */}
                        <div className="detail-section">
                            <h4><User size={13} /> Client</h4>
                            <div className="detail-row">
                                <strong>Nom :</strong>
                                <span>{client_nom} {client_prenom}</span>
                            </div>
                        </div>

                        {/* INFORMATIONS VÉHICULE (si ATELIER) */}
                        {type_rdv === 'ATELIER' && vehicule_modele && (
                            <div className="detail-section">
                                <h4><Car size={13} /> Véhicule</h4>
                                <div className="detail-row">
                                    <strong>Modèle :</strong>
                                    <span>{vehicule_modele}</span>
                                </div>
                            </div>
                        )}

                        {/* DESCRIPTION / TRAVAUX */}
                        <div className="detail-section">
                            <h4><FileText size={13} /> {type_rdv === 'ATELIER' ? 'Travaux à effectuer' : 'Description du cours'}</h4>
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
                                <Pencil size={14} /> Modifier
                            </button>
                            <button 
                                className="btn-delete"
                                onClick={() => {
                                    if (window.confirm('Supprimer ce rendez-vous ?')) {
                                        onDelete(id);
                                    }
                                }}
                            >
                                <Trash2 size={14} /> Supprimer
                            </button>
                        </div>
                    </div>
                </>
            )}
        </aside>
    );
};

export default InfoPanel;