// /frontend/src/pages/Planning/components/Calendar.jsx
import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import './Calendar.css';

const Calendar = ({ 
  events, 
  onEventClick, 
  onEventDoubleClick, // ✅ NOUVEAU
  onDateClick, 
  onNewRdvClick, 
  isSidebarExpanded 
}) => {
  const calendarRef = useRef(null);

  // Forcer le redimensionnement quand la sidebar change
  useEffect(() => {
    if (!calendarRef.current) return;

      const calendarApi = calendarRef.current.getApi();
      let rafId = null;

      const handleResize = () => {
          if (rafId) {
              cancelAnimationFrame(rafId);
          }
          rafId = requestAnimationFrame(() => {
            rafId = requestAnimationFrame(() => {
              calendarApi.updateSize();
            });
          });
      };

      handleResize(); // Appel initial

      // Nettoyage
      return () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        } 
      };
  }, [isSidebarExpanded]);

  // ✅ NOUVEAU : Gestion du clic simple
  const handleEventClick = (info) => {
    const event = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...info.event.extendedProps,
    };
    
    // Si c'est un double-clic, FullCalendar le détecte automatiquement
    // On appelle juste le clic simple ici
    onEventClick(event);
  };

  // ✅ NOUVEAU : Détection du double-clic
  let clickTimeout = null;
  const handleEventClickWithDelay = (info) => {
    const event = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...info.event.extendedProps,
    };

    // Si déjà un clic en attente = double-clic
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      clickTimeout = null;
      onEventDoubleClick(event); // ✅ Double-clic détecté
    } else {
      // Premier clic : on attend 300ms
      clickTimeout = setTimeout(() => {
        clickTimeout = null;
        onEventClick(event); // ✅ Clic simple confirmé
      }, 300);
    }
  };

  const handleDateClick = (info) => {
    if (info.view.type === 'timeGridWeek' || info.view.type === 'timeGridDay') {
      onDateClick(info.date);
    }
  };

  return (
    <div className="calendar-container">
      {/* HEADER - Supprimer bouton new rdv dans la toolbar fullcalendar */}
      

      {/* WRAPPER */}
      <div className="calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={frLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,newRdvButton',
          }}
          customButtons={{
            newRdvButton: {
              text: 'Nouveau RDV',
              click: onNewRdvClick,
            },
          }}
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          events={events}
          eventClick={handleEventClickWithDelay} // ✅ Gestion clic/double-clic
          dateClick={handleDateClick}
          editable={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          height="100%"
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            jour: 'Jour',
          }}
        />
      </div>
    </div>
  );
};

export default Calendar;