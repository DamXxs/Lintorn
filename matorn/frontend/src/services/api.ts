// /frontend/src/services/api.ts
import axios from 'axios';
import logger from '../utils/logger';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur global : token expiré → tentative de refresh, sinon redirection /login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await fetch('/api/auth/refresh/', {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          return api(originalRequest);
        }
      } catch {
        // Refresh injoignable
      }

      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// =============================================================================
// TYPES — reflètent exactement ce que Django retourne / attend
// =============================================================================

// ── CLIENT ────────────────────────────────────────────────────────────────────

export interface Client {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  notes: string;
  date_creation: string;
}

export type ClientCreateData = Omit<Client, 'id' | 'date_creation'>;
export type ClientUpdateData = Partial<ClientCreateData>;

// ── VÉHICULE ──────────────────────────────────────────────────────────────────

export interface Vehicule {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number | null;
  type_vehicule: string;
  proprietaire: number;           // ID FK (écriture)
  proprietaire_nom: string | null; // lecture seule
  proprietaire_id: number | null;  // lecture seule
  notes: string;
  date_creation: string;
}

export type VehiculeCreateData = Omit<Vehicule, 'id' | 'date_creation' | 'proprietaire_nom' | 'proprietaire_id'>;
export type VehiculeUpdateData = Partial<VehiculeCreateData>;

// ── STOCK / PIÈCES ─────────────────────────────────────────────────────────────

export interface Piece {
  id: number;
  reference: string;
  nom: string;
  description: string;
  categorie: string;
  prix_achat: number;
  prix_vente: number;
  marge: number;                       // lecture seule (calculé)
  marge_pourcentage: number;           // lecture seule (calculé)
  stock_actuel: number;
  stock_minimum: number;
  stock_suspendu: number;              // lecture seule (géré par les devis)
  stock_disponible: number;            // lecture seule (calculé)
  stock_status: 'OK' | 'ALERTE' | 'RUPTURE'; // lecture seule
  fournisseur_ref: number | null;      // ID FK (écriture)
  fournisseur_nom: string | null;      // lecture seule
  fournisseur_email: string | null;    // lecture seule
  delai_livraison: number | null;
  date_creation: string;
  date_modification: string;
}

export type PieceCreateData = Omit<
  Piece,
  'id' | 'date_creation' | 'date_modification' | 'marge' | 'marge_pourcentage'
  | 'stock_suspendu' | 'stock_disponible' | 'stock_status'
  | 'fournisseur_nom' | 'fournisseur_email'
>;
export type PieceUpdateData = Partial<PieceCreateData>;

// ── RÉFÉRENTIELS ───────────────────────────────────────────────────────────────

export interface Referentiel {
  id: number;
  categorie: string;
  valeur: string;
  label: string;
  icone: string;
  couleur: string;
  ordre: number;
  actif: boolean;
}

export type ReferentielCreateData = Omit<Referentiel, 'id'>;
export type ReferentielUpdateData = Partial<ReferentielCreateData>;

// ── DÉPARTEMENT ────────────────────────────────────────────────────────────────

export interface Departement {
  id: number;
  code: string;
  nom: string;
  couleur: string;
  actif: boolean;
  ordre: number;
  requiert_vehicule: boolean;
}

export type DepartementCreateData = Omit<Departement, 'id'>;
export type DepartementUpdateData = Partial<DepartementCreateData>;

// ── COLLABORATEUR ──────────────────────────────────────────────────────────────

export interface Collaborateur {
  id: number;
  nom: string;
  couleur: string;
  role: string;
  actif: boolean;
}

export type CollaborateurCreateData = Omit<Collaborateur, 'id'>;
export type CollaborateurUpdateData = Partial<CollaborateurCreateData>;

// ── INTERVENTION ───────────────────────────────────────────────────────────────

// Sous-types imbriqués dans Intervention (lecture)
export interface DepartementInfo {
  id: number;
  code: string;
  nom: string;
  couleur: string;
  requiert_vehicule: boolean;
}

export interface CollaborateurInfo {
  id: number;
  nom: string;
  couleur: string;
}

// Ce que Django retourne (GET)
export interface Intervention {
  id: number;
  statut: string;
  date_debut: string;
  date_fin: string | null;
  description: string;
  title: string;           // calculé côté backend
  start: string;           // alias de date_debut (pour FullCalendar)
  end: string | null;      // alias de date_fin
  departement: DepartementInfo | null;
  collaborateurs: CollaborateurInfo[];
  type_rdv: string;        // code du département (backward compat)
  client_nom: string;
  client_prenom: string;
  client_phone: string;
  client_email: string;
  vehicule_immatriculation: string;
  vehicule_marque: string;
  vehicule_modele: string;
  vehicule_annee: string;
}

// Ce que Django attend (POST / PUT) — champs write_only du serializer
export interface InterventionCreateData {
  date_debut: string;
  date_fin?: string | null;
  statut?: string;
  description?: string;
  type_rdv?: string;
  collaborateurs_ids?: number[];
  client_nom: string;
  client_prenom?: string;
  client_phone?: string;
  client_email?: string;
  client_adresse?: string;
  vehicule_immatriculation?: string;
  vehicule_marque?: string;
  vehicule_modele_input?: string;
  vehicule_annee_input?: string;
  type_intervention?: string;
}

export type InterventionUpdateData = Partial<InterventionCreateData>;

// =============================================================================
// INTERVENTIONS
// =============================================================================

export const fetchInterventions = async (): Promise<Intervention[]> => {
  try {
    logger.api.send('GET /interventions/');
    const response = await api.get<Intervention[]>('/interventions/');
    logger.api.receive('GET /interventions/', response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error('GET /interventions/', error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const saveIntervention = async (data: InterventionCreateData): Promise<Intervention> => {
  try {
    logger.api.send('POST /interventions/', data);
    const response = await api.post<Intervention>('/interventions/', data);
    logger.api.receive('POST /interventions/', response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error('POST /interventions/', error);
    if (!error.response) {
      throw new Error('Impossible de contacter le serveur.');
    }
    if (error.response.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la sauvegarde');
  }
};

export const updateIntervention = async (id: number, data: InterventionUpdateData): Promise<Intervention> => {
  try {
    logger.api.send(`PUT /interventions/${id}/`, data);
    const response = await api.put<Intervention>(`/interventions/${id}/`, data);
    logger.api.receive(`PUT /interventions/${id}/`, response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error(`PUT /interventions/${id}/`, error);
    throw new Error('Erreur lors de la modification');
  }
};

export const patchIntervention = async (id: number, data: InterventionUpdateData): Promise<Intervention> => {
  try {
    logger.api.send(`PATCH /interventions/${id}/`, data);
    const response = await api.patch<Intervention>(`/interventions/${id}/`, data);
    logger.api.receive(`PATCH /interventions/${id}/`, response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error(`PATCH /interventions/${id}/`, error);
    throw new Error('Erreur lors de la mise à jour');
  }
};

export const deleteIntervention = async (id: number): Promise<void> => {
  try {
    logger.api.send(`DELETE /interventions/${id}/`);
    await api.delete(`/interventions/${id}/`);
    logger.success(`Intervention ${id} supprimée`);
  } catch (error: any) {
    logger.api.error(`DELETE /interventions/${id}/`, error);
    throw new Error('Erreur lors de la suppression');
  }
};

export const fetchInterventionsByVehicule = async (vehiculeId: number): Promise<Intervention[]> => {
  try {
    logger.api.send(`GET /interventions/?vehicule=${vehiculeId}`);
    const response = await api.get<Intervention[]>(`/interventions/?vehicule=${vehiculeId}`);
    logger.api.receive(`GET /interventions/?vehicule=${vehiculeId}`, response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error(`GET /interventions/?vehicule=${vehiculeId}`, error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const fetchInterventionsByClient = async (clientId: number): Promise<Intervention[]> => {
  try {
    logger.api.send(`GET /interventions/?client=${clientId}`);
    const response = await api.get<Intervention[]>(`/interventions/?client=${clientId}`);
    logger.api.receive(`GET /interventions/?client=${clientId}`, response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error(`GET /interventions/?client=${clientId}`, error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const fetchVehiculesByClient = async (clientId: number): Promise<Vehicule[]> => {
  try {
    logger.api.send(`GET /vehicules/?client=${clientId}`);
    const response = await api.get<Vehicule[]>(`/vehicules/?client=${clientId}`);
    logger.api.receive(`GET /vehicules/?client=${clientId}`, response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error(`GET /vehicules/?client=${clientId}`, error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

// =============================================================================
// STOCK / PIÈCES
// =============================================================================

export const fetchPieces = async (): Promise<Piece[]> => {
  try {
    logger.api.send('GET /stock/pieces/');
    const response = await api.get<Piece[]>('/stock/pieces/');
    logger.api.receive('GET /stock/pieces/', response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error('GET /stock/pieces/', error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const createPiece = async (data: PieceCreateData): Promise<Piece> => {
  try {
    logger.api.send('POST /stock/pieces/', data);
    const response = await api.post<Piece>('/stock/pieces/', data);
    logger.api.receive('POST /stock/pieces/', response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error('POST /stock/pieces/', error);
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la création de la pièce');
  }
};

export const updatePiece = async (id: number, data: PieceUpdateData): Promise<Piece> => {
  try {
    logger.api.send(`PUT /stock/pieces/${id}/`, data);
    const response = await api.put<Piece>(`/stock/pieces/${id}/`, data);
    logger.api.receive(`PUT /stock/pieces/${id}/`, response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error(`PUT /stock/pieces/${id}/`, error);
    throw new Error('Erreur lors de la modification de la pièce');
  }
};

export const deletePiece = async (id: number): Promise<void> => {
  try {
    logger.api.send(`DELETE /stock/pieces/${id}/`);
    await api.delete(`/stock/pieces/${id}/`);
    logger.success(`Pièce ${id} supprimée`);
  } catch (error: any) {
    logger.api.error(`DELETE /stock/pieces/${id}/`, error);
    throw new Error('Erreur lors de la suppression');
  }
};

// =============================================================================
// CLIENTS
// =============================================================================

export const fetchClients = async (): Promise<Client[]> => {
  try {
    logger.api.send('GET /clients/');
    const response = await api.get<Client[]>('/clients/');
    logger.api.receive('GET /clients/', response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error('GET /clients/', error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const createClient = async (data: ClientCreateData): Promise<Client> => {
  try {
    logger.api.send('POST /clients/', data);
    const response = await api.post<Client>('/clients/', data);
    logger.api.receive('POST /clients/', response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error('POST /clients/', error);
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la création du client');
  }
};

export const updateClient = async (id: number, data: ClientUpdateData): Promise<Client> => {
  try {
    logger.api.send(`PUT /clients/${id}/`, data);
    const response = await api.put<Client>(`/clients/${id}/`, data);
    logger.api.receive(`PUT /clients/${id}/`, response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error(`PUT /clients/${id}/`, error);
    throw new Error('Erreur lors de la modification du client');
  }
};

export const deleteClient = async (id: number): Promise<void> => {
  try {
    logger.api.send(`DELETE /clients/${id}/`);
    await api.delete(`/clients/${id}/`);
    logger.success(`Client ${id} supprimé`);
  } catch (error: any) {
    logger.api.error(`DELETE /clients/${id}/`, error);
    throw new Error('Erreur lors de la suppression du client');
  }
};

// =============================================================================
// VÉHICULES
// =============================================================================

export const fetchVehicules = async (): Promise<Vehicule[]> => {
  try {
    logger.api.send('GET /vehicules/');
    const response = await api.get<Vehicule[]>('/vehicules/');
    logger.api.receive('GET /vehicules/', response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error('GET /vehicules/', error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const createVehicule = async (data: VehiculeCreateData): Promise<Vehicule> => {
  try {
    logger.api.send('POST /vehicules/', data);
    const response = await api.post<Vehicule>('/vehicules/', data);
    logger.api.receive('POST /vehicules/', response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error('POST /vehicules/', error);
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la création du véhicule');
  }
};

export const updateVehicule = async (id: number, data: VehiculeUpdateData): Promise<Vehicule> => {
  try {
    logger.api.send(`PUT /vehicules/${id}/`, data);
    const response = await api.put<Vehicule>(`/vehicules/${id}/`, data);
    logger.api.receive(`PUT /vehicules/${id}/`, response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error(`PUT /vehicules/${id}/`, error);
    throw new Error('Erreur lors de la modification du véhicule');
  }
};

export const deleteVehicule = async (id: number): Promise<void> => {
  try {
    logger.api.send(`DELETE /vehicules/${id}/`);
    await api.delete(`/vehicules/${id}/`);
    logger.success(`Véhicule ${id} supprimé`);
  } catch (error: any) {
    logger.api.error(`DELETE /vehicules/${id}/`, error);
    throw new Error('Erreur lors de la suppression du véhicule');
  }
};

// =============================================================================
// RÉFÉRENTIELS
// =============================================================================

export const fetchReferentiels = async (
  categorie: string | null = null,
  actifOnly: boolean = false
): Promise<Referentiel[]> => {
  try {
    const params: string[] = [];
    if (categorie) params.push(`categorie=${categorie}`);
    if (actifOnly) params.push('actif=true');
    const url = '/referentiels/' + (params.length ? '?' + params.join('&') : '');

    logger.api.send(`GET ${url}`);
    const response = await api.get<Referentiel[]>(url);
    logger.api.receive(`GET ${url}`, response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error('GET /referentiels/', error);
    throw new Error(`Erreur réseau: ${error.response?.status}`);
  }
};

export const createReferentiel = async (data: ReferentielCreateData): Promise<Referentiel> => {
  try {
    logger.api.send('POST /referentiels/', data);
    const response = await api.post<Referentiel>('/referentiels/', data);
    logger.api.receive('POST /referentiels/', response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error('POST /referentiels/', error);
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([f, m]) => `${f}: ${(m as string[]).join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la création');
  }
};

export const updateReferentiel = async (id: number, data: ReferentielUpdateData): Promise<Referentiel> => {
  try {
    logger.api.send(`PATCH /referentiels/${id}/`, data);
    const response = await api.patch<Referentiel>(`/referentiels/${id}/`, data);
    logger.api.receive(`PATCH /referentiels/${id}/`, response.data);
    return response.data;
  } catch (error: any) {
    logger.api.error(`PATCH /referentiels/${id}/`, error);
    throw new Error('Erreur lors de la modification');
  }
};

export const deleteReferentiel = async (id: number): Promise<void> => {
  try {
    logger.api.send(`DELETE /referentiels/${id}/`);
    await api.delete(`/referentiels/${id}/`);
    logger.success(`Référentiel ${id} supprimé`);
  } catch (error: any) {
    logger.api.error(`DELETE /referentiels/${id}/`, error);
    throw new Error('Erreur lors de la suppression');
  }
};

// =============================================================================
// DÉPARTEMENTS
// =============================================================================

export const fetchDepartements = async (actifSeulement: boolean = false): Promise<Departement[]> => {
  try {
    const url = '/departements/' + (actifSeulement ? '?actif=true' : '');
    const response = await api.get<Departement[]>(url);
    return response.data;
  } catch (error: any) {
    throw new Error('Erreur lors du chargement des départements');
  }
};

export const createDepartement = async (data: DepartementCreateData): Promise<Departement> => {
  try {
    const response = await api.post<Departement>('/departements/', data);
    return response.data;
  } catch (error: any) {
    throw new Error('Erreur lors de la création du département');
  }
};

export const updateDepartement = async (id: number, data: DepartementUpdateData): Promise<Departement> => {
  try {
    const response = await api.patch<Departement>(`/departements/${id}/`, data);
    return response.data;
  } catch (error: any) {
    const msg = error.response?.data?.error || 'Erreur lors de la modification';
    throw new Error(msg);
  }
};

export const deleteDepartement = async (id: number): Promise<void> => {
  try {
    await api.delete(`/departements/${id}/`);
  } catch (error: any) {
    const msg = error.response?.data?.error || 'Erreur lors de la suppression';
    throw new Error(msg);
  }
};

// =============================================================================
// COLLABORATEURS
// =============================================================================

export const fetchCollaborateurs = async (actifSeulement: boolean = false): Promise<Collaborateur[]> => {
  try {
    const url = '/collaborateurs/' + (actifSeulement ? '?actif=true' : '');
    const response = await api.get<Collaborateur[]>(url);
    return response.data;
  } catch (error: any) {
    throw new Error('Erreur lors du chargement des collaborateurs');
  }
};

export const createCollaborateur = async (data: CollaborateurCreateData): Promise<Collaborateur> => {
  try {
    const response = await api.post<Collaborateur>('/collaborateurs/', data);
    return response.data;
  } catch (error: any) {
    throw new Error('Erreur lors de la création du collaborateur');
  }
};

export const updateCollaborateur = async (id: number, data: CollaborateurUpdateData): Promise<Collaborateur> => {
  try {
    const response = await api.patch<Collaborateur>(`/collaborateurs/${id}/`, data);
    return response.data;
  } catch (error: any) {
    throw new Error('Erreur lors de la modification du collaborateur');
  }
};

export const deleteCollaborateur = async (id: number): Promise<void> => {
  try {
    await api.delete(`/collaborateurs/${id}/`);
  } catch (error: any) {
    throw new Error('Erreur lors de la suppression du collaborateur');
  }
};

// =============================================================================
// PARAMÈTRES FACTURATION (singleton — infos garage + config TVA)
// =============================================================================

export interface ParametresFacturation {
  id: number;
  nom_garage: string;
  adresse_garage: string;
  telephone_garage: string;
  email_garage: string;
  siret: string;
  numero_tva: string;
  tva_pourcentage: string;
  numero_devis_actuel: number;
  numero_facture_actuel: number;
  updated_at: string;
}

export const fetchParametres = async (): Promise<ParametresFacturation> => {
  try {
    const response = await api.get<ParametresFacturation>('/factures/parametres/');
    return response.data;
  } catch (error: any) {
    throw new Error('Erreur lors du chargement des paramètres');
  }
};
