// /frontend/src/services/searchService.js
//
// 🔍 SERVICE DE RECHERCHE UNIVERSELLE
//
// Appelle en parallèle les endpoints clients, véhicules, pièces et interventions.
// Filtre côté frontend pour un retour instantané.
// Retourne un objet { clients: [...], vehicules: [...], pieces: [...], interventions: [...] }

import { fetchClients, fetchVehicules, fetchPieces, fetchInterventions } from './api';

/**
 * Recherche universelle dans toutes les entités de l'application.
 *
 * @param {string} query — texte saisi par l'utilisateur (min 2 caractères)
 * @returns {Object} — résultats groupés par catégorie, chaque item enrichi
 *                      avec { _type, _label, _sublabel, _icon, _pageUrl, _id }
 */
export const searchAll = async (query) => {
  // Pas de recherche si moins de 2 caractères
  if (!query || query.trim().length < 2) {
    return { clients: [], vehicules: [], pieces: [], interventions: [] };
  }

  const q = query.toLowerCase().trim();

  try {
    // ── Appels en parallèle (performance) ─────────────────────
    const [clients, vehicules, pieces, interventions] = await Promise.all([
      fetchClients().catch(() => []),
      fetchVehicules().catch(() => []),
      fetchPieces().catch(() => []),
      fetchInterventions().catch(() => []),
    ]);

    // ── Filtrage clients ──────────────────────────────────────
    const filteredClients = clients
      .filter(c =>
        c.nom?.toLowerCase().includes(q) ||
        c.prenom?.toLowerCase().includes(q) ||
        c.telephone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
      )
      .slice(0, 5) // Max 5 résultats par catégorie
      .map(c => ({
        ...c,
        _type:     'client',
        _icon:     '👤',
        _label:    `${c.nom} ${c.prenom || ''}`.trim(),
        _sublabel: c.telephone || c.email || '',
        _pageUrl:  '/clients',
        _id:       c.id,
      }));

    // ── Filtrage véhicules ────────────────────────────────────
    const filteredVehicules = vehicules
      .filter(v =>
        v.immatriculation?.toLowerCase().includes(q) ||
        v.marque?.toLowerCase().includes(q) ||
        v.modele?.toLowerCase().includes(q) ||
        v.proprietaire_nom?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(v => ({
        ...v,
        _type:     'vehicule',
        _icon:     '🚗',
        _label:    `${v.marque} ${v.modele} — ${v.immatriculation}`,
        _sublabel: v.proprietaire_nom || 'Sans propriétaire',
        _pageUrl:  '/vehicles',
        _id:       v.id,
      }));

    // ── Filtrage pièces ───────────────────────────────────────
    const filteredPieces = pieces
      .filter(p =>
        p.nom?.toLowerCase().includes(q) ||
        p.reference?.toLowerCase().includes(q) ||
        p.fournisseur?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(p => ({
        ...p,
        _type:     'piece',
        _icon:     '🔩',
        _label:    `${p.reference} — ${p.nom}`,
        _sublabel: `Stock: ${p.stock_actuel} | ${p.fournisseur || 'Pas de fournisseur'}`,
        _pageUrl:  '/stock',
        _id:       p.id,
      }));

    // ── Filtrage interventions ────────────────────────────────
    const filteredInterventions = interventions
      .filter(i =>
        i.client_nom?.toLowerCase().includes(q) ||
        i.client_prenom?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.vehicule_immatriculation?.toLowerCase().includes(q) ||
        i.type_rdv?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(i => {
        // Formater la date pour l'affichage
        const date = i.date_debut
          ? new Date(i.date_debut).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'short', year: 'numeric',
            })
          : '';
        return {
          ...i,
          _type:     'intervention',
          _icon:     '📅',
          _label:    `${i.client_nom || ''} ${i.client_prenom || ''}`.trim() +
                     (i.vehicule_immatriculation ? ` — ${i.vehicule_immatriculation}` : ''),
          _sublabel: `${date} • ${i.description?.slice(0, 40) || i.type_rdv || 'RDV'}`,
          _pageUrl:  '/rdv',
          _id:       i.id,
        };
      });

    return {
      clients:       filteredClients,
      vehicules:     filteredVehicules,
      pieces:        filteredPieces,
      interventions: filteredInterventions,
    };
  } catch (error) {
    console.error('Erreur recherche globale:', error);
    return { clients: [], vehicules: [], pieces: [], interventions: [] };
  }
};

/**
 * Compte le nombre total de résultats dans un objet de résultats groupés.
 */
export const countResults = (results) => {
  return (
    results.clients.length +
    results.vehicules.length +
    results.pieces.length +
    results.interventions.length
  );
};