// /frontend/src/pages/Parametres/DepartementEditor.jsx
import React, { useState } from 'react';
import {
  createDepartement, updateDepartement, deleteDepartement
} from '../../services/api';
import { COULEURS_PALETTE } from '../../utils/colorUtils';
import { CheckCircle, Circle, Pencil, Trash2, Plus, Save, Loader, CircleAlert } from '../../utils/icons';

// Génère un CODE technique depuis un nom (ex: "Carrosserie" → "CARROSSERIE")
const genererCode = (nom) =>
  nom.toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const DepartementEditor = ({ departements, onReload }) => {

  const [editingItem,     setEditingItem]     = useState(null);
  const [isAdding,        setIsAdding]        = useState(false);
  const [formData,        setFormData]        = useState({ nom: '', couleur: '#2980b9', requiert_vehicule: true });
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // ── HELPERS ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ nom: '', couleur: '#2980b9', requiert_vehicule: true });
    setEditingItem(null);
    setIsAdding(false);
    setError(null);
    setShowColorPicker(false);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setIsAdding(false);
    setFormData({ nom: item.nom, couleur: item.couleur, requiert_vehicule: item.requiert_vehicule });
    setError(null);
    setShowColorPicker(false);
  };

  // ── TOGGLE ACTIF / INACTIF ────────────────────────────────────────────────
  const handleToggle = async (item) => {
    try {
      await updateDepartement(item.id, { actif: !item.actif });
      onReload();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── SUPPRIMER ────────────────────────────────────────────────────────────
  const handleDelete = async (item) => {
    if (!window.confirm(`Supprimer le département "${item.nom}" définitivement ?`)) return;
    try {
      await deleteDepartement(item.id);
      onReload();
    } catch (err) {
      alert(err.message);
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
        await createDepartement({
          code:              genererCode(formData.nom),
          nom:               formData.nom.trim(),
          couleur:           formData.couleur,
          requiert_vehicule: formData.requiert_vehicule,
          actif:             true,
          ordre:             departements.length,
        });
      } else {
        await updateDepartement(editingItem.id, {
          nom:               formData.nom.trim(),
          couleur:           formData.couleur,
          requiert_vehicule: formData.requiert_vehicule,
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

  // ── RENDU ────────────────────────────────────────────────────────────────
  return (
    <div className="simple-editor">

      {/* ── LISTE ── */}
      <div className="simple-editor__list">
        {departements.length === 0 ? (
          <div className="simple-editor__empty">Aucun département — créez-en un ci-dessous</div>
        ) : (
          departements.map(item => (
            <div
              key={item.id}
              className={[
                'simple-editor__row',
                !item.actif            ? 'simple-editor__row--inactive' : '',
                editingItem?.id === item.id ? 'simple-editor__row--editing'  : '',
              ].join(' ')}
            >
              {/* Pastille couleur */}
              <div className="simple-editor__color-dot" style={{ background: item.couleur }} />

              {/* Infos */}
              <div className="simple-editor__info">
                <span className="simple-editor__nom">{item.nom}</span>
                <span className="simple-editor__meta">
                  {item.requiert_vehicule ? '🔧 Avec véhicule' : '📚 Sans véhicule'}
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
              ? <><Plus size={14} /> Nouveau département</>
              : <><Pencil size={14} /> Modifier &quot;{editingItem.nom}&quot;</>
            }
          </div>

          {error && (
            <div className="simple-editor__error">
              <CircleAlert size={14} /> {error}
            </div>
          )}

          <div className="simple-editor__form-fields">

            {/* NOM */}
            <div className="simple-editor__field simple-editor__field--full">
              <label className="simple-editor__label">Nom du département <span className="required">*</span></label>
              <input
                type="text"
                value={formData.nom}
                onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))}
                placeholder="Ex: Carrosserie, Électricité..."
                className="simple-editor__input"
                autoFocus
              />
              {isAdding && formData.nom && (
                <span className="simple-editor__hint">
                  Code généré : <strong>{genererCode(formData.nom)}</strong>
                </span>
              )}
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

            {/* REQUIERT VÉHICULE */}
            <div className="simple-editor__field simple-editor__field--toggle">
              <label className="simple-editor__label">Nécessite un véhicule ?</label>
              <div className="simple-editor__toggle-row">
                <button
                  type="button"
                  className={`simple-editor__toggle-pill ${formData.requiert_vehicule ? 'on' : 'off'}`}
                  onClick={() => setFormData(p => ({ ...p, requiert_vehicule: !p.requiert_vehicule }))}
                >
                  {formData.requiert_vehicule ? '✓ Oui' : '✗ Non'}
                </button>
                <span className="simple-editor__hint">
                  {formData.requiert_vehicule
                    ? 'La section véhicule s\'affiche dans le formulaire de RDV'
                    : 'Pas de véhicule requis (ex: cours, formation, admin)'}
                </span>
              </div>
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
                  placeholder="#2980b9"
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
              {saving ? <Loader size={14} /> : <><Save size={14} /> {isAdding ? 'Créer' : 'Modifier'}</>}
            </button>
          </div>

        </form>
      )}

      {/* BOUTON AJOUTER */}
      {!isAdding && !editingItem && (
        <button className="simple-editor__add-btn" onClick={() => { setIsAdding(true); setEditingItem(null); }}>
          ＋ Ajouter un département
        </button>
      )}

    </div>
  );
};

export default DepartementEditor;
