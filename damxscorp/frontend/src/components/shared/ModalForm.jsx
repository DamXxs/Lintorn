// /src/components/shared/ModalForm.jsx
import React, { useState, useEffect } from 'react';
import './ModalForm.css';

const ModalForm = ({isOpen, onClose, initialData, prefilledDate, onSubmit}) => {
    
    // =========================================================================
    // ÉTAT DU FORMULAIRE
    // =========================================================================
    const [formData, setFormData] = useState({
        departement: 'ATELIER',
        clientName: '',
        clientFirstName: '',
        clientPhone: '',
        clientEmail: '',
        plate: '',
        vehicleBrand: '',
        vehicleModel: '',
        date: '',
        time: '08:00',
        description: ''
    });

    // =========================================================================
    // INITIALISATION DU FORMULAIRE (nouveau useEffect)
    // =========================================================================
    useEffect(() => {
        if (initialData) {
            // Mode édition : charger les données existantes
            setFormData(initialData);
        } else if (prefilledDate) {
            // Mode création avec date/heure pré-remplie (clic sur calendrier)
            const dateObj = new Date(prefilledDate);
            const dateStr = dateObj.toISOString().split('T')[0]; // Format YYYY-MM-DD
            const timeStr = dateObj.toTimeString().slice(0, 5);  // Format HH:MM
            
            setFormData({
                departement: 'ATELIER',
                clientName: '',
                clientFirstName: '',
                clientPhone: '',
                clientEmail: '',
                plate: '',
                vehicleBrand: '',
                vehicleModel: '',
                date: dateStr,      // ← Pré-rempli
                time: timeStr,      // ← Pré-rempli
                description: ''
            });
        } else {
            // Mode création vide (bouton "Nouveau RDV")
            setFormData({
                departement: 'ATELIER',
                clientName: '',
                clientFirstName: '',
                clientPhone: '',
                clientEmail: '',
                plate: '',
                vehicleBrand: '',
                vehicleModel: '',
                date: '',
                time: '08:00',
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
        console.log(`📄 Changement détecté : ${name} = ${value}`);
    };

    // =========================================================================
    // RENDU DU FORMULAIRE (ton code existant, ne change rien !)
    // =========================================================================
    return (
        <div id="modal-rdv">
            <div className="modal-content">
                <h3>📅 {initialData?.id ? 'Modifier le Rendez-vous' : 'Nouveau Rendez-vous'}</h3>
                
                <form onSubmit={(e) => { 
                    e.preventDefault();
                    console.log("📤 Données envoyées depuis ModalForm :", formData);
                    onSubmit(formData); 
                }}>
                    
                    {/* Ton formulaire existant - NE CHANGE RIEN */}
                    <div className="form-group">
                        <label>DÉPARTEMENT</label>
                        <select 
                            name="departement" 
                            value={formData.departement} 
                            onChange={handleChange}
                        >
                            <option value="ATELIER">🔧 ATELIER</option>
                            <option value="ACADEMIE">🎓 ACADÉMIE</option>
                        </select>
                    </div>

                    <div className="form-section">
                        <div className="form-grid-2col">
                            <div className="form-group">
                                <label className="required">NOM</label>
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
                                <label>PRÉNOM</label>
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
                                <label>TÉLÉPHONE</label>
                                <input 
                                    type="tel" 
                                    name="clientPhone" 
                                    value={formData.clientPhone} 
                                    onChange={handleChange} 
                                    placeholder="06 12 34 56 78"
                                />
                            </div>
                            <div className="form-group">
                                <label>EMAIL</label>
                                <input 
                                    type="email" 
                                    name="clientEmail" 
                                    value={formData.clientEmail} 
                                    onChange={handleChange} 
                                    placeholder="dupont@email.com"
                                />
                            </div>
                        </div>
                    </div>

                    {formData.departement === 'ATELIER' && (
                        <div className="form-section">
                            <div className="form-grid-2col">
                                <div className="form-group">
                                    <label className="required">IMMATRICULATION</label>
                                    <input 
                                        type="text" 
                                        name="plate" 
                                        value={formData.plate} 
                                        onChange={handleChange}
                                        placeholder="AB-123-CD"
                                        required={formData.departement === 'ATELIER'}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>MARQUE</label>
                                    <input 
                                        type="text" 
                                        name="vehicleBrand" 
                                        value={formData.vehicleBrand} 
                                        onChange={handleChange}
                                        placeholder="Peugeot"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>MODÈLE</label>
                                <input 
                                    type="text" 
                                    name="vehicleModel" 
                                    value={formData.vehicleModel} 
                                    onChange={handleChange}
                                    placeholder="308"
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-section">
                        <div className="form-grid-2col">
                            <div className="form-group">
                                <label className="required">DATE</label>
                                <input 
                                    type="date" 
                                    name="date" 
                                    value={formData.date} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label className="required">HEURE</label>
                                <input 
                                    type="time" 
                                    name="time" 
                                    value={formData.time} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-group">
                            <label>TRAVAUX À EFFECTUER</label>
                            <textarea 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                rows="3"
                                placeholder="Ex: Vidange + filtre à huile + contrôle freins"
                            ></textarea>
                        </div>
                    </div>

                    <div className="modal-buttons">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="btn-cancel"
                        >
                            Annuler
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
    );
};

export default ModalForm;