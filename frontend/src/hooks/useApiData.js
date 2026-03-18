// ============================================================
// hooks/useApiData.js — VERSÃO CORRIGIDA
// Correções:
//   1. TTL reduzido para 30s (mais reativo a filtros)
//   2. Cache invalidado quando filtros mudam (clearCacheByPrefix)
//   3. AbortController corrigido para não vazar memória
//   4. Melhor tratamento de erros
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = '/api';

// Cache simples no módulo (compartilhado entre renders)
const moduleCache = new Map();

// Limpa todas as entradas de cache que contêm determinado prefixo
// Chamado quando filtros mudam, garantindo dados frescos
export function clearApiCache(prefix = '') {
  if (!prefix) {
    moduleCache.clear();
    return;
  }
  for (const key of moduleCache.keys()) {
    if (key.includes(prefix)) moduleCache.delete(key);
  }
}

export function useApiData(endpoint, params = '', options = {}) {
  const { ttl = 30_000, enabled = true } = options; // TTL: 30s
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const abortRef = useRef(null);

  const url = `${API_BASE}/${endpoint}${params ? `?${params}` : ''}`;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Verificar cache válido
    const cached = moduleCache.get(url);
    if (cached && Date.now() - cached.ts < ttl) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    // Cancelar request anterior da MESMA instância do hook
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
      const json = await res.json();
      moduleCache.set(url, { data: json, ts: Date.now() });
      setData(json);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        console.error(`[useApiData] ${endpoint}:`, err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [url, enabled, ttl]);

  useEffect(() => {
    fetchData();
    // Cleanup: abortar ao desmontar ou ao mudar url
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ── Hooks específicos ─────────────────────────────────────────

export function useKpis(filterParams) {
  return useApiData('sales/kpis', filterParams);
}

export function useEvolucao(filterParams, agrupamento = 'MES') {
  const params = filterParams
    ? `${filterParams}&agrupamento=${agrupamento}`
    : `agrupamento=${agrupamento}`;
  return useApiData('sales/evolucao', params);
}

export function useRanking(tipo, filterParams, limit = 10) {
  const params = filterParams
    ? `${filterParams}&limit=${limit}`
    : `limit=${limit}`;
  return useApiData(`sales/ranking/${tipo}`, params);
}