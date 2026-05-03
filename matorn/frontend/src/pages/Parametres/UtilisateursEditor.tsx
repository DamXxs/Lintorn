// /frontend/src/pages/Parametres/UtilisateursEditor.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { utilisateursService, UserData } from '../../services/utilisateursService';
import { Shield, Pencil, Save, Loader, CircleAlert, Plus } from '../../utils/icons';

// ── Libellés des rôles ────────────────────────────────────────────────────────
const ROLES = [
  { value: 'user',       label: 'Utilisateur',          couleur: '#888' },
  { value: 'superuser',  label: 'Super Utilisateur',    couleur: '#2980b9' },
  { value: 'admin',      label: 'Administrateur',       couleur: '#8e44ad' },
  { value: 'superadmin', label: 'Super Administrateur', couleur: '#e67e22' },
];

const getRoleMeta = (role: string) =>
  ROLES.find(r => r.value === role) ?? ROLES[0];

// ── Formulaire vide ───────────────────────────────────────────────────────────
const FORM_VIDE = { username: '', email: '', password: '', role: 'user' };

const UtilisateursEditor = () => {
  const { user: moi, hasRole } = useAuth();

  const [users,      setUsers]      = useState<UserData[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [erreur,     setErreur]     = useState<string | null>(null);

  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [isAdding,   setIsAdding]   = useState(false);
  const [formData,   setFormData]   = useState(FORM_VIDE);
  const [saving,     setSaving]     = useState(false);
  const [formErreur, setFormErreur] = useState<string | null>(null);

  // ── Chargement ───────────────────────────────────────────────────────────
  const chargerUsers = async () => {
    try {
      setLoading(true);
      const data = await utilisateursService.getAll();
      setUsers(data);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerUsers(); }, []);

  // ── Ouvrir édition ───────────────────────────────────────────────────────
  const ouvrirEdit = (u: UserData) => {
    setEditingId(u.id);
    setIsAdding(false);
    setFormData({ username: u.username, email: u.email || '', password: '', role: u.role });
    setFormErreur(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData(FORM_VIDE);
    setFormErreur(null);
  };

  // ── Toggle actif/inactif ─────────────────────────────────────────────────
  const toggleActif = async (u: UserData) => {
    try {
      await utilisateursService.update(u.id, { is_active: !u.is_active });
      chargerUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  };

  // ── Sauvegarder ──────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErreur(null);

    if (!formData.username.trim()) {
      setFormErreur("Le nom d'utilisateur est obligatoire");
      return;
    }
    if (isAdding && !formData.password) {
      setFormErreur('Le mot de passe est obligatoire pour un nouvel utilisateur');
      return;
    }

    try {
      setSaving(true);

      if (isAdding) {
        await utilisateursService.create({
          username: formData.username.trim(),
          password: formData.password,
          email:    formData.email.trim(),
          role:     formData.role,
        });
      } else if (editingId) {
        // On envoie seulement les champs remplis
        const payload: Partial<typeof formData> = {
          email: formData.email.trim(),
          role:  formData.role,
        };
        if (formData.password) payload.password = formData.password;
        await utilisateursService.update(editingId, payload);
      }

      resetForm();
      chargerUsers();
    } catch (err) {
      setFormErreur(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────
  if (loading) return <p className="param-placeholder"><Loader size={14} /> Chargement...</p>;
  if (erreur)  return <p style={{ color: '#e74c3c' }}>{erreur}</p>;

  return (
    <div className="simple-editor">

      {/* ── LISTE ── */}
      <div className="simple-editor__list">
        {users.map(u => {
          const roleMeta = getRoleMeta(u.role);
          const estMoi   = u.id === moi?.id;

          return (
            <div
              key={u.id}
              className={[
                'simple-editor__row',
                !u.is_active                ? 'simple-editor__row--inactive' : '',
                editingId === u.id          ? 'simple-editor__row--editing'  : '',
              ].join(' ')}
            >
              {/* Avatar */}
              <div
                className="simple-editor__avatar"
                style={{ background: roleMeta.couleur }}
              >
                {u.username.slice(0, 2).toUpperCase()}
              </div>

              {/* Infos */}
              <div className="simple-editor__info">
                <span className="simple-editor__nom">
                  {u.username}
                  {estMoi && <em style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>(vous)</em>}
                </span>
                <span className="simple-editor__meta">
                  <span style={{ color: roleMeta.couleur, fontWeight: 600 }}>
                    {roleMeta.label}
                  </span>
                  {u.email && ` — ${u.email}`}
                  {!u.is_active && <em style={{ color: '#e74c3c' }}> — désactivé</em>}
                </span>
              </div>

              {/* Actions */}
              <div className="simple-editor__actions">
                {/* Toggle actif — désactivé pour soi-même */}
                {!estMoi && (
                  <button
                    className={`simple-editor__toggle ${u.is_active ? 'on' : 'off'}`}
                    onClick={() => toggleActif(u)}
                    title={u.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {u.is_active ? '✓' : '✗'}
                  </button>
                )}
                <button
                  className="simple-editor__btn edit"
                  onClick={() => ouvrirEdit(u)}
                  title="Modifier"
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FORMULAIRE ── */}
      {(isAdding || editingId !== null) && (
        <form className="simple-editor__form" onSubmit={handleSave}>
          <div className="simple-editor__form-title">
            {isAdding
              ? <><Plus size={14} /> Nouvel utilisateur</>
              : <><Pencil size={14} /> Modifier l'utilisateur</>
            }
          </div>

          {formErreur && (
            <div className="simple-editor__error">
              <CircleAlert size={14} /> {formErreur}
            </div>
          )}

          <div className="simple-editor__form-fields">

            {/* USERNAME — seulement à la création */}
            {isAdding && (
              <div className="simple-editor__field simple-editor__field--full">
                <label className="simple-editor__label">
                  Identifiant <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                  placeholder="Ex: jean.dupont"
                  className="simple-editor__input"
                  autoFocus
                />
              </div>
            )}

            {/* EMAIL */}
            <div className="simple-editor__field simple-editor__field--full">
              <label className="simple-editor__label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="email@garage.fr"
                className="simple-editor__input"
              />
            </div>

            {/* MOT DE PASSE */}
            <div className="simple-editor__field simple-editor__field--full">
              <label className="simple-editor__label">
                Mot de passe
                {!isAdding && <span style={{ fontWeight: 400, color: '#666' }}> (laisser vide = inchangé)</span>}
                {isAdding && <span className="required"> *</span>}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                placeholder={isAdding ? 'Minimum 6 caractères' : '••••••••'}
                className="simple-editor__input"
              />
            </div>

            {/* RÔLE */}
            <div className="simple-editor__field simple-editor__field--full">
              <label className="simple-editor__label">Rôle</label>
              <select
                value={formData.role}
                onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                className="simple-editor__input"
              >
                {ROLES
                  // Un Admin ne peut pas attribuer le rôle SuperAdmin
                  .filter(r => hasRole('superadmin') || r.value !== 'superadmin')
                  .map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))
                }
              </select>
            </div>

          </div>

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
      {!isAdding && editingId === null && (
        <button
          className="simple-editor__add-btn"
          onClick={() => { setIsAdding(true); setEditingId(null); }}
        >
          ＋ Ajouter un utilisateur
        </button>
      )}
    </div>
  );
};

export default UtilisateursEditor;