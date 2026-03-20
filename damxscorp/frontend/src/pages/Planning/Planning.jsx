// /frontend/src/pages/Planning/Planning.jsx
import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import CollaborateurFilter from './components/CollaborateurFilter';
import ModalRdvConsultation from '../../components/shared/ModalRdvConsultation';
import ModalForm from '../../components/shared/ModalForm';
import logger from '../../utils/logger';
import { formatInterventionForDjango, formatInterventionForReact } from '../../utils/dataFormatters';
import {
  fetchInterventions,
  fetchCollaborateurs,
  saveIntervention,
  updateIntervention,
  patchIntervention,
  deleteIntervention
} from '../../services/api';
import './Planning.css';
import { useLocation } from 'react-router-dom';

// =========================================================================
// COULEURS DES ÉVÉNEMENTS selon statut + couleur du département
// =========================================================================
const getEventColors = (intervention) => {
  const { statut, departement } = intervention;
  if (statut === 'ANNULE')   return { backgroundColor: '#7f8c8d', borderColor: '#95a5a6' };
  if (statut === 'TERMINE')  return { backgroundColor: '#27ae60', borderColor: '#2ecc71' };
  if (statut === 'EN_COURS') return { backgroundColor: '#e67e22', borderColor: '#f39c12' };
  const color = departement?.couleur || '#2980b9';
  return { backgroundColor: color, borderColor: color };
};

// =========================================================================
// TRANSFORMATION POUR FULLCALENDAR
// =========================================================================
const formatEventsForCalendar = (interventions) => {
  return interventions.map(intervention => {
    const colors = getEventColors(intervention);
    return {
      id:              intervention.id,
      title:           intervention.title || `${intervention.client_nom} - ${intervention.type_rdv}`,
      start:           intervention.start || intervention.date_debut,
      end:             intervention.end   || intervention.date_fin,
      backgroundColor: colors.backgroundColor,
      borderColor:     colors.borderColor,
      textColor:       'white',
      extendedProps:   intervention,
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

  // ── COLLABORATEURS & FILTRE ──────────────────────────────────────
  const [collaborateurs, setCollaborateurs] = useState([]);
  // selectedCollabIds = [] → tout afficher / [1, 3] → filtrer sur ces IDs
  const [selectedCollabIds, setSelectedCollabIds] = useState([]);

  const location = useLocation();

  // ── PRÉ-REMPLISSAGE DEPUIS FICHE CLIENT ─────────────────────────
  useEffect(() => {
    if (location.state?.clientPrefill) {
      setEditingEvent(null);
      setPrefilledDate(null);
      setClientPrefill(location.state.clientPrefill);
      setIsFormOpen(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // ── CHARGEMENT DES DONNÉES ───────────────────────────────────────
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

  // Charge les interventions ET les collaborateurs au montage
  useEffect(() => {
    loadData();
    fetchCollaborateurs()
      .then(setCollaborateurs)
      .catch(() => {}); // Si erreur, la barre ne s'affiche simplement pas
  }, []);

  // ── FILTRAGE DES ÉVÉNEMENTS ──────────────────────────────────────
  // Si aucun filtre actif → on montre tout
  // Sinon → on ne garde que les events qui ont AU MOINS UN des collabs sélectionnés
  const filteredEvents = selectedCollabIds.length === 0
    ? events
    : events.filter(event => {
        const collabs = event.extendedProps?.collaborateurs || [];
        return collabs.some(c => selectedCollabIds.includes(c.id));
      });

  // ── TOGGLE COLLABORATEUR ─────────────────────────────────────────
  const handleCollabToggle = (id) => {
    setSelectedCollabIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)  // Déjà actif → on retire
        : [...prev, id]                // Pas encore actif → on ajoute
    );
  };

  // ── CLIC SUR UN ÉVÉNEMENT ────────────────────────────────────────
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
      await patchIntervention(id, { statut: newStatut });
      logger.success(`Statut → ${newStatut}`);
      const data = await fetchInterventions();
      setEvents(formatEventsForCalendar(data));
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

      {/* BARRE DE FILTRE (chips en haut) */}
      <CollaborateurFilter
        collaborateurs={collaborateurs}
        selectedIds={selectedCollabIds}
        onToggle={handleCollabToggle}
        onSelectAll={() => setSelectedCollabIds([])}
      />

      {/* ZONE PRINCIPALE */}
      <div className="planning-body">
        <Calendar
          events={filteredEvents}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          onNewRdvClick={handleNewRdvClick}
          isSidebarExpanded={isSidebarExpanded}
        />
      </div>

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
