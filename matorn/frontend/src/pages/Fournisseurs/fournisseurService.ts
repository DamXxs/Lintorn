// /frontend/src/pages/Fournisseurs/fournisseurService.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── TYPES ─────────────────────────────────────────────────────────

export interface Fournisseur {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  contact_nom: string;
  adresse: string;
  categorie: string;
  est_favori: boolean;
  actif: boolean;
  notes: string;
  nb_pieces: number;
  created_at: string;
  updated_at: string;
}

export interface PieceAlerte {
  id: number;
  reference: string;
  nom: string;
  stock_actuel: number;
  stock_minimum: number;
  quantite_suggeree: number;
}

export interface EmailCommandeData {
  fournisseur_id: number;
  fournisseur_nom: string;
  email_destinataire: string;
  contact_nom: string;
  sujet: string;
  corps: string;
  pieces: PieceAlerte[];
}

export interface StockAlertes {
  alerte: any[];
  rupture: any[];
}

// Formulaire (création / édition) — id optionnel car absent à la création
export type FournisseurFormData = Omit<Fournisseur, 'id' | 'nb_pieces' | 'created_at' | 'updated_at'> & {
  id?: number;
};

// ── FOURNISSEURS CRUD ─────────────────────────────────────────────

export const fetchFournisseurs = async (actifOnly = false): Promise<Fournisseur[]> => {
  const params = actifOnly ? '?actif=true' : '';
  const response = await api.get(`/fournisseurs/${params}`);
  return response.data;
};

export const fetchFournisseur = async (id: number): Promise<Fournisseur> => {
  const response = await api.get(`/fournisseurs/${id}/`);
  return response.data;
};

export const createFournisseur = async (data: FournisseurFormData): Promise<Fournisseur> => {
  try {
    const response = await api.post('/fournisseurs/', data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la création du fournisseur');
  }
};

export const updateFournisseur = async (id: number, data: FournisseurFormData): Promise<Fournisseur> => {
  try {
    const response = await api.put(`/fournisseurs/${id}/`, data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la modification du fournisseur');
  }
};

export const patchFournisseur = async (id: number, data: Partial<Fournisseur>): Promise<Fournisseur> => {
  const response = await api.patch(`/fournisseurs/${id}/`, data);
  return response.data;
};

export const deleteFournisseur = async (id: number): Promise<void> => {
  try {
    await api.delete(`/fournisseurs/${id}/`);
  } catch (error: any) {
    const msg = error.response?.data?.error || 'Erreur lors de la suppression';
    throw new Error(msg);
  }
};

// ── ALERTES STOCK ─────────────────────────────────────────────────

export const fetchFournisseursAvecAlertes = async (): Promise<any[]> => {
  const response = await api.get('/fournisseurs/alertes/');
  return response.data;
};

export const fetchPiecesEnAlerte = async (): Promise<StockAlertes> => {
  const response = await api.get('/stock/pieces/');
  const pieces = response.data;
  return {
    alerte:  pieces.filter((p: any) => p.stock_status === 'ALERTE'),
    rupture: pieces.filter((p: any) => p.stock_status === 'RUPTURE'),
  };
};

// ── EMAIL DE COMMANDE ─────────────────────────────────────────────

export const fetchEmailCommande = async (fournisseurId: number): Promise<EmailCommandeData> => {
  const response = await api.get(`/fournisseurs/${fournisseurId}/email-commande/`);
  return response.data;
};