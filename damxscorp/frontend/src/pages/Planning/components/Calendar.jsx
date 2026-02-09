// /src/pages/Planning/components/Calendar.jsx
import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import './Calendar.css';

const Calendar = ({ events, onEventClick, onDateClick, onNewRdvClick, IsSidebarExpended }) => {
  const calendarRef = useRef(null);

  // FORCE LE REDIMENSIONNEMENT QUAND LA SIDEBAR EST OUVERTE //
  useEffect(( => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      // PETIT DELAIS POUR ATTENDRE CSS 0.03S //
      setTimeout(() => {
        calendarApi.updateSize(); // MAGIE DE FULLCALENDAR ! //
      }, 350); // 50 ms APRES LA FIN DE LA TRANSITION //
    }
  }, [IsSidebarExpend]); // Se déclanche quand IsSidebarExpend change
  )

  const handleEventClick = (info) => {
    const event = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...info.event.extendedProps,
    };
    onEventClick(event);
  };

  const handleDateClick = (info) => {
    if (info.view.type === 'timeGridWeek' || info.view.type === 'timeGridDay') {
      onDateClick(info.date);
    }
  };

  return (
    <div className="calendar-container">
      {/* HEADER */}
      <div className="calendar-header">
        <h2 className="calendar-title">📅 Planning</h2>
        <button 
          className="btn-new-rdv"
          onClick={onNewRdvClick}
        >
          ➕ Nouveau RDV
        </button>
      </div>

      {/* WRAPPER POUR LE CALENDAR */}
      <div className="calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={frLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          slotMinTime="07:00:00" // Peut changer l'heure si les RDV sont plus long, a voir!
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
          height="100%" // Important !
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
          }}
        />
      </div>
    </div>
  );
};

export default Calendar;