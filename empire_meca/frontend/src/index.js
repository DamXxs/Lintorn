import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Importe le App.js qu'on vient de faire
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);