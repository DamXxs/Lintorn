// /frontend/src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserInfo } from '../services/authService';

// =============================================================================
// TYPES
// =============================================================================

interface AuthContextType {
  // L'utilisateur connecté (null si pas connecté)
  user: UserInfo | null;

  // États
  isLoading: boolean;         // true pendant la vérification initiale
  isAuthenticated: boolean;   // true si user !== null

  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Utilitaires de vérification de rôle
  hasRole: (minimumRole: Role) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

// Hiérarchie des rôles — même ordre que Django
export type Role = 'user' | 'superuser' | 'admin' | 'superadmin';

const ROLE_HIERARCHY: Record<Role, number> = {
  user:       0,
  superuser:  1,
  admin:      2,
  superadmin: 3,
};

// =============================================================================
// CRÉATION DU CONTEXTE
// =============================================================================

// On crée le contexte avec undefined par défaut
// (il sera rempli par AuthProvider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// PROVIDER — enveloppe toute l'app
// =============================================================================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true au démarrage

  // ── Au démarrage : vérifie si on est déjà connecté ──────────────────────
  // Si le cookie JWT est encore valide, on récupère l'utilisateur
  // sans redemander le mot de passe
  useEffect(() => {
    const verifierSession = async () => {
      try {
        // Appelle /api/auth/me/ — si le cookie est valide, retourne l'user
        const userInfo = await authService.getMe();
        setUser(userInfo);
      } catch {
        // Cookie absent ou expiré → pas connecté, c'est normal
        setUser(null);
      } finally {
        // Dans tous les cas, on arrête le loading
        setIsLoading(false);
      }
    };

    verifierSession();
  }, []); // [] = seulement au montage initial

  // ── LOGIN ────────────────────────────────────────────────────────────────
  const login = async (username: string, password: string) => {
    // authService.login() appelle /api/auth/login/
    // Django pose les cookies httpOnly automatiquement
    const userInfo = await authService.login(username, password);
    setUser(userInfo);
  };

  // ── LOGOUT ───────────────────────────────────────────────────────────────
  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  // ── UTILITAIRES RÔLES ────────────────────────────────────────────────────

  // Vérifie si l'user a AU MOINS le rôle demandé
  const hasRole = (minimumRole: Role): boolean => {
    if (!user) return false;
    const niveauUser   = ROLE_HIERARCHY[user.role as Role] ?? 0;
    const niveauRequis = ROLE_HIERARCHY[minimumRole] ?? 0;
    return niveauUser >= niveauRequis;
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isSuperAdmin = (): boolean => hasRole('superadmin');

  // ── VALEUR EXPOSÉE AU RESTE DE L'APP ─────────────────────────────────────
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
    hasRole,
    isAdmin,
    isSuperAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// =============================================================================
// HOOK — façon propre d'utiliser le contexte dans n'importe quel composant
// =============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  // Sécurité : si useAuth() est appelé en dehors de AuthProvider → erreur claire
  if (context === undefined) {
    throw new Error('useAuth() doit être utilisé à l\'intérieur de <AuthProvider>');
  }

  return context;
};