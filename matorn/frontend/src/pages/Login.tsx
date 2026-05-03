// /frontend/src/pages/Login.tsx
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();

  // ── États du formulaire ──────────────────────────────────────────────────
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erreur,   setErreur]   = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  // ── Soumission du formulaire ─────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // empêche le rechargement de la page
    setErreur(null);
    setLoading(true);

    try {
      await login(username, password);
      // Connexion réussie → redirige vers l'accueil
      navigate('/', { replace: true });
    } catch (err) {
      // Affiche le message d'erreur de Django
      setErreur(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">

      <div className="login__card">

        {/* Logo / Titre */}
        <div className="login__header">
          <h1 className="login__title">Matorn</h1>
          <p className="login__subtitle">Gestion de garage</p>
        </div>

        {/* Formulaire */}
        <form className="login__form" onSubmit={handleSubmit}>

          <div className="login__field">
            <label className="login__label" htmlFor="username">
              Identifiant
            </label>
            <input
              id="username"
              className="login__input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Votre identifiant"
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="login__field">
            <label className="login__label" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              className="login__input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              autoComplete="current-password"
              required
            />
          </div>

          {/* Message d'erreur */}
          {erreur && (
            <div className="login__erreur">
              {erreur}
            </div>
          )}

          <button
            className="login__btn"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

        </form>

      </div>

    </div>
  );
};

export default Login;