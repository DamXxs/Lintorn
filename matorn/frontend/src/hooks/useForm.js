// /frontend/src/hooks/useForm.js
import { useState, useEffect } from 'react';

/**
 * 📝 Hook useForm — Centralise la gestion d'état des formulaires
 *
 * Tous les formulaires du projet partagent le même pattern :
 *   - formData   : les valeurs du formulaire
 *   - errors     : les messages d'erreur par champ
 *   - saving     : true pendant l'enregistrement (désactive le bouton)
 *   - handleChange : met à jour un champ ET efface son erreur
 *   - useEffect  : réinitialise le formulaire si on passe en mode "modifier"
 *
 * AVANT (copié-collé dans ClientForm, VehicleForm...) :
 *   const [formData, setFormData] = useState({...});
 *   const [errors, setErrors] = useState({});
 *   const [saving, setSaving] = useState(false);
 *   useEffect(() => {
 *     if (editingItem) { setFormData({...}); }
 *     setErrors({});
 *   }, [editingItem]);
 *   const handleChange = (e) => {
 *     const { name, value } = e.target;
 *     setFormData(prev => ({ ...prev, [name]: value }));
 *     if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
 *   };
 *
 * APRÈS (quelques lignes dans chaque formulaire) :
 *   const { formData, setFormData, errors, setErrors, saving, setSaving, handleChange }
 *     = useForm(initialData, editingItem, (item) => ({ nom: item.nom, ... }));
 *
 * Paramètres :
 *   initialData    : objet avec les valeurs vides du formulaire
 *   editingItem    : l'objet qu'on est en train de modifier (null = création)
 *   buildFromItem  : fonction qui transforme l'objet Django en formData React
 */
const useForm = (initialData, editingItem, buildFromItem) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);

  // Chaque fois que l'item édité change :
  //   - si on modifie → pré-remplit le formulaire
  //   - si on crée    → remet tout à zéro
  useEffect(() => {
    if (editingItem && buildFromItem) {
      setFormData(buildFromItem(editingItem));
    } else {
      setFormData(initialData);
    }
    setErrors({});
    // On écoute uniquement editingItem (intentionnel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingItem]);

  /**
   * Gère le changement d'un champ de formulaire.
   * Fonctionne avec n'importe quel <input>, <select>, <textarea>
   * qui ont un attribut name= correspondant à une clé de formData.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Efface le message d'erreur du champ dès que l'utilisateur tape
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  return { formData, setFormData, errors, setErrors, saving, setSaving, handleChange };
};

export default useForm;
