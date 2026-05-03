// /frontend/src/App.tsx
// MODIFICATION : ajout AuthProvider + ProtectedRoute + route /login

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ReferentielsProvider } from './context/ReferentielsContext';
import { AuthProvider } from './context/AuthContext';         // 🆕
import ProtectedRoute from './components/shared/ProtectedRoute'; // 🆕
import Login from './pages/Login';                            // 🆕

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Planning from './pages/Planning/Planning';
import RdvList from './pages/RendezVous/RdvList';
import StockList from './pages/Stock/StockList';
import ClientList from './pages/Clients/ClientList';
import VehicleList from './pages/Vehicles/VehicleList';
import Parametres from './pages/Parametres/Parametres';
import Fournisseurs from './pages/Fournisseurs/Fournisseurs';
import Factures from './pages/Factures/Factures';
import ArchivesPage from './pages/Archives/ArchivesPage';

import './App.css';
import './components/shared/list-page.css';

// =============================================================================
// LAYOUT PRINCIPAL — affiché uniquement quand on est connecté
// On l'isole dans un composant séparé pour garder App propre
// =============================================================================
const AppLayout = ({ isSidebarExpanded, onToggleSidebar }: {
  isSidebarExpanded: boolean;
  onToggleSidebar: () => void;
}) => {
  return (
    <div className="app">

      <Header
        isSidebarExpanded={isSidebarExpanded}
        onToggleSidebar={onToggleSidebar}
      />

      <div className="app__body">
        <Sidebar
          isExpanded={isSidebarExpanded}
          onToggle={onToggleSidebar}
        />

        <main className={`app__content ${isSidebarExpanded ? 'app__content--sidebar-expanded' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/planning" replace />} />
            <Route path="/planning"    element={<Planning isSidebarExpanded={isSidebarExpanded} />} />
            <Route path="/rdv"         element={<RdvList />} />
            <Route path="/stock"       element={<StockList />} />
            <Route path="/clients"     element={<ClientList />} />
            <Route path="/vehicles"    element={<VehicleList />} />
            <Route path="/fournisseurs" element={<Fournisseurs />} />
            <Route path="/factures"    element={<Factures />} />

            {/* 🔐 Paramètres — réservé aux Admins */}
            <Route path="/parametres" element={
              <ProtectedRoute minimumRole="admin">
                <Parametres />
              </ProtectedRoute>
            } />

            {/* 🔐 Archives — réservé aux SuperUsers minimum */}
            <Route path="/archives" element={
              <ProtectedRoute minimumRole="superuser">
                <ArchivesPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<div className="page-404">Page non trouvée</div>} />
          </Routes>
        </main>
      </div>

    </div>
  );
};

// =============================================================================
// APP PRINCIPALE
// =============================================================================
const App = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    // AuthProvider enveloppe TOUT — doit être au plus haut niveau
    <AuthProvider>
      <ThemeProvider>
        <ReferentielsProvider>
          <BrowserRouter>
            <Routes>

              {/* Route publique — page de login */}
              <Route path="/login" element={<Login />} />

              {/* Toutes les autres routes — protégées */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppLayout
                    isSidebarExpanded={isSidebarExpanded}
                    onToggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
                  />
                </ProtectedRoute>
              } />

            </Routes>
          </BrowserRouter>
        </ReferentielsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;