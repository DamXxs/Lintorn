// /frontend/src/pages/Archives/archiveService.ts
//
// ══════════════════════════════════════════════════════════════════
//  SERVICE ARCHIVES — Appels API vers /api/archives/
//
//  Endpoints Django utilisés :
//    GET  /api/archives/                          → liste unifiée
//    GET  /api/archives/types/                    → types disponibles
//    POST /api/archives/<type>/<id>/restore/      → restaurer
//    DELETE /api/archives/<type>/<id>/purge/      → purger définitivement
// ══════════════════════════════════════════════════════════════════

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── TYPES ─────────────────────────────────────────────────────────

export type EtatArchive = 'corbeille' | 'archive';

export interface ElementArchive {
  type: string;
  type_libelle: string;
  id: number;
  libelle_principal: string;
  libelle_secondaire: string | null;
  deleted_at: string | null;
  archived_at: string | null;
  etat: EtatArchive;
}

export interface ListeArchivesResponse {
  count: number;
  results: ElementArchive[];
}

export interface TypeArchivable {
  cle: string;
  libelle: string;
}

export interface FiltresArchives {
  etat?: 'corbeille' | 'archive';
  type?: string;
}

// ── LISTING ───────────────────────────────────────────────────────

/**
 * Récupère tous les éléments en corbeille et/ou archives.
 * Filtres optionnels : etat (corbeille | archive) et type (client, vehicule...)
 */
export const fetchArchives = async (
  filtres: FiltresArchives = {}
): Promise<ListeArchivesResponse> => {
  const params = new URLSearchParams();
  if (filtres.etat)  params.append('etat', filtres.etat);
  if (filtres.type)  params.append('type', filtres.type);

  const query = params.toString() ? `?${params}` : '';
  const res = await api.get(`/archives/${query}`);
  return res.data;
};

/**
 * Récupère la liste des types archivables (pour les filtres).
 * Retourne ex: [{ cle: 'client', libelle: 'Client' }, ...]
 */
export const fetchTypesArchivables = async (): Promise<TypeArchivable[]> => {
  const res = await api.get('/archives/types/');
  return res.data;
};

// ── ACTIONS ───────────────────────────────────────────────────────

/**
 * Restaure un élément depuis la corbeille ou les archives.
 * Le rend à nouveau actif dans les vues principales.
 */
export const restaurerElement = async (
  typeUrl: string,
  id: number
): Promise<void> => {
  await api.post(`/archives/${typeUrl}/${id}/restore/`);
};

/**
 * Supprime DÉFINITIVEMENT un élément de la base de données.
 * ACTION IRRÉVERSIBLE — à protéger par une confirmation sévère.
 *
 * TODO: Vérifier le rôle SUPERUSER avant d'autoriser cette action.
 * Voir le système de permissions à implémenter ultérieurement.
 */
export const purgerElement = async (
  typeUrl: string,
  id: number
): Promise<void> => {
  await api.delete(`/archives/${typeUrl}/${id}/purge/`);
};