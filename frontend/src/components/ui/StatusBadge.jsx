// ============================================================
// components/ui/StatusBadge.jsx
// Indicador de status da API (online / offline / mock)
// ============================================================
'use client';
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database } from 'lucide-react';

const API_BASE = '/api';

export function StatusBadge() {
  const [status, setStatus] = useState('checking'); // checking | online | offline | mock

  useEffect(() => {
    async function check() {
      try {
        const res  = await fetch('/health', { signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        setStatus(data.mock ? 'mock' : 'online');
      } catch {
        setStatus('offline');
      }
    }
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  const config = {
    checking: { label: 'Verificando...', color: 'text-gray-400 bg-gray-100', dot: 'bg-gray-300' },
    online:   { label: 'Oracle conectado', color: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-500', pulse: true },
    mock:     { label: 'Modo demo', color: 'text-amber-700 bg-amber-50', dot: 'bg-amber-400' },
    offline:  { label: 'API offline', color: 'text-red-700 bg-red-50', dot: 'bg-red-500' },
  }[status];

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`} />
      {config.label}
    </div>
  );
}

export default StatusBadge;
