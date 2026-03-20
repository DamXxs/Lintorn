// /frontend/src/App.js
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ReferentielsProvider } from './context/ReferentielsContext'; // ← NOUVEAU
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Planning from './pages/Planning/Planning';
import StockVueEnsemble from './pages/Stock/StockVueEnsemble';
import ClientList from './pages/Clients/ClientList';
import VehicleList from './pages/Vehicles/VehicleList';
import Parametres from './pages/Parametres/Parametres';
import Fournisseurs from './pages/Fournisseurs/Fournisseurs';
import Factures from './pages/Factures/Factures';
import './App.css';

const App = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <ThemeProvider>
      <ReferentielsProvider>  {/* ← NOUVEAU — enveloppe toute l'appli */}
        <BrowserRouter>
          <div className="app">

            <Sidebar
              isExpanded={isSidebarExpanded}
              onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
            />

            <Header isSidebarExpanded={isSidebarExpanded} />

            <main className={`app__content ${isSidebarExpanded ? 'app__content--sidebar-expanded' : ''}`}>
              <Routes>
                <Route path="/" element={<Navigate to="/planning" replace />} />
                <Route path="/planning"    element={<Planning isSidebarExpanded={isSidebarExpanded} />} />
                <Route path="/stock"       element={<StockVueEnsemble />} />
                <Route path="/clients"     element={<ClientList />} />
                <Route path="/vehicles"    element={<VehicleList />} />
                <Route path="/fournisseurs" element={<Fournisseurs />} />
                <Route path="/factures"     element={<Factures />} />
                <Route path="/parametres"  element={<Parametres />} />
                <Route path="*"            element={<div className="page-404">Page non trouvée</div>} />
              </Routes>
            </main>

          </div>
        </BrowserRouter>
      </ReferentielsProvider>
    </ThemeProvider>
  );
};

export default App;