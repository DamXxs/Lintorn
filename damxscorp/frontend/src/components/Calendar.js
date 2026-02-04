import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import './Calendar.css';  // ← Import du CSS dédié

const Calendar = ({ events, onDateClick, onEventClick }) => {
    
    // =========================================================================
    // GESTION DU CLIC SUR UN EVENT
    // =========================================================================
    const handleEventClick = (info) => {
        const eventData = {
            id: info.event.id,
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            ...info.event.extendedProps
        };
        
        console.log("📅 Event cliqué:", eventData);
        onEventClick(eventData);
    };

    // =========================================================================
    // CUSTOMISATION DES EVENTS (couleur selon le statut)
    // =========================================================================
    const eventClassNames = (arg) => {
        const departement = arg.event.extendedProps.departement;
        
        // Retourne une classe CSS selon le département
        if (departement === 'ATELIER') {
            return ['dept-atelier'];  // Orange/Jaune
        } else if (departement === 'ACADEMIE') {
            return ['dept-academie'];  // Bleu
        }
        
        return [];  // Par défaut
    };

    // =========================================================================
    // RENDU DU CALENDRIER
    // =========================================================================
    return (
        <main id="calendar-container">
            <FullCalendar
                // Plugins
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                
                // Vue initiale
                initialView="timeGridWeek"

                //Supprimer la case toute la journée//
                 allDaySlot={false}
                
                // Langue française
                locale={frLocale}
                
                // Données
                events={events}
                
                // Hauteur
                height="100%"
                
                // Horaires de travail (8h-19h)
                slotMinTime="08:00:00"
                slotMaxTime="19:00:00"
                
                // Durée d'un slot (30 minutes)
                slotDuration="00:30:00"
                
                // Format de l'heure (24h)
                slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }}
                
                // Boutons de la toolbar
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'timeGridDay,timeGridWeek,dayGridMonth'
                }}
                
                // Texte des boutons en français
                buttonText={{
                    today: "Aujourd'hui",
                    month: 'Mois',
                    week: 'Semaine',
                    day: 'Jour'
                }}
                
                // Premier jour de la semaine = Lundi
                firstDay={1}
                
                // Events cliquables
                eventClick={handleEventClick}
                
                // Clic sur une date vide (créer un RDV)
                dateClick={onDateClick}
                
                // Classe CSS selon le statut
                eventClassNames={eventClassNames}
                
                // Afficher le numéro de semaine
                weekNumbers={true}
                weekNumberFormat={{ week: 'numeric' }}
                
                // Permettre de sélectionner plusieurs jours
                selectable={true}
                
                // Scroll automatique à l'heure actuelle
                scrollTime="08:00:00"
                
                // Permettre de redimensionner les events (pour plus tard)
                editable={false}
                
                // Format de la date dans les events
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }}
            />
        </main>
    );
};

export default Calendar;