// /frontend/src/components/shared/inline/VehicleFormInLine.tsx
//
// Bloc d'édition d'un véhicule inline (sans appel API direct).
// Utilisé dans ClientForm pour ajouter des véhicules lors de la création d'un client.
// Le parent collecte les données et crée les véhicules après avoir créé le client.
// Usage : <VehicleFormInLine vehicule={v} index={0} onChange={fn} onRemove={fn} />

import React from 'react';
import { useReferentiels } from '../../../context/ReferentielsContext';
import { formatImmatriculation } from '../../../utils/validators';
import PlateSelector from '../plates/PlateSelector';
import SivButton, { SivResult } from '../SivButton/SivButton';
import { X } from '../../../utils/icons';
import './VehicleFormInLine.css';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface VehiculeInline {
  _tempId:         number | string;
  type_vehicule:   string;
  immatriculation: string;
  marque:          string;
  modele:          string;
  annee:           string;
  vin?:            string;
}

interface Props {
  vehicule: VehiculeInline;
  index:    number;
  onChange: (tempId: number | string, field: string, value: string) => void;
  onRemove: (tempId: number | string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

const VehicleFormInLine: React.FC<Props> = ({ vehicule, index, onChange, onRemove }) => {

  const { getTypeVehicules } = useReferentiels();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    // Changer le type réinitialise la plaque
    if (name === 'type_vehicule') {
      onChange(vehicule._tempId, 'type_vehicule', value);
      onChange(vehicule._tempId, 'immatriculation', '');
      return;
    }

    // Formatage plaque selon le type courant
    if (name === 'immatriculation') {
      value = formatImmatriculation(value, { vehicleType: vehicule.type_vehicule });
    }

    onChange(vehicule._tempId, name, value);
  };

  // PlateSelector attend un onChange compatible input
  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatImmatriculation(e.target.value, { vehicleType: vehicule.type_vehicule });
    onChange(vehicule._tempId, 'immatriculation', formatted);
  };

  // Résultat SIV → pré-remplir marque, modèle, année, VIN
  const handleSivResult = (data: SivResult) => {
    if (data.marque)        onChange(vehicule._tempId, 'marque',        data.marque);
    if (data.modele)        onChange(vehicule._tempId, 'modele',        data.modele);
    if (data.annee)         onChange(vehicule._tempId, 'annee',         data.annee);
    if (data.type_vehicule) onChange(vehicule._tempId, 'type_vehicule', data.type_vehicule);
    if (data.vin)           onChange(vehicule._tempId, 'vin',           data.vin);
  };

  return (
    <div className="vfi-block">

      {/* En-tête du bloc */}
      <div className="vfi-block__header">
        <span className="vfi-block__num">Véhicule {index + 1}</span>
        <button
          type="button"
          className="vfi-block__remove"
          onClick={() => onRemove(vehicule._tempId)}
          title="Retirer ce véhicule"
        >
          <X size={14} />
        </button>
      </div>

      {/* Type + Immatriculation + SIV */}
      <div className="vfi-row-2">
        <div className="vfi-group">
          <label className="vfi-label">Type</label>
          <select
            name="type_vehicule"
            value={vehicule.type_vehicule}
            onChange={handleChange}
            className="vfi-input"
          >
            {getTypeVehicules().map(t => (
              <option key={t.valeur} value={t.valeur}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="vfi-group">
          <label className="vfi-label">Immatriculation</label>
          <div className="vfi-plate-row">
            <PlateSelector
              vehicleType={vehicule.type_vehicule}
              name="immatriculation"
              value={vehicule.immatriculation}
              onChange={handlePlateChange}
              size="sm"
            />
            <SivButton
              immatriculation={vehicule.immatriculation}
              vehicleType={vehicule.type_vehicule}
              onResult={handleSivResult}
            />
          </div>
        </div>
      </div>

      {/* Marque + Modèle */}
      <div className="vfi-row-2">
        <div className="vfi-group">
          <label className="vfi-label">Marque</label>
          <input
            type="text" name="marque" value={vehicule.marque}
            onChange={handleChange} placeholder="Peugeot"
            className="vfi-input"
          />
        </div>
        <div className="vfi-group">
          <label className="vfi-label">Modèle</label>
          <input
            type="text" name="modele" value={vehicule.modele}
            onChange={handleChange} placeholder="308"
            className="vfi-input"
          />
        </div>
      </div>

      {/* Année + VIN */}
      <div className="vfi-row-2">
        <div className="vfi-group vfi-group--year">
          <label className="vfi-label">Année</label>
          <input
            type="number" name="annee" value={vehicule.annee}
            onChange={handleChange} placeholder="2020"
            min="1900" max="2030"
            className="vfi-input"
          />
        </div>
        <div className="vfi-group">
          <label className="vfi-label">VIN</label>
          <input
            type="text" name="vin" value={vehicule.vin || ''}
            onChange={handleChange} placeholder="VF1XXXXXXXXXXXXXX"
            maxLength={17}
            className="vfi-input"
          />
        </div>
      </div>

    </div>
  );
};

export default VehicleFormInLine;
