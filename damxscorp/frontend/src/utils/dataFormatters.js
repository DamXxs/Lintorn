// /frontend/src/utils/dataFormatters.js
import logger from './logger';

/**
 * 🔧 FORMATAGE DES DONNÉES ENTRE REACT ET DJANGO
 *
 * REACT → DJANGO (POST/PUT) : formatInterventionForDjango
 * DJANGO → REACT (GET)      : formatInterventionForReact
 */

// =========================================================================
// REACT → DJANGO
// Ce que le formulaire envoie au backend
// Noms de champs = ce que le serializer attend en write_only
// =========================================================================
export const formatInterventionForDjango = (formData) => {
    logger.format.before('Intervention (React → Django)', formData);

    const formatted = {
        // Type et statut
        type_rdv:          formData.departement    || 'ATELIER',
        type_intervention: formData.typeIntervention || '',
        statut:            formData.statut          || 'PLANIFIE',

        // Dates combinées
        date_debut: `${formData.dateStart}T${formData.timeStart}:00`,
        date_fin:   `${formData.dateEnd}T${formData.timeEnd}:00`,

        // Description
        description: formData.description || '',

        // Client (write_only dans le serializer)
        client_nom:     formData.clientName      || '',
        client_prenom:  formData.clientFirstName || '',
        client_phone:   formData.clientPhone     || '',
        client_email:   formData.clientEmail     || '',
        client_adresse: formData.clientAddress   || '',

        // Véhicule (write_only dans le serializer)
        vehicule_immatriculation: formData.plate         || '',
        vehicule_marque:          formData.vehicleBrand  || '',
        vehicule_modele_input:    formData.vehicleModel  || '',
        vehicule_annee_input:     formData.vehicleYear   || '',
    };

    logger.format.after('Intervention (React → Django)', formatted);
    return formatted;
};

// =========================================================================
// DJANGO → REACT
// Ce que le backend renvoie → ce que le formulaire affiche
// Noms de champs = ce que to_representation() renvoie
// =========================================================================
export const formatInterventionForReact = (djangoData) => {
    logger.format.before('Intervention (Django → React)', djangoData);

    // Gestion des dates (peut être string ISO ou objet Date si vient de FullCalendar)
    const parseDate = (val) => {
        if (!val) return { date: '', time: '' };
        const d = new Date(val);
        return {
            date: d.toISOString().split('T')[0],
            time: d.toTimeString().slice(0, 5),
        };
    };

    const debut = parseDate(djangoData.date_debut || djangoData.start);
    const fin   = parseDate(djangoData.date_fin   || djangoData.end);

    const formatted = {
        // ID (important pour la modification)
        id: djangoData.id,

        // Type et statut
        departement:      djangoData.type_rdv          || 'ATELIER',
        typeIntervention: djangoData.type_intervention || '',
        statut:           djangoData.statut            || 'PLANIFIE',

        // Dates
        dateStart: debut.date,
        timeStart: debut.time,
        dateEnd:   fin.date,
        timeEnd:   fin.time,

        // Description
        description: djangoData.description || '',

        // Client (noms simples après to_representation)
        clientName:      djangoData.client_nom    || '',
        clientFirstName: djangoData.client_prenom || '',
        clientPhone:     djangoData.client_phone  || '',
        clientEmail:     djangoData.client_email  || '',
        clientAddress:   djangoData.client_adresse || '',

        // Véhicule (noms simples après to_representation)
        plate:        djangoData.vehicule_immatriculation || '',
        vehicleBrand: djangoData.vehicule_marque          || '',
        vehicleModel: djangoData.vehicule_modele          || '',
        vehicleYear:  djangoData.vehicule_annee           || '',
    };

    logger.format.after('Intervention (Django → React)', formatted);
    return formatted;
};