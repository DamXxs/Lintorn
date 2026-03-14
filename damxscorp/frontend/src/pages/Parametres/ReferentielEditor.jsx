// /frontend/src/pages/Parametres/ReferentielEditor.jsx
import React, { useState } from 'react';
import { createReferentiel, updateReferentiel, deleteReferentiel } from '../../services/api';
import './ReferentielEditor.css';

/**
 * 📋 ÉDITEUR DE RÉFÉRENTIEL
 *
 * Composant générique qui gère une catégorie de référentiel.
 * Utilisé 3 fois dans Paramètres (véhicules, interventions, stock).
 *
 * Props :
 *   categorie  → "TYPE_VEHICULE" | "TYPE_INTERVENTION" | "CATEGORIE_STOCK"
 *   items      → liste des entrées (depuis ReferentielsContext)
 *   onReload   → callback pour recharger le contexte après modification
 */
const ReferentielEditor = ({ categorie, items, onReload }) => {

  // Formulaire d'ajout / modification
  const [editingItem, setEditingItem] = useState(null);  // null = pas en édition
  const [isAdding, setIsAdding]       = useState(false);
  const [formData, setFormData]       = useState({ valeur: '', label: '', icone: '', couleur: '' });
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);

  // ── HELPERS ──────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({ valeur: '', label: '', icone: '', couleur: '' });
    setEditingItem(null);
    setIsAdding(false);
    setError(null);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setIsAdding(false);
    setFormData({
      valeur:  item.valeur,
      label:   item.label,
      icone:   item.icone   || '',
      couleur: item.couleur || '',
    });
    setError(null);
  };

  const openAdd = () => {
    setEditingItem(null);
    setIsAdding(true);
    setFormData({ valeur: '', label: '', icone: '', couleur: '' });
    setError(null);
  };

  // ── TOGGLE ACTIF ──────────────────────────────────────────────
  const handleToggleActif = async (item) => {
    try {
      await updateReferentiel(item.id, { actif: !item.actif });
      onReload();
    } catch (err) {
      alert('❌ Erreur lors du changement de statut');
    }
  };

  // ── RÉORDONNER ────────────────────────────────────────────────
  const handleMove = async (item, direction) => {
    // Trouver l'item voisin dans la direction
    const sorted = [...items].sort((a, b) => a.ordre - b.ordre);
    const idx = sorted.findIndex(i => i.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;

    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const neighbor = sorted[swapIdx];

    // Échanger les ordres
    try {
      await Promise.all([
        updateReferentiel(item.id,     { ordre: neighbor.ordre }),
        updateReferentiel(neighbor.id, { ordre: item.ordre     }),
      ]);
      onReload();
    } catch (err) {
      alert('❌ Erreur lors du réordonnancement');
    }
  };

  // ── SUPPRIMER ─────────────────────────────────────────────────
  const handleDelete = async (item) => {
    if (!window.confirm(`Supprimer "${item.label}" définitivement ?`)) return;
    try {
      await deleteReferentiel(item.id);
      onReload();
    } catch (err) {
      alert('❌ Erreur lors de la suppression');
    }
  };

  // ── SAUVEGARDER (création ou modification) ────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.label.trim()) { setError('Le libellé est obligatoire'); return; }
    if (isAdding && !formData.valeur.trim()) { setError('La clé interne est obligatoire'); return; }

    try {
      setSaving(true);
      setError(null);

      if (isAdding) {
        // Calcul ordre max + 1
        const maxOrdre = items.length > 0 ? Math.max(...items.map(i => i.ordre)) : 0;
        await createReferentiel({
          ...formData,
          categorie,
          valeur: formData.valeur.toUpperCase().replace(/\s/g, '_'),
          ordre:  maxOrdre + 1,
          actif:  true,
        });
      } else {
        // Modification — on ne change pas la valeur (clé interne)
        await updateReferentiel(editingItem.id, {
          label:   formData.label,
          icone:   formData.icone,
          couleur: formData.couleur,
        });
      }

      resetForm();
      onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── RENDU ─────────────────────────────────────────────────────
  const sorted = [...items].sort((a, b) => a.ordre - b.ordre);

  return (
    <div className="ref-editor">

      {/* LISTE DES ENTRÉES */}
      <div className="ref-editor__list">
        {sorted.length === 0 ? (
          <div className="ref-editor__empty">Aucune entrée — ajoutez-en une ci-dessous</div>
        ) : (
          sorted.map((item, idx) => (
            <div
              key={item.id}
              className={`ref-editor__row ${!item.actif ? 'ref-editor__row--inactive' : ''} ${editingItem?.id === item.id ? 'ref-editor__row--editing' : ''}`}
            >
              {/* Boutons ordre */}
              <div className="ref-editor__order-btns">
                <button
                  className="ref-editor__order-btn"
                  onClick={() => handleMove(item, 'up')}
                  disabled={idx === 0}
                  title="Monter"
                >▲</button>
                <button
                  className="ref-editor__order-btn"
                  onClick={() => handleMove(item, 'down')}
                  disabled={idx === sorted.length - 1}
                  title="Descendre"
                >▼</button>
              </div>

              {/* Icône + label */}
              <div className="ref-editor__item-info">
                <span className="ref-editor__icone">{item.icone || '·'}</span>
                <span className="ref-editor__label">{item.label}</span>
                <span className="ref-editor__valeur">({item.valeur})</span>
              </div>

              {/* Actions */}
              <div className="ref-editor__actions">
                {/* Toggle actif */}
                <button
                  className={`ref-editor__toggle ${item.actif ? 'ref-editor__toggle--on' : 'ref-editor__toggle--off'}`}
                  onClick={() => handleToggleActif(item)}
                  title={item.actif ? 'Désactiver' : 'Activer'}
                >
                  {item.actif ? '✅' : '⭕'}
                </button>

                {/* Modifier */}
                <button
                  className="ref-editor__btn ref-editor__btn--edit"
                  onClick={() => openEdit(item)}
                  title="Modifier"
                >✏️</button>

                {/* Supprimer */}
                <button
                  className="ref-editor__btn ref-editor__btn--delete"
                  onClick={() => handleDelete(item)}
                  title="Supprimer"
                >🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FORMULAIRE AJOUT / MODIFICATION */}
      {(isAdding || editingItem) && (
        <form className="ref-editor__form" onSubmit={handleSave}>
          <div className="ref-editor__form-title">
            {isAdding ? '➕ Nouvelle entrée' : `✏️ Modifier "${editingItem.label}"`}
          </div>

          {error && <div className="ref-editor__form-error">❌ {error}</div>}

          <div className="ref-editor__form-fields">
            {/* Clé interne — seulement à la création */}
            {isAdding && (
              <div className="ref-editor__field">
                <label className="ref-editor__field-label required">Clé interne</label>
                <input
                  type="text"
                  value={formData.valeur}
                  onChange={(e) => setFormData(p => ({ ...p, valeur: e.target.value }))}
                  placeholder="EX: MON_TYPE"
                  className="ref-editor__input"
                />
                <span className="ref-editor__hint">Majuscules, pas d'espace (ex: TRACTEUR)</span>
              </div>
            )}

            {/* Label */}
            <div className="ref-editor__field">
              <label className="ref-editor__field-label required">Libellé affiché</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData(p => ({ ...p, label: e.target.value }))}
                placeholder="Ex: Tracteur"
                className="ref-editor__input"
              />
            </div>

            {/* Icône */}
            <div className="ref-editor__field">
              <label className="ref-editor__field-label">Icône (emoji)</label>
              <input
                type="text"
                value={formData.icone}
                onChange={(e) => setFormData(p => ({ ...p, icone: e.target.value }))}
                placeholder="🚜"
                className="ref-editor__input ref-editor__input--small"
              />
            </div>

            {/* Couleur (utile pour les interventions) */}
            <div className="ref-editor__field">
              <label className="ref-editor__field-label">Couleur (calendrier)</label>
              <div className="ref-editor__color-row">
                <input
                  type="color"
                  value={formData.couleur || '#2980b9'}
                  onChange={(e) => setFormData(p => ({ ...p, couleur: e.target.value }))}
                  className="ref-editor__color-picker"
                />
                <input
                  type="text"
                  value={formData.couleur}
                  onChange={(e) => setFormData(p => ({ ...p, couleur: e.target.value }))}
                  placeholder="#2980b9"
                  className="ref-editor__input"
                />
              </div>
            </div>
          </div>

          <div className="ref-editor__form-btns">
            <button type="button" className="ref-editor__form-btn ref-editor__form-btn--cancel" onClick={resetForm}>
              Annuler
            </button>
            <button type="submit" className="ref-editor__form-btn ref-editor__form-btn--save" disabled={saving}>
              {saving ? '⏳...' : isAdding ? '💾 Créer' : '💾 Modifier'}
            </button>
          </div>
        </form>
      )}

      {/* BOUTON AJOUTER */}
      {!isAdding && !editingItem && (
        <button className="ref-editor__add-btn" onClick={openAdd}>
          ＋ Ajouter une entrée
        </button>
      )}

    </div>
  );
};

export default ReferentielEditor;