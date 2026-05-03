// /frontend/src/pages/Planning/components/Calendar.jsx
import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import './Calendar.css';

// ── Génère les initiales d'un nom (ex: "Jean Dupont" → "JD") ────
const getInitiales = (nom) =>
  nom.split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');

const Calendar = ({
  events,
  collaborateurs,
  onEventClick,
  onDateClick,
  onNewRdvClick,
  isSidebarExpanded
}) => {
  const calendarRef = useRef(null);

  // ── FIX RESIZE après transition sidebar ──────────────────────
  useEffect(() => {
    if (!calendarRef.current) return;
    const timer = setTimeout(() => {
      calendarRef.current?.getApi()?.updateSize();
    }, 350);
    return () => clearTimeout(timer);
  }, [isSidebarExpanded]);

  // ── CLIC SUR UN ÉVÉNEMENT ────────────────────────────────────
  const handleEventClick = (info) => {
    onEventClick({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...info.event.extendedProps,
    });
  };

  // ── CLIC SUR UNE CASE VIDE ───────────────────────────────────
  const handleDateClick = (info) => {
    if (info.view.type === 'timeGridWeek' || info.view.type === 'timeGridDay') {
      onDateClick(info.date);
    }
  };

  // ── RENDU PERSONNALISÉ DES ÉVÉNEMENTS ────────────────────────
  // Affiche le titre + les avatars des collaborateurs assignés
  const renderEventContent = (arg) => {
    const collabs = arg.event.extendedProps?.collaborateurs || [];
    const isMonthView = arg.view.type === 'dayGridMonth';

    // Vue mois : affichage compact (point coloré + titre court)
    if (isMonthView) {
      return (
        <div className="cal-event cal-event--month">
          <span className="cal-event__title">{arg.event.title}</span>
          {collabs.length > 0 && (
            <div className="cal-event__avatars">
              {collabs.slice(0, 3).map(c => (
                <span
                  key={c.id}
                  className="cal-event__avatar"
                  style={{ background: c.couleur }}
                  title={c.nom}
                >
                  {getInitiales(c.nom)}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Vue semaine/jour : affichage complet (titre + avatars)
    return (
      <div className="cal-event cal-event--week">
        <span className="cal-event__title">{arg.event.title}</span>
        {collabs.length > 0 && (
          <div className="cal-event__avatars">
            {collabs.map(c => (
              <span
                key={c.id}
                className="cal-event__avatar"
                style={{ background: c.couleur }}
                title={c.nom}
              >
                {getInitiales(c.nom)}
              </span>
            ))}
          </div>
        )}
      </div>
    );
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
          eventContent={renderEventContent}
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
