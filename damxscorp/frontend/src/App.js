// /src/App.js
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Planning from './pages/Planning/Planning';
import StockVueEnsemble from './pages/Stock/StockVueEnsemble';
import ClientList from './pages/Clients/ClientList';
import VehicleList from './pages/Vehicles/VehicleList';
import './App.css';

function App() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <BrowserRouter>
      <div className="app">
        {/* SIDEBAR */}
        <Sidebar 
          isExpanded={isSidebarExpanded}
          onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
        />

        {/* HEADER */}
        <Header isSidebarExpanded={isSidebarExpanded} />

        {/* CONTENU PRINCIPAL */}
        <main className={`app__content ${isSidebarExpanded ? 'app__content--sidebar-expanded' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/planning" replace />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/stock" element={<StockVueEnsemble />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/vehicles" element={<VehicleList />} />
            <Route path="*" element={<div className="page-404">Page non trouvée</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;