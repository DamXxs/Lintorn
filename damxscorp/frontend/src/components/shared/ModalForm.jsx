// /src/components/shared/ModalForm.jsx
import React, { useState, useEffect } from 'react';
import { VEHICLE_TYPES, INTERVENTION_TYPES } from '../../utils/constants';
import { fetchDepartements } from '../../services/api';
import './ModalForm.css';
import logger from '../../utils/logger';
import AddressAutocomplete from './AddressAutocomplete';
import { useReferentiels } from '../../context/ReferentielsContext';
import { User, Car, CalendarClock, FileText, X, Save, Search } from '../../utils/icons';



const ModalForm = ({isOpen, onClose, initialData, prefilledDate, onSubmit}) => {
    
    // =========================================================================
    // ÉTAT DU FORMULAIRE
    // =========================================================================
    const { getTypeVehicules, getTypeInterventions } = useReferentiels();

    // Départements chargés depuis l'API (remplace la constante hardcodée)
    const [departements, setDepartements] = useState([]);

    // Chargement des départements actifs au montage du composant
    useEffect(() => {
        fetchDepartements(true).then(data => {
            setDepartements(data);
            // Si aucun département n'est sélectionné, prendre le premier actif
            if (data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    departement: prev.departement || data[0].code,
                }));
            }
        }).catch(() => {
            // En cas d'erreur API, on garde la valeur actuelle
        });
    }, []);

    const [formData, setFormData] = useState({
        departement: 'ATELIER',
        typeIntervention: 'ENTRETIEN_VP2',
        clientName: '',
        clientFirstName: '',
        clientPhone: '',
        clientEmail: '',
        clientAddress: '',
        vehicleType: 'VOITURE',
        plate: '',
        vehicleBrand: '',
        vehicleModel: '',
        vehicleYear: '',
        vin: '',
        dateStart: '',
        timeStart: '08:00',
        dateEnd: '',
        timeEnd: '09:00',
        description: ''
    });

    // =========================================================================
    // INITIALISATION DU FORMULAIRE
    // =========================================================================
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
            }));
        } else if (prefilledDate) {
            const dateObj = new Date(prefilledDate);
            const dateStr = dateObj.toISOString().split('T')[0];
            const timeStr = dateObj.toTimeString().slice(0, 5);
            
            const endDateObj = new Date(dateObj.getTime() + 60 * 60 * 1000);
            const endTimeStr = endDateObj.toTimeString().slice(0, 5);
            
            setFormData({
                departement: 'ATELIER',
                typeIntervention: 'ENTRETIEN_VP2',
                clientName: '',
                clientFirstName: '',
                clientPhone: '',
                clientEmail: '',
                clientAddress: '',
                vehicleType: 'VOITURE',
                plate: '',
                vehicleBrand: '',
                vehicleModel: '',
                vehicleYear: '',
                vin: '',
                dateStart: dateStr,
                timeStart: timeStr,
                dateEnd: dateStr,
                timeEnd: endTimeStr,
                description: ''
            });
        } else {
            setFormData({
                departement: 'ATELIER',
                typeIntervention: 'ENTRETIEN_VP2',
                clientName: '',
                clientFirstName: '',
                clientPhone: '',
                clientEmail: '',
                clientAddress: '',
                vehicleType: 'VOITURE',
                plate: '',
                vehicleBrand: '',
                vehicleModel: '',
                vehicleYear: '',
                vin: '',
                dateStart: '',
                timeStart: '08:00',
                dateEnd: '',
                timeEnd: '09:00',
                description: ''
            });
        }
    }, [initialData, prefilledDate]);

    // =========================================================================
    // GESTION DES CHANGEMENTS
    // =========================================================================
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        logger.form.change(name, value);
    };

    // =========================================================================
    // FONCTION API SIV
    // =========================================================================
    const handleSivSearch = () => {
        console.log('🔍 Recherche SIV pour : ', formData.plate);
        alert('API SIV pas encore implémentée - En développement !');
    };

    // =========================================================================
    // RENDU DU FORMULAIRE
    // =========================================================================
    return (
        <div id="modal-rdv">
            <div className="modal-content">
                
                {/* ===== HEADER : SELECT DÉPARTEMENT (chargé depuis l'API) ===== */}
                <div className="modal-header">
                    <select
                        name="departement"
                        value={formData.departement}
                        onChange={handleChange}
                    >
                        {departements.length === 0 ? (
                            <option value="ATELIER">Chargement...</option>
                        ) : (
                            departements.map(dept => (
                                <option key={dept.code} value={dept.code}>
                                    {dept.nom}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                {/* ===== BODY : FORMULAIRE SCROLLABLE ===== */}
                <div className="modal-body">
                    <form onSubmit={(e) => { 
                        e.preventDefault();
                        logger.form.submit('ModalForm', formData);
                        onSubmit(formData); 
                    }}>
                        
                        {/* ===== 1. INFORMATIONS CLIENT ===== */}
                        <div className="form-section">
                            <div className="form-section-title"><User size={14} /> Informations Client</div>
                            
                            <div className="form-grid-2col">
                                <div className="form-group">
                                    <label className="required">Nom</label>
                                    <input 
                                        type="text" 
                                        name="clientName" 
                                        value={formData.clientName} 
                                        onChange={handleChange} 
                                        placeholder="Dupont"
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Prénom</label>
                                    <input 
                                        type="text" 
                                        name="clientFirstName" 
                                        value={formData.clientFirstName} 
                                        onChange={handleChange} 
                                        placeholder="Jean"
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2col">
                                <div className="form-group">
                                    <label>Téléphone</label>
                                    <input 
                                        type="tel" 
                                        name="clientPhone" 
                                        value={formData.clientPhone} 
                                        onChange={handleChange} 
                                        placeholder="06 12 34 56 78"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input 
                                        type="email" 
                                        name="clientEmail" 
                                        value={formData.clientEmail} 
                                        onChange={handleChange} 
                                        placeholder="dupont@email.com"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Adresse</label>
                                <AddressAutocomplete 
                                    value={formData.clientAddress}
                                    onChange={(value) => setFormData(prev => ({ ...prev, clientAddress: value }))}
                                    onSelect={(adresse) => {
                                        setFormData(prev => ({ 
                                            ...prev, 
                                            clientAddress: adresse.adresse, 
                                        }));
                                        
                                    }}                                
                                />
                            </div>
                        </div>

                        {/* ===== 2. INFORMATIONS VÉHICULE (si le département le requiert) ===== */}
                        {departements.find(d => d.code === formData.departement)?.requiert_vehicule && (
                            <div className="form-section">
                                <div className="form-section-title"><Car size={14} /> Informations Véhicule</div>
                                
                                {/* Immatriculation + Bouton SIV */}
                                <div className="form-group">
                                    <label className="required">Immatriculation</label>
                                    <div className="input-with-button">
                                        <input 
                                            type="text" 
                                            name="plate" 
                                            value={formData.plate} 
                                            onChange={handleChange}
                                            placeholder="AB-123-CD"
                                            required
                                        />
                                        <button 
                                            type="button" 
                                            className="btn-api-siv"
                                            onClick={handleSivSearch}
                                            disabled={!formData.plate}
                                        >
                                            <Search size={14} /> SIV
                                        </button>
                                    </div>
                                </div>

                                {/* Type véhicule + Type intervention */}
                                <div className="form-grid-2col">
                                    <div className="form-group">
                                        <label className="required">Type de véhicule</label>
                                        <select 
                                            name="vehicleType" 
                                            value={formData.vehicleType} 
                                            onChange={handleChange}
                                        >
                                            {getTypeVehicules().map(t => (
                                                <option key={t.valeur} value={t.valeur}>{t.icone} {t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Type d'intervention */}
                                    <div className="form-group">
                                        <label className="required">Type d'intervention</label>
                                        <select
                                            name="typeIntervention"  // ✅ Corrigé
                                            value={formData.typeIntervention}  // ✅ Corrigé
                                            onChange={handleChange}  // ✅ Corrigé
                                        >
                                            {getTypeInterventions().map(t => (
                                                <option key={t.valeur} value={t.valeur}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Marque, Modèle, Année */}
                                <div className="form-grid-3col">
                                    <div className="form-group">
                                        <label>Marque</label>
                                        <input 
                                            type="text" 
                                            name="vehicleBrand" 
                                            value={formData.vehicleBrand} 
                                            onChange={handleChange}
                                            placeholder="Peugeot"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Modèle</label>
                                        <input 
                                            type="text" 
                                            name="vehicleModel" 
                                            value={formData.vehicleModel} 
                                            onChange={handleChange}
                                            placeholder="308"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Année</label>
                                        <input 
                                            type="text" 
                                            name="vehicleYear" 
                                            value={formData.vehicleYear} 
                                            onChange={handleChange}
                                            placeholder="2020"
                                        />
                                    </div>
                                </div>

                                {/* VIN */}
                                <div className="form-group">
                                    <label>VIN (optionnel)</label>
                                    <input 
                                        type="text" 
                                        name="vin" 
                                        value={formData.vin} 
                                        onChange={handleChange}
                                        placeholder="VF3XXXXXXXXXXXXXXX"
                                    />
                                </div>
                            </div>
                        )}

                        {/* ===== 3. PLANIFICATION ===== */}
                        <div className="form-section">
                            <div className="form-section-title"><CalendarClock size={14} /> Planification</div>
                            
                            <div className="form-grid-2col">
                                <div className="form-group">
                                    <label className="required">Date début</label>
                                    <input 
                                        type="date" 
                                        name="dateStart" 
                                        value={formData.dateStart} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="required">Heure début</label>
                                    <input 
                                        type="time" 
                                        name="timeStart" 
                                        value={formData.timeStart} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2col">
                                <div className="form-group">
                                    <label className="required">Date fin</label>
                                    <input 
                                        type="date" 
                                        name="dateEnd" 
                                        value={formData.dateEnd} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="required">Heure fin</label>
                                    <input 
                                        type="time" 
                                        name="timeEnd" 
                                        value={formData.timeEnd} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ===== 4. TRAVAUX À EFFECTUER ===== */}
                        <div className="form-section">
                            <div className="form-section-title"><FileText size={14} /> Travaux à effectuer</div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleChange} 
                                    rows="4"
                                    placeholder="Ex: Vidange + filtre à huile + contrôle freins"
                                ></textarea>
                            </div>
                        </div>

                        {/* ===== BOUTONS ===== */}
                        <div className="modal-buttons">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="btn-cancel"
                            >
                                <X size={14} /> Annuler
                            </button>
                            <button 
                                type="submit" 
                                className="btn-save"
                            >
                                {initialData?.id ? <><Save size={14} /> Modifier</> : <><Save size={14} /> Enregistrer</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModalForm;