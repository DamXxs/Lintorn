// /src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Planning from './pages/Planning/Planning';
import StockVueEnsemble from './pages/Stock/StockVueEnsemble';
import ClientList from './pages/Clients/ClientList';
import VehicleList from './pages/Vehicles/VehicleList';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        {/* SIDEBAR - Toujours visible */}
        <Sidebar />

        {/* CONTENU PRINCIPAL - Change selon la route */}
        <main className="app__content">
          <Routes>
            {/* Route par défaut → redirige vers planning */}
            <Route path="/" element={<Navigate to="/planning" replace />} />
            
            {/* Routes principales */}
            <Route path="/planning" element={<Planning />} />
            <Route path="/stock" element={<StockVueEnsemble />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/vehicles" element={<VehicleList />} />
            
            {/* Route 404 - page non trouvée */}
            <Route path="*" element={<div>Page non trouvée</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;