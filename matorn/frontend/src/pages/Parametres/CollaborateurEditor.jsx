// /frontend/src/pages/Parametres/CollaborateurEditor.jsx
import React, { useState } from 'react';
import {
  createCollaborateur, updateCollaborateur, deleteCollaborateur
} from '../../services/api';
import { COULEURS_PALETTE } from '../../utils/colorUtils';
import { CheckCircle, Circle, Pencil, Trash2, Plus, Save, Loader, CircleAlert } from '../../utils/icons';
import { getApiError } from '../../utils/apiError';

const CollaborateurEditor = ({ collaborateurs, onReload }) => {

  const [editingItem,     setEditingItem]     = useState(null);
  const [isAdding,        setIsAdding]        = useState(false);
  const [formData,        setFormData]        = useState({ nom: '', role: '', couleur: '#27ae60' });
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // ── HELPERS ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ nom: '', role: '', couleur: '#27ae60' });
    setEditingItem(null);
    setIsAdding(false);
    setError(null);
    setShowColorPicker(false);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setIsAdding(false);
    setFormData({ nom: item.nom, role: item.role || '', couleur: item.couleur });
    setError(null);
    setShowColorPicker(false);
  };

  // Génère les initiales pour l'avatar (ex: "Thomas Dupont" → "TD")
  const getInitiales = (nom) => {
    const parts = nom.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nom.slice(0, 2).toUpperCase();
  };

  // ── TOGGLE ACTIF ─────────────────────────────────────────────────────────
  const handleToggle = async (item) => {
    try {
      await updateCollaborateur(item.id, { actif: !item.actif });
      onReload();
    } catch (err) {
      alert(getApiError(err, 'Erreur lors du changement de statut'));
    }
  };

  // ── SUPPRIMER ────────────────────────────────────────────────────────────
  const handleDelete = async (item) => {
    if (!window.confirm(`Supprimer "${item.nom}" de l'équipe ?`)) return;
    try {
      await deleteCollaborateur(item.id);
      onReload();
    } catch (err) {
      alert(getApiError(err, 'Erreur lors de la suppression'));
    }
  };

  // ── SAUVEGARDER ──────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nom.trim()) { setError('Le nom est obligatoire'); return; }

    try {
      setSaving(true);
      setError(null);

      if (isAdding) {
        await createCollaborateur({
          nom:    formData.nom.trim(),
          role:   formData.role.trim(),
          couleur: formData.couleur,
          actif:  true,
        });
      } else {
        await updateCollaborateur(editingItem.id, {
          nom:    formData.nom.trim(),
          role:   formData.role.trim(),
          couleur: formData.couleur,
        });
      }

      resetForm();
      onReload();
    } catch (err) {
      setError(getApiError(err, 'Erreur lors de l\'enregistrement'));
    } finally {
      setSaving(false);
    }
  };

  // ── RENDU ────────────────────────────────────────────────────────────────
  return (
    <div className="simple-editor">

      {/* ── LISTE ── */}
      <div className="simple-editor__list">
        {collaborateurs.length === 0 ? (
          <div className="simple-editor__empty">Aucun collaborateur — ajoutez votre équipe ci-dessous</div>
        ) : (
          collaborateurs.map(item => (
            <div
              key={item.id}
              className={[
                'simple-editor__row',
                !item.actif                 ? 'simple-editor__row--inactive' : '',
                editingItem?.id === item.id ? 'simple-editor__row--editing'  : '',
              ].join(' ')}
            >
              {/* Avatar avec initiales */}
              <div
                className="simple-editor__avatar"
                style={{ background: item.couleur }}
              >
                {getInitiales(item.nom)}
              </div>

              {/* Infos */}
              <div className="simple-editor__info">
                <span className="simple-editor__nom">{item.nom}</span>
                <span className="simple-editor__meta">
                  {item.role || <em style={{ color: '#555' }}>Pas de rôle défini</em>}
                  {!item.actif && <em> — inactif</em>}
                </span>
              </div>

              {/* Actions */}
              <div className="simple-editor__actions">
                <button
                  className={`simple-editor__toggle ${item.actif ? 'on' : 'off'}`}
                  onClick={() => handleToggle(item)}
                  title={item.actif ? 'Désactiver' : 'Activer'}
                >
                  {item.actif ? <CheckCircle size={16} /> : <Circle size={16} />}
                </button>
                <button className="simple-editor__btn edit"   onClick={() => openEdit(item)}>
                  <Pencil size={14} />
                </button>
                <button className="simple-editor__btn delete" onClick={() => handleDelete(item)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── FORMULAIRE ── */}
      {(isAdding || editingItem) && (
        <form className="simple-editor__form" onSubmit={handleSave}>

          <div className="simple-editor__form-title">
            {isAdding
              ? <><Plus size={14} /> Nouveau collaborateur</>
              : <><Pencil size={14} /> Modifier &quot;{editingItem.nom}&quot;</>
            }
          </div>

          {error && (
            <div className="simple-editor__error">
              <CircleAlert size={14} /> {error}
            </div>
          )}

          {/* APERÇU EN TEMPS RÉEL */}
          <div className="simple-editor__preview-collab">
            <div className="simple-editor__avatar" style={{ background: formData.couleur, fontSize: '16px', width: 44, height: 44 }}>
              {formData.nom ? getInitiales(formData.nom) : '?'}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text)' }}>{formData.nom || 'Prénom Nom'}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{formData.role || 'Rôle'}</div>
            </div>
          </div>

          <div className="simple-editor__form-fields">

            {/* NOM */}
            <div className="simple-editor__field simple-editor__field--full">
              <label className="simple-editor__label">Nom complet <span className="required">*</span></label>
              <input
                type="text"
                value={formData.nom}
                onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))}
                placeholder="Ex: Thomas Dupont"
                className="simple-editor__input"
                autoFocus
              />
            </div>

            {/* RÔLE */}
            <div className="simple-editor__field simple-editor__field--full">
              <label className="simple-editor__label">Rôle dans le garage</label>
              <input
                type="text"
                value={formData.role}
                onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                placeholder="Ex: Mécanicien, Formateur, Carrossier..."
                className="simple-editor__input"
              />
            </div>

            {/* COULEUR */}
            <div className="simple-editor__field">
              <label className="simple-editor__label">Couleur dans le planning</label>
              <button
                type="button"
                className="simple-editor__color-trigger"
                onClick={() => setShowColorPicker(p => !p)}
              >
                <div className="simple-editor__color-swatch" style={{ background: formData.couleur }} />
                <span>{formData.couleur}</span>
                <span className="simple-editor__trigger-arrow">▾</span>
              </button>
            </div>

          </div>

          {/* PALETTE COULEURS */}
          {showColorPicker && (
            <div className="simple-editor__color-palette">
              <div className="simple-editor__color-grid">
                {COULEURS_PALETTE.map(({ hex, label }) => (
                  <button
                    key={hex}
                    type="button"
                    className={`simple-editor__color-item ${formData.couleur === hex ? 'active' : ''}`}
                    style={{ background: hex }}
                    onClick={() => { setFormData(p => ({ ...p, couleur: hex })); setShowColorPicker(false); }}
                    title={label}
                  />
                ))}
              </div>
              <div className="simple-editor__color-custom">
                <input
                  type="color"
                  value={formData.couleur}
                  onChange={e => setFormData(p => ({ ...p, couleur: e.target.value }))}
                />
                <input
                  type="text"
                  value={formData.couleur}
                  onChange={e => setFormData(p => ({ ...p, couleur: e.target.value }))}
                  placeholder="#27ae60"
                  className="simple-editor__input"
                />
              </div>
            </div>
          )}

          {/* BOUTONS */}
          <div className="simple-editor__form-btns">
            <button type="button" className="simple-editor__form-btn cancel" onClick={resetForm}>
              Annuler
            </button>
            <button type="submit" className="simple-editor__form-btn save" disabled={saving}>
              {saving ? <Loader size={14} /> : <><Save size={14} /> {isAdding ? 'Ajouter' : 'Modifier'}</>}
            </button>
          </div>

        </form>
      )}

      {/* BOUTON AJOUTER */}
      {!isAdding && !editingItem && (
        <button className="simple-editor__add-btn" onClick={() => { setIsAdding(true); setEditingItem(null); }}>
          ＋ Ajouter un collaborateur
        </button>
      )}

    </div>
  );
};

export default CollaborateurEditor;
