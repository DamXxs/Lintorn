// /frontend/src/pages/Clients/ClientList.jsx
import React, { useState, useEffect } from 'react';
import { getAllClients, searchClients, removeClient } from '../../utils/clientService';
import { getInitiales, formatDateCourt } from '../../utils/dataFormatters';
import { Phone, Mail, UserPlus } from '../../utils/icons';
import './ClientList.css';
import ClientDetail from './ClientDetail';
import ClientForm from './ClientForm';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import PageHeader   from '../../components/shared/PageHeader';
import SearchBar    from '../../components/shared/SearchBar';
import useDelete    from '../../hooks/useDelete';


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

  // ── Suppression via le hook centralisé ──────────────────────────
  const { handleDelete } = useDelete({
    deleteService: removeClient,
    onSuccess: async () => {
      setSelectedClient(null);
      await loadClients();
    },
    confirmMessage: (client) => `Supprimer "${client.nom} ${client.prenom}" ?`,
  });

  // ── États ────────────────────────────────────────────────────────
  if (loading) return <LoadingState message="Chargement des clients..." />;
  if (error)   return <ErrorState message={error} onRetry={loadClients} />;

  return (
    <div className="clients-page">

      {/* EN-TÊTE */}
      <PageHeader
        title="Clients"
        count={filtered.length}
        countLabel="client"
        onAdd={() => { setEditingClient(null); setIsFormOpen(true); }}
        addLabel="Nouveau client"
        addIcon={<UserPlus size={16} />}
      />

      {/* RECHERCHE */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Rechercher par nom, prénom, téléphone, email..."
      />

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
                <span className="client-card__date">Depuis {formatDateCourt(client.date_creation)}</span>
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
