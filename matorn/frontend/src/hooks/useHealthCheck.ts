// /frontend/src/hooks/useHealthCheck.ts
import { useState, useEffect, useRef } from 'react';

const HEALTH_URL     = '/api/health/';
const INTERVAL_MS    = 30_000;   // ping toutes les 30s
const TIMEOUT_MS     = 5_000;    // considéré offline si pas de réponse en 5s

type Status = 'online' | 'offline' | 'unknown';

interface HealthState {
  status:    Status;
  checking:  boolean;
  lastCheck: Date | null;
}

export const useHealthCheck = (): HealthState => {
  const [status,    setStatus]    = useState<Status>('unknown');
  const [checking,  setChecking]  = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ping = async () => {
    setChecking(true);
    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(HEALTH_URL, {
        method: 'GET',
        signal: controller.signal,
        cache:  'no-store',
      });
      clearTimeout(timeout);

      setStatus(res.ok ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    } finally {
      setChecking(false);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    // Premier ping immédiat
    ping();

    // Puis toutes les 30s
    timerRef.current = setInterval(ping, INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, checking, lastCheck };
};
