// /src/components/shared/ModalForm.jsx
import React, { useState, useEffect } from 'react';
import { DEPARTEMENTS, VEHICLE_TYPES, INTERVENTION_TYPES } from '../../utils/constants';
import './ModalForm.css';
import logger from '../../utils/logger';  // ✅ Corrigé

const ModalForm = ({isOpen, onClose, initialData, prefilledDate, onSubmit}) => {
    
    // =========================================================================
    // ÉTAT DU FORMULAIRE
    // =========================================================================
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
            setFormData(initialData);
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
                
                {/* ===== HEADER : SELECT DÉPARTEMENT ===== */}
                <div className="modal-header">
                    <select 
                        name="departement" 
                        value={formData.departement} 
                        onChange={handleChange}
                    >
                        {Object.values(DEPARTEMENTS).map(dept => (  // ✅ Corrigé
                            <option key={dept.value} value={dept.value}>  {/* ✅ Corrigé */}
                                {dept.label}
                            </option>
                        ))}
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
                            <div className="form-section-title">👤 Informations Client</div>
                            
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
                                <input 
                                    type="text" 
                                    name="clientAddress" 
                                    value={formData.clientAddress} 
                                    onChange={handleChange} 
                                    placeholder="123 Rue de la République, 75001 Paris"
                                />
                            </div>
                        </div>

                        {/* ===== 2. INFORMATIONS VÉHICULE (si ATELIER) ===== */}
                        {formData.departement === 'ATELIER' && (
                            <div className="form-section">
                                <div className="form-section-title">🚗 Informations Véhicule</div>
                                
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
                                            🔍 API SIV
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
                                            {Object.values(VEHICLE_TYPES).map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
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
                                            {Object.values(INTERVENTION_TYPES).map(type => (  // ✅ Corrigé
                                                <option key={type.value} value={type.value}>
                                                    {type.label}     
                                                </option>
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
                            <div className="form-section-title">📆 Planification</div>
                            
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
                            <div className="form-section-title">📝 Travaux à effectuer</div>
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
                                ❌ Annuler
                            </button>
                            <button 
                                type="submit" 
                                className="btn-save"
                            >
                                {initialData?.id ? '💾 Modifier' : '💾 Enregistrer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModalForm;