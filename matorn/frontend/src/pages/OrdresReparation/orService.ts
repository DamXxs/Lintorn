// /frontend/src/pages/OrdresReparation/orService.ts
import { api } from '../../services/api';

// =============================================================================
// INTERFACES — la "fiche technique" des données échangées avec Django
// =============================================================================

/**
 * Une ligne de pièce dans un OR.
 * Reflète exactement ce que renvoie Django dans `pieces[]`.
 */
export interface LignePiece {
  id: number;
  piece: number;                    // ID FK vers Piece
  piece_nom: string;                // lecture seule
  piece_reference: string;          // lecture seule
  piece_categorie: string;          // lecture seule
  quantite: number;
  designation_snapshot: string;     // auto-rempli côté backend
  reference_snapshot: string;       // auto-rempli côté backend
  cree_le: string;
}

/**
 * Une ligne d'intervention (= 1 tâche atomique).
 */
export interface LigneIntervention {
  id: number;
  date: string;                     // YYYY-MM-DD
  type_intervention: number;        // ID FK vers Referentiel
  type_intervention_label: string;  // lecture seule
  type_intervention_couleur: string;
  type_intervention_icone: string;
  mecanicien: number;               // ID FK vers Collaborateur
  mecanicien_nom: string;           // lecture seule
  mecanicien_couleur: string;
  duree_minutes: number;
  duree_formatee: string;           // "1h30" formaté côté backend
  detail: string;
  cree_le: string;
}

/**
 * Version LISTE d'un OR (allégée, pour la page liste).
 */
export interface OrdreReparationListItem {
  id: number;
  numero: string;
  date_ouverture: string;
  date_cloture: string | null;
  statut: 'OUVERT' | 'EN_COURS' | 'CLOTURE' | 'ANNULE';
  statut_display: string;
  client: number;
  client_nom: string;
  client_prenom: string;
  vehicule: number;
  vehicule_marque: string;
  vehicule_modele: string;
  vehicule_immatriculation: string;
  nombre_pieces: number;
  duree_totale_minutes: number;
}

/**
 * Version DÉTAIL d'un OR (complète, pour l'éditeur).
 */
export interface OrdreReparationDetail {
  id: number;
  numero: string;
  date_ouverture: string;
  statut: 'OUVERT' | 'EN_COURS' | 'CLOTURE' | 'ANNULE';
  statut_display: string;

  // Relations (IDs)
  client: number;
  vehicule: number;
  rdv: number | null;

  // Client (lecture)
  client_nom: string;
  client_prenom: string;
  client_telephone: string;
  client_email: string;
  client_adresse: string;

  // Véhicule (lecture)
  vehicule_marque: string;
  vehicule_modele: string;
  vehicule_annee: number | null;
  vehicule_immatriculation: string;
  vehicule_type: string;

  // RDV lié
  rdv_description: string | null;

  // Données saisies
  kilometrage_entree: number | null;
  description_travaux: string;

  // Clôture
  date_cloture: string | null;
  kilometrage_sortie: number | null;
  heure_sortie: string | null;

  notes_internes: string;

  // Lignes imbriquées
  pieces: LignePiece[];
  interventions: LigneIntervention[];

  // Compteurs
  nombre_pieces: number;
  duree_totale_minutes: number;

  // Timestamps
  cree_le: string;
  modifie_le: string;
}

/**
 * Données pour créer un OR (champs minimaux).
 */
export interface OrCreateData {
  client: number;
  vehicule: number;
  rdv?: number | null;
  kilometrage_entree?: number | null;
  description_travaux?: string;
}

/**
 * Données pour ajouter une pièce à un OR.
 */
export interface LignePieceCreateData {
  piece: number;
  quantite: number;
}

/**
 * Données pour ajouter une intervention à un OR.
 */
export interface LigneInterventionCreateData {
  date: string;
  type_intervention: number;
  mecanicien: number;
  duree_minutes: number;
  detail?: string;
}

/**
 * Données pour clôturer un OR.
 */
export interface ClotureData {
  kilometrage_sortie?: number;
  heure_sortie?: string;
}

// =============================================================================
// ORDRES DE RÉPARATION — CRUD principal
// =============================================================================

/**
 * Récupère tous les OR (version liste, allégée).
 * Filtres optionnels : ?statut=OUVERT, ?client=42, etc.
 */
export const fetchOrdres = async (filters?: {
  statut?: string;
  client?: number;
  vehicule?: number;
  search?: string;
}): Promise<OrdreReparationListItem[]> => {
  const params = new URLSearchParams();
  if (filters?.statut)   params.append('statut',   filters.statut);
  if (filters?.client)   params.append('client',   String(filters.client));
  if (filters?.vehicule) params.append('vehicule', String(filters.vehicule));
  if (filters?.search)   params.append('search',   filters.search);

  const query = params.toString();
  const url = `/ordres-reparation/${query ? '?' + query : ''}`;

  const response = await api.get(url);
  return response.data;
};

/**
 * Récupère le détail complet d'un OR (avec pièces + interventions).
 */
export const fetchOrdre = async (id: number): Promise<OrdreReparationDetail> => {
  const response = await api.get(`/ordres-reparation/${id}/`);
  return response.data;
};

/**
 * Crée un nouvel OR.
 * Le numéro est généré automatiquement côté Django.
 */
export const createOrdre = async (data: OrCreateData): Promise<OrdreReparationDetail> => {
  try {
    const response = await api.post('/ordres-reparation/', data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
        .join('\n');
      throw new Error(`Données invalides :\n${errors}`);
    }
    throw new Error('Erreur lors de la création de l\'OR');
  }
};

/**
 * Modifie partiellement un OR (PATCH).
 * Utilisé pour l'auto-save de l'éditeur WYSIWYG.
 */
export const updateOrdre = async (
  id: number,
  data: Partial<OrdreReparationDetail>
): Promise<OrdreReparationDetail> => {
  try {
    const response = await api.patch<OrdreReparationDetail>(`/ordres-reparation/${id}/`, data);
    return response.data;
  } catch (error: any) {
    const serverMessage = error.response?.data?.error;
    if (serverMessage) throw new Error(serverMessage);
    throw new Error('Erreur lors de la modification');
  }
};

/**
 * Supprime un OR (soft-delete → corbeille).
 */
export const deleteOrdre = async (id: number): Promise<void> => {
  try {
    await api.delete(`/ordres-reparation/${id}/`);
  } catch (error: any) {
    // Gestion du blocage SuppressionBloqueeError côté backend
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Erreur lors de la suppression');
  }
};

/**
 * Clôture un OR (action métier dédiée).
 */
export const cloturerOrdre = async (
  id: number,
  data: ClotureData
): Promise<OrdreReparationDetail> => {
  const response = await api.post(`/ordres-reparation/${id}/cloturer/`, data);
  return response.data;
};

export const decloturerOrdre = async (id: number): Promise<OrdreReparationDetail> => {
  try {
    const response = await api.post<OrdreReparationDetail>(`/ordres-reparation/${id}/decloturer/`);
    return response.data;
  } catch (error: any) {
    const serverMessage = error.response?.data?.error;
    if (serverMessage) throw new Error(serverMessage);
    throw new Error('Erreur lors de la déclôture');
  }
};

// =============================================================================
// LIGNES PIÈCES — CRUD des pièces dans un OR
// =============================================================================

/**
 * Ajoute une pièce à un OR.
 * Les snapshots sont auto-remplis côté Django.
 */
export const addPieceToOrdre = async (
  ordreId: number,
  data: LignePieceCreateData
): Promise<LignePiece> => {
  try {
    const response = await api.post(`/ordres-reparation/${ordreId}/pieces/`, data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
        .join('\n');
      throw new Error(`Erreur :\n${errors}`);
    }
    throw new Error('Erreur lors de l\'ajout de la pièce');
  }
};

/**
 * Modifie une ligne pièce (quantité par exemple).
 */
export const updateLignePiece = async (
  lignePieceId: number,
  data: Partial<LignePieceCreateData>
): Promise<LignePiece> => {
  const response = await api.patch(`/ordres-reparation/lignes-pieces/${lignePieceId}/`, data);
  return response.data;
};

/**
 * Supprime une ligne pièce de l'OR.
 */
export const deleteLignePiece = async (lignePieceId: number): Promise<void> => {
  await api.delete(`/ordres-reparation/lignes-pieces/${lignePieceId}/`);
};

// =============================================================================
// LIGNES INTERVENTIONS — CRUD de la main d'œuvre dans un OR
// =============================================================================

export const addInterventionToOrdre = async (
  ordreId: number,
  data: LigneInterventionCreateData
): Promise<LigneIntervention> => {
  try {
    const response = await api.post(`/ordres-reparation/${ordreId}/interventions/`, data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      const errors = Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
        .join('\n');
      throw new Error(`Erreur :\n${errors}`);
    }
    throw new Error('Erreur lors de l\'ajout de l\'intervention');
  }
};

export const updateLigneIntervention = async (
  ligneInterventionId: number,
  data: Partial<LigneInterventionCreateData>
): Promise<LigneIntervention> => {
  const response = await api.patch(
    `/ordres-reparation/lignes-interventions/${ligneInterventionId}/`,
    data
  );
  return response.data;
};

export const deleteLigneIntervention = async (ligneInterventionId: number): Promise<void> => {
  await api.delete(`/ordres-reparation/lignes-interventions/${ligneInterventionId}/`);
};

// =============================================================================
// HELPERS UTILES POUR L'AFFICHAGE
// =============================================================================

/**
 * Couleurs par statut d'OR — pour les badges visuels.
 * Aligné avec ton convention StatutBadge.
 */
export const STATUT_OR_COLORS: Record<string, string> = {
  OUVERT:   '#2980b9',
  EN_COURS: '#e67e22',
  CLOTURE:  '#27ae60',
  ANNULE:   '#7f8c8d',
};

/**
 * Statuts dispo pour les filtres dans la page liste.
 */
export const STATUTS_OR = {
  OUVERT:   { value: 'OUVERT',   label: '🟢 Ouvert',   class: 'ouvert' },
  EN_COURS: { value: 'EN_COURS', label: '⚙️ En cours', class: 'en-cours' },
  CLOTURE:  { value: 'CLOTURE',  label: '✅ Clôturé',  class: 'cloture' },
  ANNULE:   { value: 'ANNULE',   label: '❌ Annulé',   class: 'annule' },
};

/**
 * Convertit des minutes en format "1h30" pour l'affichage.
 */
export const formatDuree = (minutes: number): string => {
  if (!minutes) return '0min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
};