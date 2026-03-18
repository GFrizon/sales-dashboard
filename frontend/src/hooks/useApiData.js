// ============================================================
// hooks/useApiData.js
// Hook genérico para buscar dados da API com loading/error/cache
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = '/api';

// Cache simples no módulo (compartilhado entre renders)
const moduleCache = new Map();

export function useApiData(endpoint, params = '', options = {}) {
  const { ttl = 60000, enabled = true } = options; // TTL em ms
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const url = `${API_BASE}/${endpoint}${params ? `?${params}` : ''}`;

  const fetch_ = useCallback(async () => {
    if (!enabled) return;

    // Verificar cache
    const cached = moduleCache.get(url);
    if (cached && Date.now() - cached.ts < ttl) {
      setData(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    // Cancelar request anterior
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      moduleCache.set(url, { data: json, ts: Date.now() });
      setData(json);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url, enabled, ttl]);

  useEffect(() => {
    fetch_();
    return () => abortRef.current?.abort();
  }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}

// Hook específico para KPIs
export function useKpis(filterParams) {
  return useApiData('sales/kpis', filterParams);
}

// Hook específico para evolução
export function useEvolucao(filterParams, agrupamento = 'MES') {
  return useApiData('sales/evolucao', `${filterParams}&agrupamento=${agrupamento}`);
}

// Hook específico para rankings
export function useRanking(tipo, filterParams, limit = 10) {
  return useApiData(`sales/ranking/${tipo}`, `${filterParams}&limit=${limit}`);
}
