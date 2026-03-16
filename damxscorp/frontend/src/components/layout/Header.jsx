// /frontend/src/components/layout/Header.jsx
import React, { useState, useEffect } from 'react';
import { CircleAlert, Loader } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [djangoStatus, setDjangoStatus] = useState('checking');

  const checkDjangoConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/health/');
      setDjangoStatus(response.ok ? 'connected' : 'error');
    } catch {
      setDjangoStatus('error');
    }
  };

  useEffect(() => {
    checkDjangoConnection();
    const interval = setInterval(checkDjangoConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  if (djangoStatus === 'connected') return null;

  return (
    <div className={`django-status django-status--${djangoStatus}`}>
      <span className="django-status__dot">
        {djangoStatus === 'checking'
          ? <Loader size={14} className="django-status__spin" />
          : <CircleAlert size={14} />
        }
      </span>
      <span className="django-status__text">
        {djangoStatus === 'checking' && 'Connexion Django...'}
        {djangoStatus === 'error'    && 'Django déconnecté'}
      </span>
    </div>
  );
};

export default Header;