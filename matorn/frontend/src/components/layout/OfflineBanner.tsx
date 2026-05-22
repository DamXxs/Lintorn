// /frontend/src/components/layout/OfflineBanner.tsx
import React from 'react';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import './OfflineBanner.css';

const OfflineBanner: React.FC = () => {
  const { status, checking } = useHealthCheck();

  if (status === 'unknown' || status === 'online') return null;

  return (
    <div className="offline-banner" role="alert">
      <span className="offline-banner__dot" />
      <span className="offline-banner__text">
        Serveur hors ligne — les modifications ne seront pas sauvegardées
      </span>
      {checking && <span className="offline-banner__spin">↻</span>}
    </div>
  );
};

export default OfflineBanner;
