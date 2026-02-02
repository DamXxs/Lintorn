const BASE_URL = process.env.REACT_APP_API_URL;

// Fonction utilitaire pour éviter de répéter "/interventions/" partout
const INTERVENTIONS_URL = `${BASE_URL}/interventions/`;

export const fetchInterventions = async () => {
    const response = await fetch(INTERVENTIONS_URL);
    if (!response.ok) throw new Error(`Erreur réseau: ${response.status}`);
    return response.json();
};

export const saveIntervention = async (data) => {
    const response = await fetch(INTERVENTIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
    return response.json();
};

export const updateIntervention = async (id, data) => {
    const response = await fetch(`${INTERVENTIONS_URL}${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur lors de la modification');
    return response.json();
};

export const deleteIntervention = async (id) => {
    const response = await fetch(`${INTERVENTIONS_URL}${id}/`, { 
        method: 'DELETE' 
    });
    if (!response.ok) throw new Error('Erreur lors de la suppression');
    return response;
};