// /src/pages/Planning/Planning.jsx
import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import InfoPanel from '../../components/shared/InfoPanel';
import ModalForm from '../../components/shared/ModalForm';
import FloatingMenu from '../../components/layout/FloatingMenu';
import { 
  fetchInterventions, 
  saveIntervention, 
  updateIntervention, 
  deleteIntervention 
} from '../../services/api';
import './Planning.css';

const Planning = () => {
  // États pour les événements du planning
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // États pour la modal de création/édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // Chargement des interventions depuis l'API
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

  // Chargement initial
  useEffect(() => {
    loadData();
  }, []);

  // Gestion de la soumission du formulaire (création ou modification)
  const handleFormSubmit = async (data) => {
    try {
      if (editingEvent) {
        // Modification d'un événement existant
        console.log("Modification du RDV :", data);
        await updateIntervention(editingEvent.id, data);
        alert('✅ Rendez-vous modifié avec succès !');
      } else {
        // Création d'un nouveau rendez-vous
        console.log("Création d'un nouveau RDV avec :", data);
        await saveIntervention(data);
        alert('✅ Rendez-vous créé avec succès !');
      }
      
      // Fermer la modal et recharger les données
      setIsModalOpen(false);
      setEditingEvent(null);
      await loadData();
    } catch (err) {
      alert('❌ Erreur lors de l\'enregistrement');
      console.error(err);
    }
  };

  // Gestion de la suppression d'un événement
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

  // Gestion du clic sur un événement du calendrier
  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  // Gestion de l'ouverture de la modal en mode édition
  const handleEdit = (event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  // Affichage du chargement
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
      />

      {/* PANNEAU D'INFORMATION (détails d'un événement) */}
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
          }}
          initialData={editingEvent}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* BOUTON FLOTTANT POUR AJOUTER UN RDV */}
      <FloatingMenu onAddClick={() => setIsModalOpen(true)} />
    </div>
  );
};

export default Planning;