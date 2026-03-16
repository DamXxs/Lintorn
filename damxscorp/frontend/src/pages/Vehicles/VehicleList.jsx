// /frontend/src/pages/Vehicles/VehicleList.jsx
import React, { useState, useEffect } from 'react';
import { getAllVehicules, searchVehicules, removeVehicule, getVehiculeIcon } from '../../utils/vehicleService';
import VehicleDetail from './VehicleDetail';
import VehicleForm from './VehicleForm';
import { Search, Plus, X } from 'lucide-react';
import './VehicleList.css';

const VehicleList = () => {

  const [vehicules, setVehicules]           = useState([]);
  const [filtered, setFiltered]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedVehicule, setSelectedVehicule] = useState(null);
  const [isFormOpen, setIsFormOpen]         = useState(false);
  const [editingVehicule, setEditingVehicule] = useState(null);

  // ── CHARGEMENT ──────────────────────────────────────────────────
  const loadVehicules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllVehicules();
      setVehicules(data);
      setFiltered(data);
    } catch (err) {
      setError('Impossible de charger les véhicules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVehicules(); }, []);

  // ── RECHERCHE ────────────────────────────────────────────────────
  useEffect(() => {
    setFiltered(searchVehicules(vehicules, searchQuery));
  }, [searchQuery, vehicules]);

  // ── SUPPRESSION ──────────────────────────────────────────────────
  const handleDelete = async (vehicule) => {
    if (!window.confirm(`Supprimer "${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})" ?`)) return;
    try {
      await removeVehicule(vehicule.id);
      setSelectedVehicule(null);
      await loadVehicules();
    } catch (err) {
      alert('❌ Erreur lors de la suppression');
    }
  };

  // ── ÉTATS ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="vehicles-loading">
      <div className="spinner"></div>
      <p>Chargement des véhicules...</p>
    </div>
  );

  if (error) return (
    <div className="vehicles-error">
      <p>❌ {error}</p>
      <button onClick={loadVehicules}>Réessayer</button>
    </div>
  );

  // ── RENDU ────────────────────────────────────────────────────────
  return (
    <div className="vehicles-page">

      {/* EN-TÊTE */}
      <div className="vehicles-header">
        <div className="vehicles-header__left">
          <h1 className="vehicles-title">🚗 Véhicules</h1>
          <span className="vehicles-count">
            {filtered.length} véhicule{filtered.length > 1 ? 's' : ''}
          </span>
        </div>
        <button
          className="btn-new-vehicle"
          onClick={() => { setEditingVehicule(null); setIsFormOpen(true); }}
        >
          <Plus size={16} /> Nouveau véhicule
        </button>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="vehicles-search">
        <Search size={16} className="vehicles-search__icon" />
        {searchQuery && (
          <button className="vehicles-search__clear" onClick={() => setSearchQuery('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* GRILLE */}
      {filtered.length === 0 ? (
        <div className="vehicles-empty">
          <p>😔 Aucun véhicule trouvé</p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>Effacer la recherche</button>
          )}
        </div>
      ) : (
        <div className="vehicles-grid">
          {filtered.map(vehicule => (
            <div
              key={vehicule.id}
              className="vehicle-card"
              onClick={() => setSelectedVehicule(vehicule)}
            >
              {/* Icône type véhicule */}
              <div className="vehicle-card__icon">
                {getVehiculeIcon(vehicule.type_vehicule)}
              </div>

              {/* Plaque */}
              <div className="vehicle-card__plate">
                {vehicule.immatriculation}
              </div>

              {/* Marque + modèle */}
              <div className="vehicle-card__model">
                <span className="vehicle-card__marque">{vehicule.marque}</span>
                <span className="vehicle-card__modele">{vehicule.modele}</span>
              </div>

              {/* Infos */}
              <div className="vehicle-card__infos">
                {vehicule.annee && (
                  <div className="vehicle-card__info-row">
                    <span className="vehicle-card__info-icon">📅</span>
                    <span>{vehicule.annee}</span>
                  </div>
                )}
                {vehicule.proprietaire_nom && (
                  <div className="vehicle-card__info-row">
                    <span className="vehicle-card__info-icon">👤</span>
                    <span>{vehicule.proprietaire_nom}</span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODALE DÉTAIL */}
      {selectedVehicule && (
        <VehicleDetail
          vehicule={selectedVehicule}
          onClose={() => setSelectedVehicule(null)}
          onEdit={(v) => {
            setEditingVehicule(v);
            setSelectedVehicule(null);
            setIsFormOpen(true);
          }}
          onDelete={handleDelete}
        />
      )}

      {/* MODALE FORMULAIRE */}
      {isFormOpen && (
        <VehicleForm
          editingVehicule={editingVehicule}
          onClose={() => { setIsFormOpen(false); setEditingVehicule(null); }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingVehicule(null);
            loadVehicules();
          }}
        />
      )}

    </div>
  );
};

export default VehicleList;