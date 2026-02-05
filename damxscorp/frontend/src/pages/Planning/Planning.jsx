// /src/pages/Planning/Planning.jsx
import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import InfoPanel from '../../components/shared/InfoPanel';
import ModalForm from '../../components/shared/ModalForm';
// import FloatingMenu from '../../components/layout/FloatingMenu'; ← ON VIRE
import { 
  fetchInterventions, 
  saveIntervention, 
  updateIntervention, 
  deleteIntervention 
} from '../../services/api';
import './Planning.css';

const Planning = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [prefilledDate, setPrefilledDate] = useState(null); // ← NOUVEAU

  // Chargement des interventions
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInterventions();
      setEvents(data);
    } catch (err) {
      setError("Erreur lors du chargement des données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Soumission du formulaire
  const handleFormSubmit = async (data) => {
    try {
      if (editingEvent) {
        await updateIntervention(editingEvent.id, data);
        alert('✅ Rendez-vous modifié avec succès !');
      } else {
        await saveIntervention(data);
        alert('✅ Rendez-vous créé avec succès !');
      }
      
      setIsModalOpen(false);
      setEditingEvent(null);
      setPrefilledDate(null);
      await loadData();
    } catch (err) {
      alert('❌ Erreur lors de l\'enregistrement');
      console.error(err);
    }
  };

  // Suppression
  const handleDelete = async (id) => {
    if (window.confirm("❓ Supprimer ce rendez-vous ?")) {
      try {
        await deleteIntervention(id);
        setSelectedEvent(null);
        await loadData();
        alert('✅ Rendez-vous supprimé !');
      } catch (err) {
        alert('❌ Erreur lors de la suppression');
        console.error(err);
      }
    }
  };

  // Clic sur un événement existant
  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  // Clic sur une case vide (heure libre)
  const handleDateClick = (date) => {
    setPrefilledDate(date); // On garde la date cliquée
    setIsModalOpen(true);   // On ouvre la modal
  };

  // Bouton "Nouveau RDV" dans le header
  const handleNewRdvClick = () => {
    setPrefilledDate(null); // Pas de date pré-remplie
    setIsModalOpen(true);
  };

  // Édition d'un événement
  const handleEdit = (event) => {
    setEditingEvent(event);
    setPrefilledDate(null);
    setIsModalOpen(true);
  };

  if (loading && events.length === 0) {
    return (
      <div className="planning-loading">
        <div className="spinner"></div>
        <p>⏳ Chargement...</p>
      </div>
    );
  }

  return (
    <div className="planning-page">
      {/* CALENDRIER */}
      <Calendar 
        events={events}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}        // ← NOUVEAU
        onNewRdvClick={handleNewRdvClick}    // ← NOUVEAU
      />

      {/* PANNEAU D'INFO */}
      {selectedEvent && (
        <InfoPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => handleEdit(selectedEvent)}
          onDelete={() => handleDelete(selectedEvent.id)}
        />
      )}

      {/* MODAL DE CRÉATION/MODIFICATION */}
      {isModalOpen && (
        <ModalForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEvent(null);
            setPrefilledDate(null);
          }}
          initialData={editingEvent}
          prefilledDate={prefilledDate}  // ← NOUVEAU : on passe la date cliquée
          onSubmit={handleFormSubmit}
        />
      )}

      {/* FLOATING MENU SUPPRIMÉ */}
    </div>
  );
};

export default Planning;