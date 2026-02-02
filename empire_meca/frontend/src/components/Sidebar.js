import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ currentView, onViewChange, onNewRdv }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);  // ← État ouvert/fermé
    
    const isActive = (view) => currentView === view;
    
    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* BOUTON HAMBURGER */}
            <button 
                className="sidebar-toggle"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
            >
                {isCollapsed ? '☰' : '✕'}
            </button>
            
            {/* EN-TÊTE */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    🔧 EMPIRE MÉCA
                </div>
            </div>
            
            {/* NAVIGATION */}
            <nav className="sidebar-nav">
                
                {/* SECTION PRINCIPAL */}
                <div className="nav-section">
                    {!isCollapsed && <div className="nav-section-title">Principal</div>}
                    
                    <div 
                        className={`nav-item ${isActive('dashboard') ? 'active' : ''}`}
                        onClick={() => onViewChange('dashboard')}
                        title="Tableau de bord"
                    >
                        <span className="nav-item-icon">🏠</span>
                        <span className="nav-item-text">Tableau de bord</span>
                    </div>
                </div>
                
                {/* SECTION PLANNING */}
                <div className="nav-section">
                    {!isCollapsed && <div className="nav-section-title">Planning</div>}
                    
                    <div 
                        className={`nav-item ${isActive('planning-tous') ? 'active' : ''}`}
                        onClick={() => onViewChange('planning-tous')}
                        title="Tous les RDV"
                    >
                        <span className="nav-item-icon">📅</span>
                        <span className="nav-item-text">Tous les RDV</span>
                    </div>
                    
                    <div 
                        className={`nav-item nav-subitem ${isActive('planning-atelier') ? 'active' : ''}`}
                        onClick={() => onViewChange('planning-atelier')}
                        title="Atelier"
                    >
                        <span className="nav-item-icon">🔧</span>
                        <span className="nav-item-text">Atelier</span>
                    </div>
                    
                    <div 
                        className={`nav-item nav-subitem ${isActive('planning-academie') ? 'active' : ''}`}
                        onClick={() => onViewChange('planning-academie')}
                        title="Académie"
                    >
                        <span className="nav-item-icon">🎓</span>
                        <span className="nav-item-text">Académie</span>
                    </div>
                </div>
                
                {/* SECTION GESTION */}
                <div className="nav-section">
                    {!isCollapsed && <div className="nav-section-title">Gestion</div>}
                    
                    <div 
                        className={`nav-item ${isActive('clients') ? 'active' : ''}`}
                        onClick={() => onViewChange('clients')}
                        title="Clients"
                    >
                        <span className="nav-item-icon">👥</span>
                        <span className="nav-item-text">Clients</span>
                    </div>
                    
                    <div 
                        className={`nav-item ${isActive('vehicules') ? 'active' : ''}`}
                        onClick={() => onViewChange('vehicules')}
                        title="Véhicules"
                    >
                        <span className="nav-item-icon">🚗</span>
                        <span className="nav-item-text">Véhicules</span>
                    </div>
                </div>

                {/* SECTION STOCK */}
                <div className="nav-section">
                    {!isCollapsed && <div className="nav-section-title">Stock</div>}
    
                    <div 
                        className={`nav-item ${isActive('stock-vue-ensemble') ? 'active' : ''}`}
                        onClick={() => onViewChange('stock-vue-ensemble')}
                        title="Vue d'ensemble"
                    >
                        <span className="nav-item-icon">📊</span>
                        <span className="nav-item-text">Vue d'ensemble</span>
                </div>
    
                 <div 
                    className={`nav-item nav-subitem ${isActive('stock-magasin') ? 'active' : ''}`}
                    onClick={() => onViewChange('stock-magasin')}
                    title="Stock Magasin"
                >
                    <span className="nav-item-icon">🏪</span>
                    <span className="nav-item-text">Stock Magasin</span>
                </div>
    
                <div 
                    className={`nav-item nav-subitem ${isActive('stock-commande') ? 'active' : ''}`}
                    onClick={() => onViewChange('stock-commande')}
                    title="Stock Commandé"
                >
                        <span className="nav-item-icon">📦</span>
                        <span className="nav-item-text">Stock Commandé</span>
                </div>
    
                <div 
                    className={`nav-item nav-subitem ${isActive('stock-alertes') ? 'active' : ''}`}
                    onClick={() => onViewChange('stock-alertes')}
                    title="Alertes Stock"
                >
                        <span className="nav-item-icon">⚠️</span>
                        <span className="nav-item-text">Alertes Stock</span>
                    </div>
                </div>
                
                {/* SECTION FACTURATION */}
                <div className="nav-section">
                    {!isCollapsed && <div className="nav-section-title">Facturation</div>}
                    
                    <div 
                        className={`nav-item ${isActive('factures') ? 'active' : ''}`}
                        onClick={() => onViewChange('factures')}
                        title="Factures"
                    >
                        <span className="nav-item-icon">💰</span>
                        <span className="nav-item-text">Factures</span>
                    </div>
                    
                    <div 
                        className={`nav-item ${isActive('devis') ? 'active' : ''}`}
                        onClick={() => onViewChange('devis')}
                        title="Devis"
                    >
                        <span className="nav-item-icon">📄</span>
                        <span className="nav-item-text">Devis</span>
                    </div>
                </div>
                
                {/* SECTION PARAMÈTRES */}
                <div className="nav-section">
                    {!isCollapsed && <div className="nav-section-title">Système</div>}
                    
                    <div 
                        className={`nav-item ${isActive('parametres') ? 'active' : ''}`}
                        onClick={() => onViewChange('parametres')}
                        title="Paramètres"
                    >
                        <span className="nav-item-icon">⚙️</span>
                        <span className="nav-item-text">Paramètres</span>
                    </div>
                </div>
            </nav>
            
            {/* BOUTON ACTION */}
            <div className="sidebar-action">
                <button 
                    className="btn-new-rdv" 
                    onClick={onNewRdv}
                    title="Nouveau RDV"
                >
                    <span>➕</span>
                    <span>Nouveau RDV</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;