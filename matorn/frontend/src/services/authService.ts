// /frontend/src/services/authService.ts

// Type de l'utilisateur connecté
export interface UserInfo {
  id:       number;
  username: string;
  email:    string;
  role:     string;
}

// URL de base de l'API
const API_BASE = '/api/auth';

// =============================================================================
// AUTH SERVICE
// Toutes les communications avec les endpoints /api/auth/
// =============================================================================

export const authService = {

  // ── LOGIN ──────────────────────────────────────────────────────────────
  login: async (username: string, password: string): Promise<UserInfo> => {
    const response = await fetch(`${API_BASE}/login/`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      // credentials: 'include' → OBLIGATOIRE pour que le navigateur
      // accepte et renvoie les cookies httpOnly
      credentials: 'include',
      body:        JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      // On remonte l'erreur pour que le composant Login puisse l'afficher
      throw new Error(data.error || 'Erreur de connexion');
    }

    const data = await response.json();
    return data.user as UserInfo;
  },

  // ── LOGOUT ─────────────────────────────────────────────────────────────
  logout: async (): Promise<void> => {
    await fetch(`${API_BASE}/logout/`, {
      method:      'POST',
      credentials: 'include',
    });
    // On ne vérifie pas la réponse — même si ça échoue,
    // on vide l'user côté React de toute façon
  },

  // ── GET ME ─────────────────────────────────────────────────────────────
  // Appelé au démarrage pour vérifier si on est déjà connecté
  getMe: async (): Promise<UserInfo> => {
    const response = await fetch(`${API_BASE}/me/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Non connecté');
    }

    return await response.json() as UserInfo;
  },

  // ── REFRESH ────────────────────────────────────────────────────────────
  // Renouvelle l'access token depuis le refresh token (cookie)
  refresh: async (): Promise<boolean> => {
    const response = await fetch(`${API_BASE}/refresh/`, {
      method:      'POST',
      credentials: 'include',
    });
    return response.ok;
  },
};