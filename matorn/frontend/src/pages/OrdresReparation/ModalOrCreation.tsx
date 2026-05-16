// /frontend/src/pages/OrdresReparation/ModalOrCreation.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../../components/shared/Modals/Modal';
import { Wrench, User, Car } from '../../utils/icons';

// Services API
import { createOrdre, OrdreReparationDetail } from './orService';
import { fetchClients, fetchVehiculesByClient } from '../../services/api';

// Styles
import '../../components/shared/Modals/forms.css';

// =============================================================================
// TYPES
// =============================================================================

// Mini-types pour ce qu'on reçoit de fetchClients et fetchVehiculesByClient
interface ClientLite {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
}

interface VehiculeLite {
  id: number;
  marque: string;
  modele: string;
  immatriculation: string;
}

interface OrPrefill {
  rdvId?:      number;
  clientId?:   number;
  vehiculeId?: number | null;
  description?: string;
}

interface ModalOrCreationProps {
  onCreated: (ordre: OrdreReparationDetail) => void;
  onClose: () => void;
  prefill?: OrPrefill;
}

// =============================================================================
// COMPOSANT
// =============================================================================
const ModalOrCreation: React.FC<ModalOrCreationProps> = ({ onCreated, onClose, prefill }) => {

  // ── État : listes pour les dropdowns ─────────────────────────
  const [clients, setClients]     = useState<ClientLite[]>([]);
  const [vehicules, setVehicules] = useState<VehiculeLite[]>([]);

  // ── État : sélections de l'utilisateur ───────────────────────
  const [clientId, setClientId]     = useState<number | ''>(prefill?.clientId ?? '');
  const [vehiculeId, setVehiculeId] = useState<number | ''>(prefill?.vehiculeId ?? '');
  const [description, setDescription] = useState(prefill?.description ?? '');
  const [kilometrage, setKilometrage] = useState<string>('');

  // ── État : UI ────────────────────────────────────────────────
  const [loadingClients, setLoadingClients]     = useState(true);
  const [loadingVehicules, setLoadingVehicules] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // ── Chargement des clients au montage ────────────────────────
  useEffect(() => {
    const charger = async () => {
      try {
        const data = await fetchClients();
        setClients(data);
      } catch {
        setErreur('Impossible de charger les clients');
      } finally {
        setLoadingClients(false);
      }
    };
    charger();
  }, []);

  // ── Chargement des véhicules quand client change ─────────────
  // Quand clientId change, on recharge les véhicules de ce client
  useEffect(() => {
    if (!clientId) {
      setVehicules([]);
      setVehiculeId('');
      return;
    }

    const charger = async () => {
      setLoadingVehicules(true);
      try {
        const data = await fetchVehiculesByClient(clientId as number);
        setVehicules(data);
        // Priorité : prefill vehiculeId → auto si 1 seul → vide
        if (prefill?.vehiculeId && data.some(v => v.id === prefill.vehiculeId)) {
          setVehiculeId(prefill.vehiculeId);
        } else if (data.length === 1) {
          setVehiculeId(data[0].id);
        } else {
          setVehiculeId('');
        }
      } catch {
        setErreur('Impossible de charger les véhicules de ce client');
      } finally {
        setLoadingVehicules(false);
      }
    };
    charger();
  }, [clientId]);

  // ── Soumission du formulaire ─────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    // Validation simple
    if (!clientId || !vehiculeId) {
      setErreur('Le client et le véhicule sont obligatoires');
      return;
    }

    setSaving(true);
    try {
      // Préparation des données
      const data = {
        client: clientId as number,
        vehicule: vehiculeId as number,
        description_travaux: description,
        kilometrage_entree: kilometrage ? parseInt(kilometrage) : null,
        rdv: prefill?.rdvId || null,
      };

      // Appel API
      const nouveau = await createOrdre(data);

      // Succès : on notifie le parent
      onCreated(nouveau);
    } catch (err: any) {
      setErreur(err.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  // ── Footer de la modale ──────────────────────────────────────
  const footer = (
    <>
      <button
        type="button"
        className="form-btn form-btn--cancel"
        onClick={onClose}
        disabled={saving}
      >
        Annuler
      </button>
      <button
        type="submit"
        form="form-or-creation"
        className="form-btn form-btn--save"
        disabled={saving || !clientId || !vehiculeId}
      >
        {saving ? 'Création...' : '✏️ Créer et ouvrir'}
      </button>
    </>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════
  return (
    <Modal
      title="Nouvel ordre de réparation"
      titleIcon={<Wrench size={20} />}
      onClose={onClose}
      footer={footer}
    >
      <form id="form-or-creation" onSubmit={handleSubmit} noValidate>

        {/* Erreur globale */}
        {erreur && <div className="form-error-global">⚠️ {erreur}</div>}

        {/* === SECTION : CLIENT === */}
        <div className="form-section">
          <p className="form-section__title">
            <User size={14} /> Client
          </p>

          <div className="form-group">
            <label className="form-label required">Sélectionner un client</label>
            <select
              className="form-input"
              value={clientId}
              onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : '')}
              disabled={loadingClients}
              required
            >
              <option value="">
                {loadingClients ? 'Chargement...' : '— Choisir un client —'}
              </option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} {c.prenom} {c.telephone && `— ${c.telephone}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* === SECTION : VÉHICULE === */}
        <div className="form-section">
          <p className="form-section__title">
            <Car size={14} /> Véhicule
          </p>

          <div className="form-group">
            <label className="form-label required">Sélectionner un véhicule</label>
            <select
              className="form-input"
              value={vehiculeId}
              onChange={(e) => setVehiculeId(e.target.value ? Number(e.target.value) : '')}
              disabled={!clientId || loadingVehicules}
              required
            >
              <option value="">
                {!clientId
                  ? '— Choisissez d\'abord un client —'
                  : loadingVehicules
                    ? 'Chargement...'
                    : vehicules.length === 0
                      ? 'Aucun véhicule pour ce client'
                      : '— Choisir un véhicule —'}
              </option>
              {vehicules.map(v => (
                <option key={v.id} value={v.id}>
                  {v.marque} {v.modele} — {v.immatriculation}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* === SECTION : INFOS INITIALES (optionnelles) === */}
        <div className="form-section">
          <p className="form-section__title">
            📋 Informations initiales <span style={{ color: '#888', fontSize: '11px', fontWeight: 400 }}>(optionnel)</span>
          </p>

          <div className="form-group">
            <label className="form-label">Kilométrage à l'entrée</label>
            <input
              type="number"
              className="form-input"
              value={kilometrage}
              onChange={(e) => setKilometrage(e.target.value)}
              placeholder="Ex : 142500"
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description des travaux demandés</label>
            <textarea
              className="form-input form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : Vidange + filtre à huile + contrôle plaquettes avant"
              rows={3}
            />
          </div>
        </div>

      </form>
    </Modal>
  );
};

export default ModalOrCreation;