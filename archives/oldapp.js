import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import InfoPanel from './components/InfoPanel';
import ModalForm from './components/ModalForm';
import FloatingMenu from './components/FloatingMenu';
import { fetchInterventions, saveIntervention, deleteIntervention } from './services/api';
import './index.css';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [formData, setFormData] = useState({
    departement: 'ATELIER',
    clientName: '',
    clientFirstName: '',
    clientPhone: '',
    clientEmail: '',
    plate: '',
    vehicleBrand: '',
    vehicleModel: '',
    date: '',
    time: '08:00',
    description: ''
  });

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

  // Chargement initial
  useEffect(() => { 
    loadData(); 
  }, []);

  // =========================================================================
  // CRÉATION D'UNE INTERVENTION
  // =========================================================================
  const handleFormSubmit = async (data) => {
    try {
      await saveIntervention(data);
      setIsModalOpen(false);
      await loadData();  // Recharge le calendrier
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
        setSelectedEvent(null);  // Ferme le panneau d'infos
        await loadData();  // Recharge le calendrier
        alert('✅ Rendez-vous supprimé !');
      } catch (err) {
        alert('❌ Erreur lors de la suppression : ' + err.message);
        console.error("Erreur suppression:", err);
      }
    }
  };

  // =========================================================================
  // GESTION DU CLIC SUR UN EVENT (CORRIGÉ ICI !)
  // =========================================================================
  const handleEventClick = (eventInfo) => {
    // On récupère TOUT : l'ID + les extendedProps
    const eventData = {
      id: eventInfo.id,  // ← IMPORTANT : L'ID pour pouvoir supprimer !
      ...eventInfo.extendedProps  // Les autres infos (client, véhicule, etc.)
    };
    
    console.log("Event cliqué:", eventData);  // Pour débugger
    setSelectedEvent(eventData);
  };

  // =========================================================================
  // GESTION DU CLIC SUR UNE DATE
  // =========================================================================
  const handleDateClick = (arg) => {
    setFormData({ 
      ...formData, 
      date: arg.dateStr.split('T')[0], 
      time: arg.dateStr.split('T')[1]?.substring(0, 5) || "08:00"
    });
    setIsModalOpen(true);
  };

  // =========================================================================
  // RENDU DE L'APPLICATION
  // =========================================================================
  return (
    <div className="main-layout">
      {/* Bandeau d'erreur si serveur Django injoignable */}
      {error && (
        <div className="error-banner" style={{
          position: 'fixed',
          top: 0,
          left: 0,
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
      
      {/* Écran de chargement */}
      {loading ? (
        <div className="loading-screen" style={{
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
        <>
          {/* Calendrier */}
          <Calendar 
            events={events} 
            onEventClick={handleEventClick}  
            onDateClick={handleDateClick}
          />

          {/* Panneau d'informations */}
          <InfoPanel 
            event={selectedEvent} 
            onDelete={handleDelete} 
          />

          {/* Menu flottant */}
          <FloatingMenu onAddClick={() => setIsModalOpen(true)} />

          {/* Modale de création */}
          {isModalOpen && (
            <ModalForm 
              initialData={formData}
              onClose={() => setIsModalOpen(false)} 
              onSubmit={handleFormSubmit} 
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;