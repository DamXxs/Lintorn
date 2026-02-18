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
  onDateClick,
  onNewRdvClick,
  isSidebarExpanded
}) => {
  const calendarRef = useRef(null);

  // ── FIX RESIZE ────────────────────────────────────────────────
  // On attend la fin de la transition CSS (300ms) + marge de sécurité (50ms)
  // avant de demander à FullCalendar de recalculer sa taille
  useEffect(() => {
    if (!calendarRef.current) return;

    // Durée de la transition sidebar en ms (doit correspondre au CSS)
    const TRANSITION_DURATION = 350;

    const timer = setTimeout(() => {
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        calendarApi.updateSize();
      }
    }, TRANSITION_DURATION);

    // Nettoyage : annule le timer si le composant se démonte avant
    return () => clearTimeout(timer);

  }, [isSidebarExpanded]); // Se déclenche à chaque changement de la sidebar

  // ── CLIC SUR UN ÉVÉNEMENT ────────────────────────────────────
  const handleEventClick = (info) => {
    const event = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      // extendedProps contient toutes les données Django
      ...info.event.extendedProps,
    };

    console.log('📅 Événement cliqué (données complètes) :', event);
    onEventClick(event);
  };

  // ── CLIC SUR UNE CASE VIDE ───────────────────────────────────
  const handleDateClick = (info) => {
    if (info.view.type === 'timeGridWeek' || info.view.type === 'timeGridDay') {
      onDateClick(info.date);
    }
  };

  return (
    <div className="calendar-container">
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
              text: '+ Nouveau RDV',
              click: onNewRdvClick,
            },
          }}
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          editable={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          height="100%"
        />
      </div>
    </div>
  );
};

export default Calendar;