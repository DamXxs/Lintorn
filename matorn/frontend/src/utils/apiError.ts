// /frontend/src/utils/apiError.ts
//
// Normalise les erreurs axios en message lisible.
// Axios met "Network Error" quand le serveur est injoignable,
// ce qui n'est pas un message utile pour l'utilisateur.
//
// Usage :
//   catch (err) { setError(getApiError(err, 'Impossible de charger les données')); }

export const getApiError = (err: unknown, fallback: string): string => {
  if (err instanceof Error) {
    // Erreur réseau axios (serveur down, CORS, timeout...)
    if (err.message === 'Network Error' || err.message.includes('ERR_CONNECTION')) {
      return fallback;
    }
    // Erreur HTTP avec message custom (ex: levé dans le service)
    return err.message || fallback;
  }
  return fallback;
};
