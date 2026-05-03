// /frontend/src/services/utilisateursService.ts

export interface UserData {
  id:          number;
  username:    string;
  email:       string;
  role:        string;
  is_active:   boolean;
  date_joined: string;
}

const BASE = '/api/auth/users';

export const utilisateursService = {

  getAll: async (): Promise<UserData[]> => {
    const res = await fetch(`${BASE}/`, { credentials: 'include' });
    if (!res.ok) throw new Error('Erreur chargement utilisateurs');
    return res.json();
  },

  create: async (data: {
    username: string;
    password: string;
    email?: string;
    role?: string;
  }): Promise<UserData> => {
    const res = await fetch(`${BASE}/`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(Object.values(err).flat().join(' '));
    }
    return res.json();
  },

  update: async (id: number, data: Partial<{
    email:     string;
    role:      string;
    password:  string;
    is_active: boolean;
  }>): Promise<UserData> => {
    const res = await fetch(`${BASE}/${id}/`, {
      method:      'PATCH',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur mise à jour');
    }
    return res.json();
  },
};