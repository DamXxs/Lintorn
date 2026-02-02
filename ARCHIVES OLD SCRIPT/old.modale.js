import React, { useState } from 'react';
import './ModalForm.css';  // ← IMPORT DU CSS DÉDIÉ

const ModalForm = ({ onClose, onSubmit, initialData }) => {
    // =========================================================================
    // ÉTAT DU FORMULAIRE
    // =========================================================================
    const [formData, setFormData] = useState(initialData || {
        departement: 'ATELIER',
        clientName: '',
        clientFirstName: '',
        clientPhone: '',
        clientEmail: '',        // ← EMAIL AJOUTÉ
        plate: '',
        vehicleBrand: '',
        vehicleModel: '',
        date: '',
        time: '08:00',
        description: ''
    });

    // =========================================================================
    // GESTION DES CHANGEMENTS
    // =========================================================================
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // =========================================================================
    // RENDU DU FORMULAIRE
    // =========================================================================
    return (
        <div id="modal-rdv">
            <div className="modal-content">
                <h3>📅 Nouveau Rendez-vous</h3>
                
                <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    onSubmit(formData); 
                }}>
                    
                    {/* ========================================================
                        1. DÉPARTEMENT
                    ======================================================== */}
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

                    {/* ========================================================
                        2. INFORMATIONS CLIENT
                    ======================================================== */}
                    <div className="form-section">
                        {/* Nom + Prénom (côte à côte) */}
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

                        {/* Téléphone + Email (côte à côte) */}
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

                    {/* ========================================================
                        3. INFORMATIONS VÉHICULE (si ATELIER uniquement)
                    ======================================================== */}
                    {formData.departement === 'ATELIER' && (
                        <div className="form-section">
                            {/* Immatriculation + Marque (côte à côte) */}
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

                            {/* Modèle (pleine largeur) */}
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

                    {/* ========================================================
                        4. DATE ET HEURE
                    ======================================================== */}
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

                    {/* ========================================================
                        5. DESCRIPTION / TRAVAUX
                    ======================================================== */}
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

                    {/* ========================================================
                        6. BOUTONS D'ACTION
                    ======================================================== */}
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
                            💾 Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalForm;