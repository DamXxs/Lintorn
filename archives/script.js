var calendar;

// Fonctions globales d'interface
function ouvrirModal() { 
    const m = document.getElementById('modal-rdv');
    m.style.display = 'block'; 
    setTimeout(() => m.style.opacity = '1', 10);
}

function fermerModal() { 
    const m = document.getElementById('modal-rdv');
    m.style.opacity = '0'; 
    setTimeout(() => {
        m.style.display = 'none';
        document.getElementById('form-rdv').reset();
    }, 300);
}

function toggleVoiture() {
    const d = document.getElementById('select-departement').value;
    document.getElementById('section-vehicule').style.display = (d === 'ACADEMIE') ? 'none' : 'block';
}

function filtrerCalendrier(t) {
    calendar.getEvents().forEach(e => {
        e.setProp('display', (t === 'TOUT' || e.extendedProps.departement === t) ? 'auto' : 'none');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'fr',
        timeZone: 'local', // Utilise le fuseau du navigateur
        height: 'parent',
        slotMinTime: "08:00:00",
        slotMaxTime: "19:00:00",
        allDaySlot: false,
        slotEventOverlap: false,
        
        // Configuration de la barre d'outils
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: { today: "Auj", month: "Mois", week: "Sem", day: "Jour" },
        
        // FIX : Formatage correct des heures pour affichage à gauche
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },

        // Gestion du clic sur un événement
        eventClick: function(info) {
            const p = info.event.extendedProps;
            const start = info.event.start;

            /* === Colonnes sur le coté droit du calendar === */
            
            document.getElementById('view-client').textContent =`${p.client_nom} ${p.client_prenom}`;
            document.getElementById('view-vehicule').textContent = p.vehicule_modele || "N/A";
            document.getElementById('view-plaque').textContent = p.vehicule_plaque || "N/A";
            document.getElementById('view-note').textContent = p.description || "Aucune note";
    
            // 3. Afficher le bouton "Modifier"
            
            document.getElementById('btn-edit-mode').style.display = 'block';

             // 4. On pré-remplit quand même les champs de la modale en arrière-plan
             // pour que si l'utilisateur clique sur "Modifier", tout soit prêt.
            
             document.getElementById('input-rdv-id').value = info.event.id;
             document.querySelector('[name="clientName"]').value = p.client_nom || "";
            

            // On cache le texte par défaut "Sélectionnez un rdv"
            document.querySelector('.placeholder-text').style.display = 'none';

            // Cache le texte d'attente
            const placeholder = document.querySelector('.placeholder-text');
            if (placeholder) placeholder.style.display = 'none';

            /* === Champs peux etre mis dans ATELIER comme dans ACADÉMIE === */

            document.getElementById('input-rdv-id').value = info.event.id;
            document.querySelector('[name="clientName"]').value = p.client_nom || "";
            document.querySelector('[name="departement"]').value = p.departement || "";
            document.querySelector('[name="description"]').value = p.description || "";
            document.querySelector('[name="clientFirstName"]').value = p.client_first_name || "";
            document.querySelector('[name="clientPhone"]').value = p.client_phone || "";
            document.querySelector('[name="clientEmail"]').value = p.client_email || "";
            document.querySelector('[name="address"]').value = p.client_address || "";

            /* === Champs spécifiques aux véhicules (ATELIER) === */
            
            if (p.departement === 'ATELIER') {
                document.querySelector('[name="plate"]').value = p.vehicule_plaque || "";
                document.querySelector('[name="vehicleModel"]').value = p.vehicule_modele || "";
                document.querySelector('[name="serviceType"]').value = p.service_type || "";
                document.querySelector('[name="mileage"]').value = p.vehicule_km || "";
                document.querySelector('[name="vehicleBrand"]').value = p.vehicule_marque || "";
                document.querySelector('[name="vehicleYear"]').value = p.vehicule_annee || "";
                document.querySelector('[name="vin"]').value = p.vehicule_vin || "";
            }

            // FIX : Formatage date locale (évite les décalages ISO)
            const year = start.getFullYear();
            const month = String(start.getMonth() + 1).padStart(2, '0');
            const day = String(start.getDate()).padStart(2, '0');
            const hours = String(start.getHours()).padStart(2, '0');
            const minutes = String(start.getMinutes()).padStart(2, '0');

            document.querySelector('[name="date"]').value = `${year}-${month}-${day}`;
            document.querySelector('[name="time"]').value = `${hours}:${minutes}`;
            
            document.getElementById('btn-supprimer').style.display = 'block';
            document.getElementById('btn-supprimer').href = "/supprimer_rdv/" + info.event.id + "/";
            
            toggleVoiture();
        }
    });

    calendar.render();

    // Injection et vérification des données
    const dataNode = document.getElementById('rdv-data');
    if (dataNode) {
        try {
            const events = JSON.parse(dataNode.textContent);
            console.log("Events chargés dans le calendrier :", events);
            calendar.addEventSource(events);
        } catch (e) {
            console.error("Erreur de parsing JSON :", e);
        }
    }
});