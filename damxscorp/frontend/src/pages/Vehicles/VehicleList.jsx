// /frontend/src/pages/Vehicles/VehicleList.jsx
import React, { useState, useEffect } from 'react';
import { getAllVehicules, searchVehicules, removeVehicule, getVehiculeIcon } from '../../utils/vehicleService';
import VehicleDetail from './VehicleDetail';
import VehicleForm from './VehicleForm';
import { Plus } from 'lucide-react';
import FrenchPlate  from '../../components/shared/FrenchPlate';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import PageHeader   from '../../components/shared/PageHeader';
import SearchBar    from '../../components/shared/SearchBar';
import useDelete    from '../../hooks/useDelete';
import './VehicleList.css';

const VehicleList = () => {

  const [vehicules, setVehicules]               = useState([]);
  const [filtered, setFiltered]                 = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedVehicule, setSelectedVehicule] = useState(null);
  const [isFormOpen, setIsFormOpen]             = useState(false);
  const [editingVehicule, setEditingVehicule]   = useState(null);

  // ── Chargement ───────────────────────────────────────────────────
  const loadVehicules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllVehicules();
      setVehicules(data);
      setFiltered(data);
    } catch {
      setError('Impossible de charger les véhicules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVehicules(); }, []);

  // ── Recherche ────────────────────────────────────────────────────
  useEffect(() => {
    setFiltered(searchVehicules(vehicules, searchQuery));
  }, [searchQuery, vehicules]);

  // ── Suppression via le hook centralisé ──────────────────────────
  const { handleDelete } = useDelete({
    deleteService: removeVehicule,
    onSuccess: async () => {
      setSelectedVehicule(null);
      await loadVehicules();
    },
    confirmMessage: (v) => `Supprimer "${v.marque} ${v.modele} (${v.immatriculation})" ?`,
  });

  // ── États ────────────────────────────────────────────────────────
  if (loading) return <LoadingState message="Chargement des véhicules..." />;
  if (error)   return <ErrorState message={error} onRetry={loadVehicules} />;

  // ── Rendu ────────────────────────────────────────────────────────
  return (
    <div className="vehicles-page">

      {/* EN-TÊTE */}
      <PageHeader
        title="🚗 Véhicules"
        count={filtered.length}
        countLabel="véhicule"
        onAdd={() => { setEditingVehicule(null); setIsFormOpen(true); }}
        addLabel="Nouveau véhicule"
        addIcon={<Plus size={16} />}
      />

      {/* BARRE DE RECHERCHE */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Rechercher par plaque, marque, modèle, propriétaire..."
      />

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
              <div className="vehicle-card__icon">
                {getVehiculeIcon(vehicule.type_vehicule)}
              </div>
              <div className="vehicle-card__plate">
                <FrenchPlate value={vehicule.immatriculation} size="sm" />
              </div>
              <div className="vehicle-card__model">
                <span className="vehicle-card__marque">{vehicule.marque}</span>
                <span className="vehicle-card__modele">{vehicule.modele}</span>
              </div>
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
