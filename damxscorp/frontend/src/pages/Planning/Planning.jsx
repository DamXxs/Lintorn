// /frontend/src/pages/Planning/Planning.jsx
import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import ModalRdvConsultation from '../../components/shared/ModalRdvConsultation';
import ModalForm from '../../components/shared/ModalForm';
import logger from '../../utils/logger';
import { formatInterventionForDjango, formatInterventionForReact } from '../../utils/dataFormatters';
import {
  fetchInterventions,
  saveIntervention,
  updateIntervention,
  patchIntervention,
  deleteIntervention
} from '../../services/api';
import './Planning.css';
import { useLocation } from 'react-router-dom';

// =========================================================================
// COULEURS DES ÉVÉNEMENTS selon statut + type
// =========================================================================
const getEventColors = (type_rdv, statut) => {
  if (statut === 'ANNULE')   return { backgroundColor: '#7f8c8d', borderColor: '#95a5a6' }; // Gris
  if (statut === 'TERMINE')  return { backgroundColor: '#27ae60', borderColor: '#2ecc71' }; // Vert
  if (statut === 'EN_COURS') return { backgroundColor: '#e67e22', borderColor: '#f39c12' }; // Orange
  if (type_rdv === 'ACADEMIE') return { backgroundColor: '#8e44ad', borderColor: '#9b59b6' }; // Violet
  return { backgroundColor: '#2980b9', borderColor: '#3498db' }; // Bleu (ATELIER planifié)
};

// =========================================================================
// TRANSFORMATION POUR FULLCALENDAR
// =========================================================================
const formatEventsForCalendar = (interventions) => {
  return interventions.map(intervention => {
    const colors = getEventColors(intervention.type_rdv, intervention.statut);
    return {
      id:              intervention.id,
      title:           intervention.title || `${intervention.client_nom} - ${intervention.type_rdv}`,
      start:           intervention.start || intervention.date_debut,
      end:             intervention.end   || intervention.date_fin,
      backgroundColor: colors.backgroundColor,
      borderColor:     colors.borderColor,
      textColor:       'white',
      extendedProps:   intervention, // Toutes les données Django accessibles au clic
    };
  });
};

// =========================================================================
// COMPOSANT
// =========================================================================
const Planning = ({ isSidebarExpanded }) => {

  const [events, setEvents]               = useState([]);
  const [loading, setLoading]             = useState(false);
  const [consultEvent, setConsultEvent]   = useState(null);
  const [isFormOpen, setIsFormOpen]       = useState(false);
  const [editingEvent, setEditingEvent]   = useState(null);
  const [prefilledDate, setPrefilledDate] = useState(null);
  const [clientPrefill, setClientPrefill] = useState(null); 

  const location = useLocation(); // ← Récupère le state de navigation

  // ── PRÉ-REMPLISSAGE DEPUIS FICHE CLIENT ─────────────────────────
  // Si on arrive depuis ClientDetail avec des données client,
  // on ouvre automatiquement la modal pré-remplie
  useEffect(() => {
    if (location.state?.clientPrefill) {
      setEditingEvent(null);
      setPrefilledDate(null);
      // On stocke les données client pour pré-remplir la modal
      setClientPrefill(location.state.clientPrefill);
      setIsFormOpen(true);

      // On nettoie le state pour éviter de rouvrir la modal
      // si l'utilisateur navigue ailleurs puis revient
      window.history.replaceState({}, '');
    }
}, [location.state]);

  // ── CHARGEMENT ──────────────────────────────────────────────────
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchInterventions();
      setEvents(formatEventsForCalendar(data));
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── CLIC SUR UN ÉVÉNEMENT ────────────────────────────────────────
  // FullCalendar met tout à la racine de l'objet event directement
  const handleEventClick = (event) => {
    setConsultEvent(event);
  };

  // ── CLIC SUR UNE CASE VIDE ───────────────────────────────────────
  const handleDateClick = (date) => {
    setPrefilledDate(date);
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  // ── NOUVEAU RDV ──────────────────────────────────────────────────
  const handleNewRdvClick = () => {
    setPrefilledDate(null);
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  // ── MODIFIER DEPUIS LA CONSULTATION ─────────────────────────────
  const handleEditFromConsult = (event) => {
    setEditingEvent({ ...formatInterventionForReact(event), id: event.id });
    setConsultEvent(null);
    setIsFormOpen(true);
  };

  // ── CHANGEMENT DE STATUT ─────────────────────────────────────────
  const handleStatusChange = async (id, newStatut) => {
    try {
      // On envoie UNIQUEMENT le statut — Django met à jour seulement ce champ
      await patchIntervention(id, { statut: newStatut });
      logger.success(`Statut → ${newStatut}`);

      // Recharge le calendrier avec les nouvelles couleurs
      const data = await fetchInterventions();
      setEvents(formatEventsForCalendar(data));

      // Met à jour la modal avec le nouveau statut
      const updated = data.find(e => String(e.id) === String(id));
      if (updated) setConsultEvent({ ...updated });

    } catch (err) {
      logger.error('Erreur statut', err);
      throw err;
    }
  };

  // ── SUPPRESSION ──────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await deleteIntervention(id);
      setConsultEvent(null);
      await loadData();
    } catch (err) {
      alert('❌ Erreur lors de la suppression');
    }
  };

  // ── SOUMISSION FORMULAIRE ────────────────────────────────────────
  const handleFormSubmit = async (formData) => {
    try {
      const djangoData = formatInterventionForDjango(formData);
      if (editingEvent?.id) {
        await updateIntervention(editingEvent.id, djangoData);
        alert('✅ Rendez-vous modifié !');
      } else {
        await saveIntervention(djangoData);
        alert('✅ Rendez-vous créé !');
      }
      setIsFormOpen(false);
      setEditingEvent(null);
      setPrefilledDate(null);
      await loadData();
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEvent(null);
    setPrefilledDate(null);
    setClientPrefill(null);
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

      <Calendar
        events={events}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        onNewRdvClick={handleNewRdvClick}
        isSidebarExpanded={isSidebarExpanded}
      />

      {consultEvent && (
        <ModalRdvConsultation
          event={consultEvent}
          onClose={() => setConsultEvent(null)}
          onEdit={handleEditFromConsult}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {isFormOpen && (
        <ModalForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          initialData={editingEvent || clientPrefill}
          prefilledDate={prefilledDate}
          onSubmit={handleFormSubmit}
        />
      )}

    </div>
  );
};

export default Planning;