// /frontend/src/pages/Vehicles/VehicleList.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllVehicules, searchVehicules, removeVehicule } from './vehicleService';
import useVehiculeHelpers from '../../hooks/useVehiculeHelpers';
import VehicleDetail from './VehicleDetail';
import VehicleForm from './VehicleForm';
import { Plus, Car, CalendarDays, User } from '../../utils/icons';
import FrenchPlateInput from '../../components/shared/plates/FrenchPlateInput';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import PageHeader   from '../../components/shared/PageHeader';
import SearchBar    from '../../components/shared/SearchBar/SearchBar';
import useDelete    from '../../hooks/useDelete';
import './VehicleList.css';
import '../../components/shared/list-page.css';

const VehicleList = () => {
  const location = useLocation();
  const { getVehiculeIcon } = useVehiculeHelpers(); // ← hook dynamique

  const [vehicules, setVehicules]               = useState([]);
  const [filtered, setFiltered]                 = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedVehicule, setSelectedVehicule] = useState(null);
  const [isFormOpen, setIsFormOpen]             = useState(false);
  const [editingVehicule, setEditingVehicule]   = useState(null);

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

  useEffect(() => {
    setFiltered(searchVehicules(vehicules, searchQuery));
  }, [searchQuery, vehicules]);

  useEffect(() => {
    const openVehiculeId = location.state?.openVehiculeId;
    if (openVehiculeId && vehicules.length > 0) {
      const vehicule = vehicules.find(v => v.id === openVehiculeId);
      if (vehicule) setSelectedVehicule(vehicule);
      window.history.replaceState({}, '');
    }
  }, [location.state, vehicules]);

  const { handleDelete } = useDelete({
    deleteService: removeVehicule,
    onSuccess: async () => {
      setSelectedVehicule(null);
      await loadVehicules();
    },
    confirmMessage: (v) => `Supprimer "${v.marque} ${v.modele} (${v.immatriculation})" ?`,
  });

  if (loading) return <LoadingState message="Chargement des véhicules..." />;
  if (error)   return <ErrorState message={error} onRetry={loadVehicules} />;

  return (
    <div className="list-page">

      <PageHeader
        title={<><Car size={18} /> Véhicules</>}
        count={filtered.length}
        countLabel="véhicule"
        onAdd={() => { setEditingVehicule(null); setIsFormOpen(true); }}
        addLabel="Nouveau véhicule"
        addIcon={<Plus size={16} />}
      />

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Rechercher par plaque, marque, modèle, propriétaire..."
      />

      {filtered.length === 0 ? (
        <div className="vehicles-empty">
          <p>Aucun véhicule trouvé</p>
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
                <FrenchPlateInput value={vehicule.immatriculation} size="sm" readOnly />
              </div>
              <div className="vehicle-card__model">
                <span className="vehicle-card__marque">{vehicule.marque}</span>
                <span className="vehicle-card__modele">{vehicule.modele}</span>
              </div>
              <div className="vehicle-card__infos">
                {vehicule.annee && (
                  <div className="vehicle-card__info-row">
                    <span className="vehicle-card__info-icon"><CalendarDays size={12} /></span>
                    <span>{vehicule.annee}</span>
                  </div>
                )}
                {vehicule.proprietaire_nom && (
                  <div className="vehicle-card__info-row">
                    <span className="vehicle-card__info-icon"><User size={12} /></span>
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