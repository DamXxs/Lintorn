// /frontend/src/pages/Clients/ClientList.jsx
import React, { useState, useEffect } from 'react';
import { getAllClients, searchClients, removeClient } from '../../utils/clientService';
import { Search, UserPlus, X, Phone, Mail } from 'lucide-react';
import './ClientList.css';
import ClientDetail from './ClientDetail';
import ClientForm from './ClientForm';


const ClientList = () => {

  const [clients, setClients]               = useState([]);
  const [filtered, setFiltered]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isFormOpen, setIsFormOpen]         = useState(false);
  const [editingClient, setEditingClient]   = useState(null);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllClients();
      setClients(data);
      setFiltered(data);
    } catch {
      setError('Impossible de charger les clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, []);

  useEffect(() => {
    setFiltered(searchClients(clients, searchQuery));
  }, [searchQuery, clients]);

  const handleDelete = async (client) => {
    if (!window.confirm(`Supprimer "${client.nom} ${client.prenom}" ?`)) return;
    try {
      await removeClient(client.id);
      setSelectedClient(null);
      await loadClients();
    } catch {
      alert('❌ Erreur lors de la suppression');
    }
  };

  const getInitiales = (nom, prenom) => {
    const n = nom?.charAt(0)?.toUpperCase() || '';
    const p = prenom?.charAt(0)?.toUpperCase() || '';
    return `${n}${p}` || '?';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  if (loading) return (
    <div className="clients-loading">
      <div className="spinner"></div>
      <p>Chargement des clients...</p>
    </div>
  );

  if (error) return (
    <div className="clients-error">
      <p>{error}</p>
      <button onClick={loadClients}>Réessayer</button>
    </div>
  );

  return (
    <div className="clients-page">

      {/* EN-TÊTE */}
      <div className="clients-header">
        <div className="clients-header__left">
          <h1 className="clients-title">Clients</h1>
          <span className="clients-count">
            {filtered.length} client{filtered.length > 1 ? 's' : ''}
          </span>
        </div>
        <button
          className="btn-new-client"
          onClick={() => { setEditingClient(null); setIsFormOpen(true); }}
        >
          <UserPlus size={16} />
          Nouveau client
        </button>
      </div>

      {/* RECHERCHE */}
      <div className="clients-search">
        <Search size={16} className="clients-search__icon" />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom, téléphone, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="clients-search__input"
        />
        {searchQuery && (
          <button className="clients-search__clear" onClick={() => setSearchQuery('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* GRILLE */}
      {filtered.length === 0 ? (
        <div className="clients-empty">
          <p>Aucun client trouvé</p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>Effacer la recherche</button>
          )}
        </div>
      ) : (
        <div className="clients-grid">
          {filtered.map(client => (
            <div key={client.id} className="client-card" onClick={() => setSelectedClient(client)}>
              <div className="client-card__avatar">{getInitiales(client.nom, client.prenom)}</div>
              <div className="client-card__name">
                <span className="client-card__nom">{client.nom}</span>
                <span className="client-card__prenom">{client.prenom}</span>
              </div>
              <div className="client-card__infos">
                {client.telephone && (
                  <div className="client-card__info-row">
                    <span className="client-card__info-icon-lucide"><Phone size={12} /></span>
                    <span>{client.telephone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="client-card__info-row">
                    <span className="client-card__info-icon-lucide"><Mail size={12} /></span>
                    <span>{client.email}</span>
                  </div>
                )}
              </div>
              <div className="client-card__footer">
                <span className="client-card__date">Depuis {formatDate(client.date_creation)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {isFormOpen && (
        <ClientForm
          editingClient={editingClient}
          onClose={() => { setIsFormOpen(false); setEditingClient(null); }}
          onSuccess={() => { setIsFormOpen(false); setEditingClient(null); loadClients(); }}
        />
      )}

    </div>
  );
};

export default ClientList;