// /frontend/src/pages/Planning/Planning.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getAllRdvs,
  addRdv,
  editRdv,
  patchRdv,
  removeRdv,
  formatEventsForCalendar,
} from '../RendezVous/rdvService';
import { fetchCollaborateurs } from '../../services/api';
import { formatInterventionForDjango, formatInterventionForReact } from '../../utils/dataFormatters';
import Calendar from './components/Calendar';
import CollaborateurFilter from './components/CollaborateurFilter';
import ModalRdvConsultation from '../RendezVous/ModalRdvConsultation';
import ModalForm from './components/ModalForm';
import logger from '../../utils/logger';
import './Planning.css';

const Planning = ({ isSidebarExpanded }) => {
  const navigate = useNavigate();

  const [events, setEvents]               = useState([]);
  const [loading, setLoading]             = useState(false);
  const [consultEvent, setConsultEvent]   = useState(null);
  const [isFormOpen, setIsFormOpen]       = useState(false);
  const [editingEvent, setEditingEvent]   = useState(null);
  const [prefilledDate, setPrefilledDate] = useState(null);
  const [clientPrefill, setClientPrefill] = useState(null);

  const [collaborateurs, setCollaborateurs]   = useState([]);
  const [selectedCollabIds, setSelectedCollabIds] = useState([]);

  const location = useLocation();

  // ── Pré-remplissage depuis fiche client ──────────────────────
  useEffect(() => {
    if (location.state?.clientPrefill) {
      setEditingEvent(null);
      setPrefilledDate(null);
      setClientPrefill(location.state.clientPrefill);
      setIsFormOpen(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // ── Chargement ───────────────────────────────────────────────
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAllRdvs();
      setEvents(formatEventsForCalendar(data));
    } catch (err) {
      logger.error('Erreur chargement planning', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchCollaborateurs()
      .then(setCollaborateurs)
      .catch(() => {});
  }, []);

  // ── Filtrage par collaborateur ────────────────────────────────
  const filteredEvents = selectedCollabIds.length === 0
    ? events
    : events.filter(event => {
        const collabs = event.extendedProps?.collaborateurs || [];
        return collabs.some(c => selectedCollabIds.includes(c.id));
      });

  const handleCollabToggle = (id) => {
    setSelectedCollabIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── Actions calendrier ───────────────────────────────────────
  const handleEventClick    = (event) => setConsultEvent(event);
  const handleDateClick     = (date)  => { setPrefilledDate(date); setEditingEvent(null); setIsFormOpen(true); };
  const handleNewRdvClick   = ()      => { setPrefilledDate(null); setEditingEvent(null); setIsFormOpen(true); };

  const handleEditFromConsult = (event) => {
    setEditingEvent({ ...formatInterventionForReact(event), id: event.id });
    setConsultEvent(null);
    setIsFormOpen(true);
  };

  // ── Changement de statut ─────────────────────────────────────
  const handleStatusChange = async (id, newStatut) => {
    try {
      await patchRdv(id, { statut: newStatut });
      logger.success(`Statut → ${newStatut}`);
      const data = await getAllRdvs();
      setEvents(formatEventsForCalendar(data));
      const updated = data.find(e => String(e.id) === String(id));
      if (updated) setConsultEvent({ ...updated });
    } catch (err) {
      logger.error('Erreur statut', err);
      throw err;
    }
  };

  // ── Suppression ──────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await removeRdv(id);
      setConsultEvent(null);
      await loadData();
    } catch {
      alert('❌ Erreur lors de la suppression');
    }
  };

  // ── Soumission formulaire ────────────────────────────────────
  const handleFormSubmit = async (formData) => {
    try {
      const djangoData = formatInterventionForDjango(formData);
      if (editingEvent?.id) {
        await editRdv(editingEvent.id, djangoData);
        alert('✅ Rendez-vous modifié !');
      } else {
        await addRdv(djangoData);
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

  // ── Créer un OR depuis la consultation d'un RDV ──────────────
  const handleCreateOrFromRdv = (rdvInfo) => {
    setConsultEvent(null);
    navigate('/ordres-reparation', { state: { prefillFromRdv: rdvInfo } });
  };

  if (loading && events.length === 0) {
    return (
      <div className="planning-loading">
        <div className="spinner" />
        <p>⏳ Chargement...</p>
      </div>
    );
  }

  return (
    <div className="planning-page">

      <CollaborateurFilter
        collaborateurs={collaborateurs}
        selectedIds={selectedCollabIds}
        onToggle={handleCollabToggle}
        onSelectAll={() => setSelectedCollabIds([])}
      />

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
          onCreateOr={handleCreateOrFromRdv}
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