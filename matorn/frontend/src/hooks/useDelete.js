// /frontend/src/hooks/useDelete.js
import { useState } from 'react';

/**
 * Hook useDelete — Centralise la logique de suppression avec modal de confirmation.
 *
 * Usage :
 *   const { handleDelete, deleting, confirmModalProps } = useDelete({
 *     deleteService: removeClient,
 *     onSuccess: loadClients,
 *     confirmMessage: (item) => `Supprimer "${item.nom}" ?`,
 *   });
 *
 *   // Dans le JSX :
 *   <ConfirmModal {...confirmModalProps} />
 *
 * Paramètres :
 *   deleteService   : la fonction qui appelle l'API (ex: removeClient)
 *   onSuccess       : ce qu'on fait après la suppression (ex: recharger la liste)
 *   confirmMessage  : message de confirmation — string fixe ou (item) => string
 */
const useDelete = ({ deleteService, onSuccess, confirmMessage }) => {
  const [deleting, setDeleting] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);

  // Ouvre la modal (ne supprime pas encore)
  const handleDelete = (item) => {
    setPendingItem(item);
  };

  // Appelé quand l'utilisateur clique "Supprimer" dans la modal
  const confirmDelete = async () => {
    if (!pendingItem) return;
    const item = pendingItem;
    setPendingItem(null);
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

  // Appelé quand l'utilisateur annule
  const cancelDelete = () => setPendingItem(null);

  const modalTitle = pendingItem
    ? (typeof confirmMessage === 'function'
        ? confirmMessage(pendingItem)
        : (confirmMessage || 'Supprimer cet élément ?'))
    : '';

  const confirmModalProps = {
    isOpen: !!pendingItem,
    title: modalTitle,
    variant: 'danger',
    labelConfirm: 'Supprimer',
    labelCancel: 'Annuler',
    onConfirm: confirmDelete,
    onCancel: cancelDelete,
  };

  return { handleDelete, deleting, confirmModalProps };
};

export default useDelete;
