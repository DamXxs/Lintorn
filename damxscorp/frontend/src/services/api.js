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

// =============================================================================
// API PIÈCES (STOCK)
// =============================================================================

// Construire l'URL de l'API pièces à partir de l'URL interventions
const API_PIECES_URL = process.env.REACT_APP_API_URL.replace('/interventions/', '/pieces/');

export const fetchPieces = async () => {
    const response = await fetch(API_PIECES_URL);
    if (!response.ok) throw new Error('Erreur réseau');
    return response.json();
};

export const savePiece = async (data) => {
    const response = await fetch(API_PIECES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur lors de la création');
    return response.json();
};

export const updatePiece = async (id, data) => {
    const response = await fetch(`${API_PIECES_URL}${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur lors de la modification');
    return response.json();
};

export const deletePiece = async (id) => {
    const response = await fetch(`${API_PIECES_URL}${id}/`, { 
        method: 'DELETE' 
    });
    if (!response.ok) throw new Error('Erreur lors de la suppression');
    return response;
};