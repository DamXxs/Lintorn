// /frontend/src/hooks/useDelete.js
import { useState } from 'react';

/**
 * 🗑️ Hook useDelete — Centralise la logique de suppression
 *
 * Ce hook gère TOUT ce qui est commun à chaque suppression :
 *   1. Afficher une confirmation à l'utilisateur
 *   2. Appeler le service API qui supprime
 *   3. Afficher une alerte en cas d'erreur
 *   4. Appeler onSuccess() si ça a marché (ex: recharger la liste)
 *
 * AVANT (copié-collé dans 4 fichiers) :
 *   const handleDelete = async (item) => {
 *     if (!window.confirm(`Supprimer "${item.nom}" ?`)) return;
 *     try {
 *       await removeClient(item.id);
 *       await loadClients();
 *     } catch {
 *       alert('❌ Erreur lors de la suppression');
 *     }
 *   };
 *
 * APRÈS (une seule ligne dans chaque fichier) :
 *   const { handleDelete } = useDelete({
 *     deleteService: removeClient,
 *     onSuccess: loadClients,
 *     confirmMessage: (item) => `Supprimer "${item.nom}" ?`,
 *   });
 *
 * Paramètres :
 *   deleteService   : la fonction qui appelle l'API (ex: removeClient)
 *   onSuccess       : ce qu'on fait après la suppression (ex: recharger la liste)
 *   confirmMessage  : message de confirmation — peut être une string ou une fonction (item) => string
 */
const useDelete = ({ deleteService, onSuccess, confirmMessage }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (item) => {
    // Construit le message : string fixe ou fonction selon l'item
    const message = typeof confirmMessage === 'function'
      ? confirmMessage(item)
      : (confirmMessage || 'Supprimer cet élément ?');

    // Demande confirmation avant de supprimer
    if (!window.confirm(message)) return;

    try {
      setDeleting(true);
      await deleteService(item.id);
      if (onSuccess) await onSuccess(item);
    } catch {
      alert('❌ Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return { handleDelete, deleting };
};

export default useDelete;
