// /frontend/src/pages/Parametres/ReferentielEditor.jsx
import React, { useState } from 'react';
import { createReferentiel, updateReferentiel, deleteReferentiel } from '../../services/api';
import { ICONES_CATALOGUE, renderIcone, suggererIcone } from '../../utils/iconUtils';
import { COULEURS_PALETTE } from '../../utils/colorUtils';
import { CheckCircle, Circle, Pencil, Trash2, Plus, Save, Loader, CircleAlert } from '../../utils/icons';
import './ReferentielEditor.css';

// ── GÉNÈRE LA CLÉ INTERNE depuis le label ────────────────────────
// "Quad électrique" → "QUAD_ELECTRIQUE"
const genererValeur = (label) => {
  return label
    .toUpperCase()
    .normalize('NFD')                        // Décompose les accents
    .replace(/[\u0300-\u036f]/g, '')         // Supprime les accents
    .replace(/[^A-Z0-9]+/g, '_')            // Remplace tout sauf lettres/chiffres par _
    .replace(/^_+|_+$/g, '');               // Supprime _ en début/fin
};

const ReferentielEditor = ({ categorie, items, onReload }) => {

  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding]       = useState(false);
  const [formData, setFormData]       = useState({
    label:   '',
    icone:   'Package',   // Nom Lucide par défaut
    couleur: '#2980b9',
  });
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // ── HELPERS ──────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ label: '', icone: 'Package', couleur: '#2980b9' });
    setEditingItem(null);
    setIsAdding(false);
    setError(null);
    setShowIconPicker(false);
    setShowColorPicker(false);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setIsAdding(false);
    setFormData({
      label:   item.label,
      icone:   item.icone   || 'Package',
      couleur: item.couleur || '#2980b9',
    });
    setError(null);
    setShowIconPicker(false);
    setShowColorPicker(false);
  };

  const openAdd = () => {
    setEditingItem(null);
    setIsAdding(true);
    setFormData({ label: '', icone: 'Package', couleur: '#2980b9' });
    setError(null);
  };

  // Quand l'utilisateur tape le nom → suggestion auto d'icône
  const handleLabelChange = (e) => {
    const label = e.target.value;
    const iconeAuto = suggererIcone(label);
    setFormData(prev => ({
      ...prev,
      label,
      // Suggère l'icône seulement si l'utilisateur n'en a pas déjà choisi une manuellement
      icone: prev.icone === 'Package' || prev._autoIcone ? iconeAuto : prev.icone,
      _autoIcone: true, // Flag : l'icône est auto
    }));
  };

  // Quand l'utilisateur choisit manuellement une icône → désactive l'auto
  const handleIconeSelect = (nom) => {
    setFormData(prev => ({ ...prev, icone: nom, _autoIcone: false }));
    setShowIconPicker(false);
  };

  // ── TOGGLE ACTIF ──────────────────────────────────────────────
  const handleToggleActif = async (item) => {
    try {
      await updateReferentiel(item.id, { actif: !item.actif });
      onReload();
    } catch {
      alert('❌ Erreur lors du changement de statut');
    }
  };

  // ── RÉORDONNER ────────────────────────────────────────────────
  const handleMove = async (item, direction) => {
    const sorted = [...items].sort((a, b) => a.ordre - b.ordre);
    const idx    = sorted.findIndex(i => i.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const neighbor = sorted[swapIdx];
    try {
      await Promise.all([
        updateReferentiel(item.id,     { ordre: neighbor.ordre }),
        updateReferentiel(neighbor.id, { ordre: item.ordre }),
      ]);
      onReload();
    } catch {
      alert('❌ Erreur lors du réordonnancement');
    }
  };

  // ── SUPPRIMER ─────────────────────────────────────────────────
  const handleDelete = async (item) => {
    if (!window.confirm(`Supprimer "${item.label}" définitivement ?`)) return;
    try {
      await deleteReferentiel(item.id);
      onReload();
    } catch {
      alert('❌ Erreur lors de la suppression');
    }
  };

  // ── SAUVEGARDER ───────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.label.trim()) { setError('Le nom est obligatoire'); return; }

    try {
      setSaving(true);
      setError(null);

      // Nettoyage du flag interne avant envoi
      const { _autoIcone, ...dataToSend } = formData;

      if (isAdding) {
        const maxOrdre = items.length > 0 ? Math.max(...items.map(i => i.ordre)) : 0;
        await createReferentiel({
          ...dataToSend,
          categorie,
          valeur: genererValeur(formData.label),  // ← Généré automatiquement
          ordre:  maxOrdre + 1,
          actif:  true,
        });
      } else {
        await updateReferentiel(editingItem.id, {
          label:   dataToSend.label,
          icone:   dataToSend.icone,
          couleur: dataToSend.couleur,
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

      {/* LISTE */}
      <div className="ref-editor__list">
        {sorted.length === 0 ? (
          <div className="ref-editor__empty">Aucune entrée — ajoutez-en une ci-dessous</div>
        ) : (
          sorted.map((item, idx) => (
            <div
              key={item.id}
              className={`ref-editor__row
                ${!item.actif ? 'ref-editor__row--inactive' : ''}
                ${editingItem?.id === item.id ? 'ref-editor__row--editing' : ''}
              `}
            >
              {/* Boutons ordre ▲▼ */}
              <div className="ref-editor__order-btns">
                <button
                  className="ref-editor__order-btn"
                  onClick={() => handleMove(item, 'up')}
                  disabled={idx === 0}
                >▲</button>
                <button
                  className="ref-editor__order-btn"
                  onClick={() => handleMove(item, 'down')}
                  disabled={idx === sorted.length - 1}
                >▼</button>
              </div>

              {/* Icône Lucide + couleur */}
              <div
                className="ref-editor__icone-preview"
                style={{ color: item.couleur || 'var(--accent)' }}
              >
                {renderIcone(item.icone, { size: 22 })}
              </div>

              {/* Label + clé interne */}
              <div className="ref-editor__item-info">
                <span className="ref-editor__label">{item.label}</span>
                <span className="ref-editor__valeur">({item.valeur})</span>
              </div>

              {/* Pastille couleur */}
              {item.couleur && (
                <div
                  className="ref-editor__color-dot"
                  style={{ background: item.couleur }}
                  title={item.couleur}
                />
              )}

              {/* Actions */}
              <div className="ref-editor__actions">
                <button
                  className={`ref-editor__toggle ${item.actif ? 'ref-editor__toggle--on' : 'ref-editor__toggle--off'}`}
                  onClick={() => handleToggleActif(item)}
                  title={item.actif ? 'Désactiver' : 'Activer'}
                >
                  {item.actif ? <CheckCircle size={16} /> : <Circle size={16} />}
                </button>
                <button className="ref-editor__btn ref-editor__btn--edit"   onClick={() => openEdit(item)}><Pencil size={14} /></button>
                <button className="ref-editor__btn ref-editor__btn--delete" onClick={() => handleDelete(item)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FORMULAIRE */}
      {(isAdding || editingItem) && (
        <form className="ref-editor__form" onSubmit={handleSave}>
          <div className="ref-editor__form-title">
            {isAdding ? <><Plus size={14} /> Nouvelle entrée</> : <><Pencil size={14} /> Modifier &quot;{editingItem.label}&quot;</>}
          </div>

          {error && <div className="ref-editor__form-error"><CircleAlert size={14} /> {error}</div>}

          {/* PRÉVISUALISATION EN TEMPS RÉEL */}
          <div className="ref-editor__preview">
            <div className="ref-editor__preview-icon" style={{ color: formData.couleur }}>
              {renderIcone(formData.icone, { size: 28 })}
            </div>
            <div className="ref-editor__preview-info">
              <span className="ref-editor__preview-label">
                {formData.label || 'Aperçu...'}
              </span>
              {isAdding && (
                <span className="ref-editor__preview-valeur">
                  clé : {formData.label ? genererValeur(formData.label) : '—'}
                </span>
              )}
            </div>
          </div>

          <div className="ref-editor__form-fields">

            {/* NOM — une seule case */}
            <div className="ref-editor__field ref-editor__field--full">
              <label className="ref-editor__field-label required">Nom</label>
              <input
                type="text"
                value={formData.label}
                onChange={handleLabelChange}
                placeholder="Ex: Quad, Tracteur, Climatisation..."
                className="ref-editor__input"
                autoFocus
              />
              {isAdding && formData.label && (
                <span className="ref-editor__hint">
                  Clé générée automatiquement : <strong>{genererValeur(formData.label)}</strong>
                </span>
              )}
            </div>

            {/* ICÔNE — sélecteur palette */}
            <div className="ref-editor__field">
              <label className="ref-editor__field-label">Icône</label>
              <button
                type="button"
                className="ref-editor__icon-trigger"
                onClick={() => { setShowIconPicker(!showIconPicker); setShowColorPicker(false); }}
              >
                <span style={{ color: formData.couleur }}>
                  {renderIcone(formData.icone, { size: 18 })}
                </span>
                <span>{formData.icone}</span>
                <span className="ref-editor__trigger-arrow">▾</span>
              </button>
            </div>

            {/* COULEUR — palette + picker */}
            <div className="ref-editor__field">
              <label className="ref-editor__field-label">Couleur</label>
              <button
                type="button"
                className="ref-editor__color-trigger"
                onClick={() => { setShowColorPicker(!showColorPicker); setShowIconPicker(false); }}
              >
                <div className="ref-editor__color-swatch" style={{ background: formData.couleur }} />
                <span>{formData.couleur}</span>
                <span className="ref-editor__trigger-arrow">▾</span>
              </button>
            </div>

          </div>

          {/* PALETTE ICÔNES */}
          {showIconPicker && (
            <div className="ref-editor__icon-palette">
              {Object.entries(ICONES_CATALOGUE).map(([groupe, icones]) => (
                <div key={groupe} className="ref-editor__icon-groupe">
                  <div className="ref-editor__icon-groupe-title">{groupe}</div>
                  <div className="ref-editor__icon-grid">
                    {icones.map(({ nom, label }) => (
                      <button
                        key={nom}
                        type="button"
                        className={`ref-editor__icon-item ${formData.icone === nom ? 'ref-editor__icon-item--active' : ''}`}
                        onClick={() => handleIconeSelect(nom)}
                        title={label}
                      >
                        {renderIcone(nom, { size: 20, color: formData.icone === nom ? formData.couleur : 'currentColor' })}
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PALETTE COULEURS */}
          {showColorPicker && (
            <div className="ref-editor__color-palette">
              <div className="ref-editor__color-grid">
                {COULEURS_PALETTE.map(({ hex, label }) => (
                  <button
                    key={hex}
                    type="button"
                    className={`ref-editor__color-item ${formData.couleur === hex ? 'ref-editor__color-item--active' : ''}`}
                    style={{ background: hex }}
                    onClick={() => { setFormData(p => ({ ...p, couleur: hex })); }}
                    title={label}
                  />
                ))}
              </div>
              {/* Color picker RGB libre */}
              <div className="ref-editor__color-custom">
                <label className="ref-editor__field-label">Couleur personnalisée (RGB)</label>
                <div className="ref-editor__color-custom-row">
                  <input
                    type="color"
                    value={formData.couleur}
                    onChange={(e) => setFormData(p => ({ ...p, couleur: e.target.value }))}
                    className="ref-editor__color-picker"
                  />
                  <input
                    type="text"
                    value={formData.couleur}
                    onChange={(e) => setFormData(p => ({ ...p, couleur: e.target.value }))}
                    placeholder="#2980b9"
                    className="ref-editor__input"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* BOUTONS */}
          <div className="ref-editor__form-btns">
            <button type="button" className="ref-editor__form-btn ref-editor__form-btn--cancel" onClick={resetForm}>
              Annuler
            </button>
            <button type="submit" className="ref-editor__form-btn ref-editor__form-btn--save" disabled={saving}>
              {saving ? <Loader size={14} /> : isAdding ? <><Save size={14} /> Créer</> : <><Save size={14} /> Modifier</>}
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