// /src/components/layout/Header.jsx
import React, { useState, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const [djangoStatus, setDjangoStatus] = useState('checking');

  const checkDjangoConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/health/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setDjangoStatus('connected');
      } else {
        setDjangoStatus('error');
      }
    } catch (error) {
      setDjangoStatus('error');
      console.error('Erreur de connexion Django:', error);
    }
  };

  useEffect(() => {
    checkDjangoConnection();
    const interval = setInterval(checkDjangoConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // N'afficher QUE si erreur
  if (djangoStatus === 'connected') {
    return null;
  }

  return (
    <div className={`django-status django-status--${djangoStatus}`}>
      <span className="django-status__dot"></span>
      <span className="django-status__text">
        {djangoStatus === 'checking' && '⏳ Connexion Django...'}
        {djangoStatus === 'error' && '❌ Django déconnecté'}
      </span>
    </div>
  );
};

export default Header;