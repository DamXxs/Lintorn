// /src/pages/Planning/components/ModalForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { fetchDepartements, fetchCollaborateurs } from '../../../services/api';
import { useReferentiels } from '../../../context/ReferentielsContext';
import { formatNom, formatPrenom, formatPhone, formatImmatriculation, validateEmail, validateImmatriculation } from '../../../utils/validators';
import logger from '../../../utils/logger';

import Modal            from '../../../components/shared/Modals/Modal';
import FrenchPlateInput from '../../../components/shared/Frenchplate/FrenchPlateInput';
import AddressAutocomplete from '../../../components/shared/AdressAutocomplete/AddressAutocomplete';
import { User, Car, CalendarClock, FileText, Save, Search, Users, X } from '../../../utils/icons';

import './ModalForm.css';

// ── Créneaux horaires 00:00 → 23:30 par pas de 30 minutes ────────
const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

const ModalForm = ({ isOpen, onClose, initialData, prefilledDate, onSubmit }) => {

    const { getTypeVehicules, getTypeInterventions } = useReferentiels();

    const [departements,   setDepartements]   = useState([]);
    const [collaborateurs, setCollaborateurs] = useState([]);
    const [errors,         setErrors]         = useState({});

    // ── Chargement au montage ──────────────────────────────────────
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

    // ── Initiales d'un collaborateur ───────────────────────────────
    const getInitiales = (nom) => {
        const parts = nom.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return nom.slice(0, 2).toUpperCase();
    };

    // ── Toggle sélection collaborateur ─────────────────────────────
    const toggleCollab = (id) => {
        setFormData(prev => {
            const ids = prev.collaborateursIds || [];
            return {
                ...prev,
                collaborateursIds: ids.includes(id)
                    ? ids.filter(i => i !== id)
                    : [...ids, id],
            };
        });
    };

    // ── État initial du formulaire ─────────────────────────────────
    // useMemo avec [] : toutes les valeurs sont des constantes, l'objet
    // ne change jamais → stable pour le useEffect qui en dépend
    const emptyForm = useMemo(() => ({
        departement:      'ATELIER',
        typeIntervention: 'ENTRETIEN_VP2',
        clientName:       '',
        clientFirstName:  '',
        clientPhone:      '',
        clientEmail:      '',
        clientAddress:    '',
        vehicleType:      'VOITURE',
        plate:            '',
        vehicleBrand:     '',
        vehicleModel:     '',
        vehicleYear:      '',
        vin:              '',
        dateStart:        '',
        timeStart:        '08:00',
        dateEnd:          '',
        timeEnd:          '09:00',
        description:      '',
        collaborateursIds: [],
    }), []);

    const [formData, setFormData] = useState(emptyForm);

    // ── Initialisation selon le contexte (édition / date préfill / vide) ──
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        } else if (prefilledDate) {
            const dateObj  = new Date(prefilledDate);
            const dateStr  = dateObj.toISOString().split('T')[0];
            const timeStr  = dateObj.toTimeString().slice(0, 5);
            const endObj   = new Date(dateObj.getTime() + 60 * 60 * 1000);
            const endTime  = endObj.toTimeString().slice(0, 5);
            setFormData({ ...emptyForm, dateStart: dateStr, timeStart: timeStr, dateEnd: dateStr, timeEnd: endTime });
        } else {
            setFormData(emptyForm);
        }
    }, [initialData, prefilledDate, emptyForm]);

    // ── Gestion des changements ────────────────────────────────────
    const handleChange = (e) => {
        let { name, value } = e.target;

        if (name === 'clientName')      value = formatNom(value);
        if (name === 'clientFirstName') value = formatPrenom(value);
        if (name === 'clientPhone')     value = formatPhone(value);
        if (name === 'plate')           value = formatImmatriculation(value);

        if (name === 'clientName')  setErrors(prev => ({ ...prev, clientName: value.trim() ? null : prev.clientName }));
        if (name === 'clientEmail') setErrors(prev => ({ ...prev, clientEmail: validateEmail(value) }));
        if (name === 'plate')       setErrors(prev => ({ ...prev, plate: validateImmatriculation(value) }));
        if (name === 'dateStart')   setErrors(prev => ({ ...prev, dateStart: value ? null : prev.dateStart }));
        if (name === 'dateEnd')     setErrors(prev => ({ ...prev, dateEnd: value ? null : prev.dateEnd }));

        setFormData(prev => ({ ...prev, [name]: value }));
        logger.form.change(name, value);
    };

    // ── Soumission ─────────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};

        if (!formData.clientName.trim()) newErrors.clientName = 'Le nom est obligatoire';
        if (!formData.dateStart)         newErrors.dateStart   = 'Date de début obligatoire';
        if (!formData.dateEnd)           newErrors.dateEnd     = 'Date de fin obligatoire';

        if (formData.clientEmail) {
            const emailError = validateEmail(formData.clientEmail);
            if (emailError) newErrors.clientEmail = emailError;
        }

        const deptRequiertVehicule = departements.find(d => d.code === formData.departement)?.requiert_vehicule;
        if (deptRequiertVehicule) {
            const plateError = validateImmatriculation(formData.plate);
            if (plateError) newErrors.plate = plateError;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTimeout(() => {
                const premierChamp = Object.keys(newErrors)[0];
                const el = document.querySelector(`#rdv-form [name="${premierChamp}"]`);
                if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
            }, 50);
            return;
        }

        setErrors({});
        logger.form.submit('ModalForm', formData);
        onSubmit(formData);
    };

    // ── SIV (placeholder) ──────────────────────────────────────────
    const handleSivSearch = () => {
        alert('API SIV pas encore implémentée — bientôt disponible !');
    };

    const isEditing = Boolean(initialData?.id);
    const deptRequiertVehicule = departements.find(d => d.code === formData.departement)?.requiert_vehicule;

    // ── RENDU ──────────────────────────────────────────────────────
    return (
        <Modal
            title={isEditing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
            titleIcon={<CalendarClock size={15} />}
            onClose={onClose}
          footer={
            <>
                <button type="button" className="modal-btn modal-btn--cancel" onClick={onClose}>
                    <X size={14} /> Annuler
                </button>
                <button type="submit" form="rdv-form" className="modal-btn modal-btn--success">
                    {isEditing
                        ? <><Save size={14} /> Modifier</>
                        : <><Save size={14} /> Enregistrer</>
                    }
                </button>
            </>
          }
        >
            <form id="rdv-form" onSubmit={handleSubmit} noValidate>

                {/* ── SÉLECTEUR DÉPARTEMENT ──────────────────────── */}
                <div className="mf-dept-wrapper">
                    <select
                        name="departement"
                        value={formData.departement}
                        onChange={handleChange}
                        className="mf-dept-select"
                    >
                        {departements.length === 0 ? (
                            <option value="ATELIER">Chargement...</option>
                        ) : (
                            departements.map(dept => (
                                <option key={dept.code} value={dept.code}>{dept.nom}</option>
                            ))
                        )}
                    </select>
                </div>

                {/* ── 1. INFORMATIONS CLIENT ─────────────────────── */}
                <div className="mf-section">
                    <div className="mf-section-title"><User size={14} /> Informations Client</div>

                    <div className="mf-grid-2col">
                        <div className="mf-group">
                            <label className="mf-label required">Nom</label>
                            <input type="text" name="clientName" value={formData.clientName}
                                onChange={handleChange} placeholder="Dupont" className="mf-input" />
                            {errors.clientName && <span className="mf-error">{errors.clientName}</span>}
                        </div>
                        <div className="mf-group">
                            <label className="mf-label">Prénom</label>
                            <input type="text" name="clientFirstName" value={formData.clientFirstName}
                                onChange={handleChange} placeholder="Jean" className="mf-input" />
                        </div>
                    </div>

                    <div className="mf-grid-2col">
                        <div className="mf-group">
                            <label className="mf-label">Téléphone</label>
                            <input type="tel" name="clientPhone" value={formData.clientPhone}
                                onChange={handleChange} placeholder="06 12 34 56 78" className="mf-input" />
                        </div>
                        <div className="mf-group">
                            <label className="mf-label">Email</label>
                            <input type="text" name="clientEmail" value={formData.clientEmail}
                                onChange={handleChange} placeholder="dupont@email.com" className="mf-input" />
                            {errors.clientEmail && <span className="mf-error">{errors.clientEmail}</span>}
                        </div>
                    </div>

                    <div className="mf-group">
                        <label className="mf-label">Adresse</label>
                        <AddressAutocomplete
                            value={formData.clientAddress}
                            onChange={(value) => setFormData(prev => ({ ...prev, clientAddress: value }))}
                            onSelect={(adresse) => setFormData(prev => ({ ...prev, clientAddress: adresse.adresse }))}
                        />
                    </div>
                </div>

                {/* ── 2. INFORMATIONS VÉHICULE (si requis) ──────── */}
                {deptRequiertVehicule && (
                    <div className="mf-section">
                        <div className="mf-section-title"><Car size={14} /> Informations Véhicule</div>

                        {/* Immatriculation + bouton SIV — saisie directe dans la plaque */}
                        <div className="mf-group">
                            <label className="mf-label required">Immatriculation</label>
                            <div className="plate-with-siv">
                                <FrenchPlateInput
                                    name="plate"
                                    value={formData.plate}
                                    onChange={handleChange}
                                    size="md"
                                    hasError={Boolean(errors.plate)}
                                />
                                <button
                                    type="button" className="btn-siv"
                                    onClick={handleSivSearch}
                                    disabled={!formData.plate}
                                    title="API SIV — bientôt disponible"
                                >
                                    <Search size={14} /> SIV
                                </button>
                            </div>
                            {errors.plate && <span className="mf-error">{errors.plate}</span>}
                        </div>

                        <div className="mf-grid-2col">
                            <div className="mf-group">
                                <label className="mf-label required">Type de véhicule</label>
                                <select name="vehicleType" value={formData.vehicleType}
                                    onChange={handleChange} className="mf-input">
                                    {getTypeVehicules().map(t => (
                                        <option key={t.valeur} value={t.valeur}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mf-group">
                                <label className="mf-label required">Type d'intervention</label>
                                <select name="typeIntervention" value={formData.typeIntervention}
                                    onChange={handleChange} className="mf-input">
                                    {getTypeInterventions().map(t => (
                                        <option key={t.valeur} value={t.valeur}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mf-grid-3col">
                            <div className="mf-group">
                                <label className="mf-label">Marque</label>
                                <input type="text" name="vehicleBrand" value={formData.vehicleBrand}
                                    onChange={handleChange} placeholder="Peugeot" className="mf-input" />
                            </div>
                            <div className="mf-group">
                                <label className="mf-label">Modèle</label>
                                <input type="text" name="vehicleModel" value={formData.vehicleModel}
                                    onChange={handleChange} placeholder="308" className="mf-input" />
                            </div>
                            <div className="mf-group">
                                <label className="mf-label">Année</label>
                                <input type="text" name="vehicleYear" value={formData.vehicleYear}
                                    onChange={handleChange} placeholder="2020" className="mf-input" />
                            </div>
                        </div>

                        <div className="mf-group">
                            <label className="mf-label">VIN (optionnel)</label>
                            <input type="text" name="vin" value={formData.vin}
                                onChange={handleChange} placeholder="VF3XXXXXXXXXXXXXXX" className="mf-input" />
                        </div>
                    </div>
                )}

                {/* ── 3. PLANIFICATION ───────────────────────────── */}
                <div className="mf-section">
                    <div className="mf-section-title"><CalendarClock size={14} /> Planification</div>

                    <div className="mf-grid-2col">
                        <div className="mf-group">
                            <label className="mf-label required">Date début</label>
                            <input type="date" name="dateStart" value={formData.dateStart}
                                onChange={handleChange} className="mf-input mf-input--date" />
                            {errors.dateStart && <span className="mf-error">{errors.dateStart}</span>}
                        </div>
                        <div className="mf-group">
                            <label className="mf-label required">Heure début</label>
                            <select name="timeStart" value={formData.timeStart}
                                onChange={handleChange} className="mf-input">
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mf-grid-2col">
                        <div className="mf-group">
                            <label className="mf-label required">Date fin</label>
                            <input type="date" name="dateEnd" value={formData.dateEnd}
                                onChange={handleChange} className="mf-input mf-input--date" />
                            {errors.dateEnd && <span className="mf-error">{errors.dateEnd}</span>}
                        </div>
                        <div className="mf-group">
                            <label className="mf-label required">Heure fin</label>
                            <select name="timeEnd" value={formData.timeEnd}
                                onChange={handleChange} className="mf-input">
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Collaborateurs */}
                    {collaborateurs.length > 0 && (
                        <div className="mf-group" style={{ marginTop: '10px' }}>
                            <div className="mf-section-title" style={{ marginBottom: '8px' }}>
                                <Users size={12} /> Collaborateur(s) assigné(s)
                            </div>
                            <div className="mf-collab-grid">
                                {collaborateurs.map(c => {
                                    const selected = (formData.collaborateursIds || []).includes(c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className={`mf-collab-chip${selected ? ' selected' : ''}`}
                                            style={selected ? { borderColor: c.couleur, background: c.couleur + '22' } : {}}
                                            onClick={() => toggleCollab(c.id)}
                                        >
                                            <div className="mf-collab-avatar" style={{ background: c.couleur }}>
                                                {getInitiales(c.nom)}
                                            </div>
                                            <div className="mf-collab-info">
                                                <span className="mf-collab-nom">{c.nom}</span>
                                                {c.role && <span className="mf-collab-role">{c.role}</span>}
                                            </div>
                                            {selected && <span className="mf-collab-check">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── 4. TRAVAUX ─────────────────────────────────── */}
                <div className="mf-section">
                    <div className="mf-section-title"><FileText size={14} /> Travaux à effectuer</div>
                    <div className="mf-group">
                        <label className="mf-label">Description</label>
                        <textarea name="description" value={formData.description}
                            onChange={handleChange} rows="4" className="mf-input"
                            placeholder="Ex: Vidange + filtre à huile + contrôle freins"
                        />
                    </div>
                </div>

            </form>
        </Modal>
    );
};

export default ModalForm;
