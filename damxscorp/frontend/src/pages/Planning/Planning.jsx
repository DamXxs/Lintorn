// /src/pages/Planning/Planning.jsx
import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import InfoPanel from '../../components/shared/InfoPanel';
import ModalForm from '../../components/shared/ModalForm';
import logger from '../../utils/logger';
import { formatInterventionForDjango, formatInterventionForReact } from '../../utils/dataFormatters';
import { 
  fetchInterventions, 
  saveIntervention, 
  updateIntervention, 
  deleteIntervention 
} from '../../services/api';
import './Planning.css';

const Planning = ({ IsSidebarExpend }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [prefilledDate, setPrefilledDate] = useState(null);

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

// ========================================================================
// CONVERSION DES DONNÉES DANS dataFormatters.js
// ========================================================================

  // Soumission du formulaire
  const handleFormSubmit = async (formData) => {
    try {
      console.log("📥 Données brutes du formulaire:", formData);
      
      // Foormatage centraliser dans dataFormatters.js
      const djangoData = formatInterventionForDjango(formData);
      
      if (editingEvent) {
        await updateIntervention(editingEvent.id, djangoData);
        logger.success('Rendez-vous modifié avec succès !')
        alert('✅ Rendez-vous modifié avec succès !');
      } else {
        await saveIntervention(djangoData);
        logger.success('Rendez-vous créé avec succès !')
        alert('✅ Rendez-vous créé avec succès !');
      }

      setIsModalOpen(false);
      setEditingEvent(null);
      setPrefilledDate(null);
      await loadData();
    } catch (err) {
      logger.error('Erreur lors de l\'enregistrement', err);
      alert(`❌ ${err.message}`);
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

  // ✅ NOUVEAU : Double-clic sur un événement
  const handleEventDoubleClick = (event) => {
    // Formater les données Django pour React avant de les passer au formulaire
    const formattedEvent = formatInterventionForReact(event);
    setEditingEvent(formattedEvent);
    setPrefilledDate(null);
    setIsModalOpen(true);
  };

  // Clic sur une case vide (heure libre)
  const handleDateClick = (date) => {
    setPrefilledDate(date);
    setIsModalOpen(true);
  };

  // Bouton "Nouveau RDV" dans le header
  const handleNewRdvClick = () => {
    setPrefilledDate(null);
    setIsModalOpen(true);
  };

  // Édition d'un événement (depuis InfoPanel)
  const handleEdit = (event) => {
    // Formater les données Django pour React avant de les passer au formulaire
    const formattedEvent = formatInterventionForReact(event);
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
    <div className={`planning-page ${selectedEvent ? 'planning-page-infopanel-open' : ''}`}>
      <Calendar 
        events={events}
        onEventClick={handleEventClick}
        onEventDoubleClick={handleEventDoubleClick}
        onDateClick={handleDateClick}
        onNewRdvClick={handleNewRdvClick}
        IsSidebarExpend={IsSidebarExpend}
      />

       {/* ✅ INFOPANEL (30%) - Reste dans le DOM mais caché */}
      <InfoPanel
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={() => handleEdit(selectedEvent)}
        onDelete={() => handleDelete(selectedEvent.id)}
      />

      {/* MODAL */}
      {isModalOpen && (
        <ModalForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEvent(null);
            setPrefilledDate(null);
          }}
          initialData={editingEvent}
          prefilledDate={prefilledDate}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
};

export default Planning;