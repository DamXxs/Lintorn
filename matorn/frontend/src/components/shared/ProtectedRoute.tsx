// /frontend/src/components/shared/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth, Role } from '../../context/AuthContext';

interface ProtectedRouteProps {
  // Le composant à afficher si autorisé
  children: React.ReactNode;
  // Rôle minimum requis (optionnel — par défaut juste être connecté)
  minimumRole?: Role;
}

const ProtectedRoute = ({ children, minimumRole = 'user' }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  // ── Pendant la vérification initiale du cookie ───────────────────────────
  // On affiche rien (évite un flash de la page login)
  if (isLoading) {
    return (
      <div className="protected-route__loading">
        <p>Chargement...</p>
      </div>
    );
  }

  // ── Pas connecté → redirige vers login ──────────────────────────────────
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ── Connecté mais rôle insuffisant → redirige vers accueil ──────────────
  if (!hasRole(minimumRole)) {
    return <Navigate to="/" replace />;
  }

  // ── Tout est OK → affiche le contenu ────────────────────────────────────
  return <>{children}</>;
};

export default ProtectedRoute;