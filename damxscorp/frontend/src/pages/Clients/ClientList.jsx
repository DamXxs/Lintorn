// /frontend/src/pages/Clients/ClientList.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllClients, searchClients, removeClient } from '../../utils/clientService';
import './ClientList.css';
import ClientDetail from './ClientDetail';
import ClientForm from './ClientForm';



const ClientList = () => {

  // =========================================================================
  // ÉTATS
  // =========================================================================
  const [clients, setClients]           = useState([]);  // Tous les clients
  const [filtered, setFiltered]         = useState([]);  // Clients filtrés par recherche
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedClient, setSelectedClient] = useState(null); // Client cliqué (pour la modale)
  const [isFormOpen, setIsFormOpen]     = useState(false);    // Modale création/modif
  const [editingClient, setEditingClient] = useState(null);   // Client en cours de modif

  // =========================================================================
  // CHARGEMENT DES DONNÉES
  // =========================================================================
  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllClients();
      setClients(data);
      setFiltered(data); // Au départ, tous les clients sont affichés
    } catch (err) {
      setError('Impossible de charger les clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, []);

  const location = useLocation();

// Ouvre automatiquement la fiche du client si on arrive avec un ID
useEffect(() => {
  // On attend que les clients soient chargés ET qu'un ID soit passé
  if (location.state?.openClientId && clients.length > 0) {
    const client = clients.find(c => c.id === location.state.openClientId);
    if (client) {
      setSelectedClient(client);
      // Nettoie le state pour éviter de rouvrir si l'user navigue
      window.history.replaceState({}, '');
    }
  }
}, [location.state, clients]); // se déclenche quand les clients sont chargés

  // =========================================================================
  // RECHERCHE — se déclenche à chaque frappe
  // =========================================================================
  useEffect(() => {
    const results = searchClients(clients, searchQuery);
    setFiltered(results);
  }, [searchQuery, clients]);

  // =========================================================================
  // SUPPRESSION
  // =========================================================================
  const handleDelete = async (client) => {
    if (!window.confirm(`Supprimer le client "${client.nom} ${client.prenom}" ?`)) return;
    try {
      await removeClient(client.id);
      setSelectedClient(null);
      await loadClients();
    } catch (err) {
      alert('❌ Erreur lors de la suppression');
    }
  };

  // =========================================================================
  // HELPERS
  // =========================================================================

  // Initiales pour l'avatar de la carte
  const getInitiales = (nom, prenom) => {
    const n = nom?.charAt(0)?.toUpperCase() || '';
    const p = prenom?.charAt(0)?.toUpperCase() || '';
    return `${n}${p}` || '?';
  };

  // Formater la date de création
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // =========================================================================
  // ÉTATS DE CHARGEMENT / ERREUR
  // =========================================================================
  if (loading) {
    return (
      <div className="clients-loading">
        <div className="spinner"></div>
        <p>Chargement des clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clients-error">
        <p>❌ {error}</p>
        <button onClick={loadClients}>Réessayer</button>
      </div>
    );
  }

  // =========================================================================
  // RENDU
  // =========================================================================
  return (
    <div className="clients-page">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="clients-header">
        <div className="clients-header__left">
          <h1 className="clients-title">👥 Clients</h1>
          <span className="clients-count">{filtered.length} client{filtered.length > 1 ? 's' : ''}</span>
        </div>
        <button
          className="btn-new-client"
          onClick={() => { setEditingClient(null); setIsFormOpen(true); }}
        >
          + Nouveau client
        </button>
      </div>

      {/* ── BARRE DE RECHERCHE ────────────────────────────────── */}
      <div className="clients-search">
        <span className="clients-search__icon">🔍</span>
        <input
          type="text"
          placeholder="Rechercher par nom, prénom, téléphone, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="clients-search__input"
        />
        {/* Bouton pour vider la recherche */}
        {searchQuery && (
          <button
            className="clients-search__clear"
            onClick={() => setSearchQuery('')}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── GRILLE DE CARTES ──────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="clients-empty">
          <p>😔 Aucun client trouvé</p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="clients-grid">
          {filtered.map(client => (
            <div
              key={client.id}
              className="client-card"
              onClick={() => setSelectedClient(client)}
            >
              {/* Avatar avec initiales */}
              <div className="client-card__avatar">
                {getInitiales(client.nom, client.prenom)}
              </div>

              {/* Nom */}
              <div className="client-card__name">
                <span className="client-card__nom">{client.nom}</span>
                <span className="client-card__prenom">{client.prenom}</span>
              </div>

              {/* Infos de contact */}
              <div className="client-card__infos">
                {client.telephone && (
                  <div className="client-card__info-row">
                    <span className="client-card__info-icon">📞</span>
                    <span>{client.telephone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="client-card__info-row">
                    <span className="client-card__info-icon">✉️</span>
                    <span>{client.email}</span>
                  </div>
                )}
              </div>

              {/* Footer de la carte */}
              <div className="client-card__footer">
                <span className="client-card__date">
                  Depuis {formatDate(client.date_creation)}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ── MODALE DÉTAIL CLIENT ─────────────────────────────── */}
{selectedClient && (
  <ClientDetail
    client={selectedClient}
    onClose={() => setSelectedClient(null)}
    onEdit={(client) => {
      setEditingClient(client);
      setSelectedClient(null);
      setIsFormOpen(true);
    }}
    onDelete={handleDelete}
  />
)}
      {/* ── MODALE FORMULAIRE CLIENT ─────────────────────────── */}
{isFormOpen && (
  <ClientForm
    editingClient={editingClient}
    onClose={() => {
      setIsFormOpen(false);
      setEditingClient(null);
    }}
    onSuccess={() => {
      setIsFormOpen(false);
      setEditingClient(null);
      loadClients(); // Recharge la liste
    }}
  />
)}

    </div>
  );
};

export default ClientList;