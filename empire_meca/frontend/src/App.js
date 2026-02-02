import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Calendar from './components/Calendar';
import InfoPanel from './components/InfoPanel';
import ModalForm from './components/ModalForm';
import FloatingMenu from './components/FloatingMenu';  // On garde pour l'instant
import { fetchInterventions, saveIntervention, deleteIntervention } from './services/api';
import './index.css';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentView, setCurrentView] = useState('planning-tous');  // ← NOUVEAU : Vue actuelle
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // =========================================================================
  // CHARGEMENT DES INTERVENTIONS
  // =========================================================================
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInterventions();
      setEvents(data);
    } catch (err) {
      setError("❌ Serveur Django injoignable. Vérifiez qu'il tourne !");
      console.error("Erreur de chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadData(); 
  }, []);

  // =========================================================================
  // CRÉATION D'UNE INTERVENTION
  // =========================================================================
  const handleFormSubmit = async (data) => {
    try {
      console.log("🔍 Données envoyées à Django depuis App.js :", data);
      await saveIntervention(data);
      setIsModalOpen(false);
      await loadData();
      alert('✅ Rendez-vous créé avec succès !');
    } catch (err) {
      alert('❌ Erreur lors de la création : ' + err.message);
      console.error("Erreur création:", err);
    }
  };

  // =========================================================================
  // SUPPRESSION D'UNE INTERVENTION
  // =========================================================================
  const handleDelete = async (id) => {
    if (!id) {
      alert('❌ Impossible de supprimer : ID manquant');
      return;
    }

    if (window.confirm("🗑️ Supprimer ce rendez-vous ?")) {
      try {
        await deleteIntervention(id);
        setSelectedEvent(null);
        await loadData();
        alert('✅ Rendez-vous supprimé !');
      } catch (err) {
        alert('❌ Erreur lors de la suppression : ' + err.message);
        console.error("Erreur suppression:", err);
      }
    }
  };

  // =========================================================================
  // GESTION DU CLIC SUR UN EVENT
  // =========================================================================
  const handleEventClick = (eventData) => {
    console.log("Event cliqué:", eventData);
    setSelectedEvent(eventData);
  };

  // =========================================================================
  // GESTION DU CLIC SUR UNE DATE
  // =========================================================================
  const handleDateClick = (arg) => {
    setIsModalOpen(true);
  };

  // =========================================================================
  // FILTRAGE DES EVENTS SELON LA VUE
  // =========================================================================
  const getFilteredEvents = () => {
    switch(currentView) {
      case 'planning-atelier':
        return events.filter(e => e.extendedProps?.departement === 'ATELIER');
      case 'planning-academie':
        return events.filter(e => e.extendedProps?.departement === 'ACADEMIE');
      case 'planning-tous':
      default:
        return events;
    }
  };

  // =========================================================================
  // RENDU SELON LA VUE ACTUELLE
  // =========================================================================
  const renderContent = () => {
    // Vues planning
    if (currentView.startsWith('planning-')) {
      return (
        <>
          <Calendar 
            events={getFilteredEvents()} 
            onEventClick={handleEventClick}  
            onDateClick={handleDateClick}
          />
          <InfoPanel 
            event={selectedEvent} 
            onDelete={handleDelete} 
          />
        </>
      );
    }
    
    // Autres vues (à venir)
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '24px',
        color: '#666'
      }}>
        🚧 {currentView} - À venir !
      </div>
    );
  };

  // =========================================================================
  // RENDU DE L'APPLICATION
  // =========================================================================
  return (
    <div style={{display: 'flex', height: '100vh'}}>
      {/* SIDEBAR */}
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewRdv={() => setIsModalOpen(true)}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* CONTENU PRINCIPAL (décalé pour laisser la place à la sidebar) */}
      <div style={{
        marginLeft: sidebarCollapsed ? '70px' : '260px',  // S'adapte à la sidebar
        flex: 1,
        overflow: 'auto',
        transition: 'margin-left 0.3s ease'
      }}>
        {error && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: '260px',
            right: 0,
            background: '#e74c3c',
            color: 'white',
            padding: '15px',
            textAlign: 'center',
            zIndex: 10000,
            fontWeight: 'bold'
          }}>
            {error}
          </div>
        )}
        
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '24px',
            color: 'var(--accent)'
          }}>
            ⏳ Chargement...
          </div>
        ) : (
          <div className="main-layout">
            {renderContent()}
          </div>
        )}
      </div>

      {/* MODALE DE CRÉATION */}
      {isModalOpen && (
        <ModalForm 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleFormSubmit} 
        />
      )}
      
      {/* FLOATING MENU (on garde pour l'instant, on virera après) */}
      <FloatingMenu onAddClick={() => setIsModalOpen(true)} />
    </div>
  );
}

export default App;