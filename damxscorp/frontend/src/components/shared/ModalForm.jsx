// /src/components/shared/ModalForm.jsx
import React, { useState, useEffect } from 'react';
import { VEHICLE_TYPES, INTERVENTION_TYPES } from '../../utils/constants';
import { fetchDepartements, fetchCollaborateurs } from '../../services/api';
import './ModalForm.css';
import logger from '../../utils/logger';
import AddressAutocomplete from './AddressAutocomplete';
import { useReferentiels } from '../../context/ReferentielsContext';
import { User, Car, CalendarClock, FileText, X, Save, Search, Users } from '../../utils/icons';
import { formatNom, formatPrenom, formatPhone, formatImmatriculation, validateEmail, validateImmatriculation } from '../../utils/validators';



// ── Toutes les heures de 00:00 à 23:30 par pas de 30 minutes ──────────────
const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

const ModalForm = ({isOpen, onClose, initialData, prefilledDate, onSubmit}) => {
    
    // =========================================================================
    // ÉTAT DU FORMULAIRE
    // =========================================================================
    const { getTypeVehicules, getTypeInterventions } = useReferentiels();

    // Départements chargés depuis l'API (remplace la constante hardcodée)
    const [departements,   setDepartements]   = useState([]);
    // Collaborateurs actifs disponibles pour assignment
    const [collaborateurs, setCollaborateurs] = useState([]);
    // Erreurs de validation (ex: email invalide) - clé = nom du champ, valeur = message d'erreur
    const [errors, setErrors] = useState({});

    // Chargement au montage
    useEffect(() => {
        fetchDepartements(true).then(data => {
            setDepartements(data);
            if (data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    departement: prev.departement || data[0].code,
                }));
            }
        }).catch(() => {});

        fetchCollaborateurs(true).then(setCollaborateurs).catch(() => {});
    }, []);

    // Helper : génère les initiales d'un nom (ex: "Thomas Dupont" → "TD")
    const getInitiales = (nom) => {
        const parts = nom.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return nom.slice(0, 2).toUpperCase();
    };

    // Toggle sélection d'un collaborateur
    const toggleCollab = (id) => {
        setFormData(prev => {
            const ids = prev.collaborateursIds || [];
            return {
                ...prev,
                collaborateursIds: ids.includes(id)
                    ? ids.filter(i => i !== id)   // déselectionner
                    : [...ids, id],               // sélectionner
            };
        });
    };

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
        description: '',
        collaborateursIds: [],
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
                description: '',
                collaborateursIds: [],
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
                description: '',
                collaborateursIds: [],
            });
        }
    }, [initialData, prefilledDate]);

    // =========================================================================
    // GESTION DES CHANGEMENTS
    // =========================================================================
    const handleChange = (e) => {
        let { name, value } = e.target;

        // ── Validators automatiques (depuis utils/validators.js) ───────
        if (name === 'clientName')      value = formatNom(value);
        if (name === 'clientFirstName') value = formatPrenom(value);
        if (name === 'clientPhone')     value = formatPhone(value);
        if (name === 'plate')           value = formatImmatriculation(value);
        // Validation en temps réel : efface l'erreur dès que le champ devient valide
        if (name === 'clientName') {
            setErrors(prev => ({ ...prev, clientName: value.trim() ? null : prev.clientName }));
        }
        if (name === 'clientEmail') {
            setErrors(prev => ({ ...prev, clientEmail: validateEmail(value) }));
        }
        if (name === 'plate') {
            setErrors(prev => ({ ...prev, plate: validateImmatriculation(value) }));
        }
        if (name === 'dateStart') {
            setErrors(prev => ({ ...prev, dateStart: value ? null : prev.dateStart }));
        }
        if (name === 'dateEnd') {
            setErrors(prev => ({ ...prev, dateEnd: value ? null : prev.dateEnd }));
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        logger.form.change(name, value);
    };

    // =========================================================================
    // SOUMISSION AVEC VALIDATION COMPLÈTE
    // =========================================================================
    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};

        // Nom : obligatoire
        if (!formData.clientName.trim()) {
            newErrors.clientName = 'Le nom est obligatoire';
        }

        // Dates : obligatoires
        if (!formData.dateStart) newErrors.dateStart = 'Date de début obligatoire';
        if (!formData.dateEnd)   newErrors.dateEnd   = 'Date de fin obligatoire';

        // Email : optionnel, mais si rempli il doit être valide
        if (formData.clientEmail) {
            const emailError = validateEmail(formData.clientEmail);
            if (emailError) newErrors.clientEmail = emailError;
        }

        // Plaque : obligatoire si le département requiert un véhicule
        const deptRequiertVehicule = departements.find(
            d => d.code === formData.departement
        )?.requiert_vehicule;

        if (deptRequiertVehicule) {
            const plateError = validateImmatriculation(formData.plate);
            if (plateError) newErrors.plate = plateError;
        }

        // Des erreurs ? On les affiche toutes et on scroll vers la première
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);

            // Scroll automatique vers le premier champ en erreur
            // setTimeout pour laisser React rendre les bulles avant de scroller
            setTimeout(() => {
                const premierChamp = Object.keys(newErrors)[0];
                const el = document.querySelector(`.modal-body [name="${premierChamp}"]`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.focus(); // met aussi le focus sur le champ pour l'accessibilité
                }
            }, 50);

            return;
        }

        // Tout est bon → on envoie
        setErrors({});
        logger.form.submit('ModalForm', formData);
        onSubmit(formData);
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
                    <form onSubmit={handleSubmit} noValidate>
                        
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
                                    />
                                    {errors.clientName && (
                                        <span className="field-error">{errors.clientName}</span>
                                    )}
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
                                        type="text"
                                        name="clientEmail"
                                        value={formData.clientEmail}
                                        onChange={handleChange}
                                        placeholder="dupont@email.com"
                                    />
                                    {errors.clientEmail && (
                                        <span className="field-error">{errors.clientEmail}</span>
                                    )}
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
                                        <div className="french-plate-wrapper">
                                            <input
                                                type="text"
                                                name="plate"
                                                value={formData.plate}
                                                onChange={handleChange}
                                                placeholder="AB-123-CD"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-api-siv"
                                            onClick={handleSivSearch}
                                            disabled={!formData.plate}
                                        >
                                            <Search size={14} /> SIV
                                        </button>
                                    </div>
                                    {errors.plate && (
                                        <span className="field-error">{errors.plate}</span>
                                    )}
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
                                                <option key={t.valeur} value={t.valeur}>{t.label}</option>
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
                                    />
                                    {errors.dateStart && (
                                        <span className="field-error">{errors.dateStart}</span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="required">Heure début</label>
                                    <select
                                        name="timeStart"
                                        value={formData.timeStart}
                                        onChange={handleChange}
                                        required
                                    >
                                        {TIME_OPTIONS.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
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
                                    />
                                    {errors.dateEnd && (
                                        <span className="field-error">{errors.dateEnd}</span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="required">Heure fin</label>
                                    <select
                                        name="timeEnd"
                                        value={formData.timeEnd}
                                        onChange={handleChange}
                                        required
                                    >
                                        {TIME_OPTIONS.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Collaborateurs — dans la planification */}
                            {collaborateurs.length > 0 && (
                                <div className="form-group" style={{ marginTop: '10px' }}>
                                    <div className="form-section-title" style={{ marginBottom: '8px' }}>
                                        <Users size={12} /> Collaborateur(s) assigné(s)
                                    </div>
                                    <div className="form-collab-grid">
                                        {collaborateurs.map(c => {
                                            const selected = (formData.collaborateursIds || []).includes(c.id);
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    className={`form-collab-chip ${selected ? 'selected' : ''}`}
                                                    style={selected ? { borderColor: c.couleur, background: c.couleur + '22' } : {}}
                                                    onClick={() => toggleCollab(c.id)}
                                                >
                                                    <div className="form-collab-avatar" style={{ background: c.couleur }}>
                                                        {getInitiales(c.nom)}
                                                    </div>
                                                    <div className="form-collab-info">
                                                        <span className="form-collab-nom">{c.nom}</span>
                                                        {c.role && <span className="form-collab-role">{c.role}</span>}
                                                    </div>
                                                    {selected && <span className="form-collab-check">✓</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
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