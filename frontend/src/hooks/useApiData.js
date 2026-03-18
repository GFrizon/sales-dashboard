// ============================================================
// hooks/useApiData.js — VERSÃO CORRIGIDA
// Correções:
//   - Cache keyed por URL completa (inclui params)
//   - clearApiCache limpa por prefixo de forma correta
//   - AbortController sem memory leak
//   - TTL de 60s para dados de dashboard
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = '/api';

// Cache em memória (por sessão) — mapa URL → { data, ts }
const moduleCache = new Map();

/**
 * Limpa entradas de cache que contêm o prefixo informado.
 * Chamado automaticamente quando filtros mudam.
 */
export function clearApiCache(prefix = '') {
  if (!prefix) {
    moduleCache.clear();
    return;
  }
  for (const key of moduleCache.keys()) {
    if (key.includes(prefix)) moduleCache.delete(key);
  }
}

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('dashboard_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Hook genérico para buscar dados da API com cache e AbortController.
 *
 * @param {string}  endpoint  - Caminho relativo (ex: 'sales/kpis')
 * @param {string}  params    - Query string (ex: 'dataInicio=2024-01-01&vendedor=...')
 * @param {object}  options   - { ttl, enabled }
 */
export function useApiData(endpoint, params = '', options = {}) {
  const { ttl = 60_000, enabled = true } = options;

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const abortRef    = useRef(null);
  const isMounted   = useRef(true);

  const url = `${API_BASE}/${endpoint}${params ? `?${params}` : ''}`;

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Cache ainda válido?
    const cached = moduleCache.get(url);
    if (cached && Date.now() - cached.ts < ttl) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    // Cancela request anterior desta instância
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, {
        signal: abortRef.current.signal,
        headers: {
          'Accept': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        if (res.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('dashboard_token');
          localStorage.removeItem('dashboard_user');
          window.location.href = '/login';
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();

      // Só atualiza estado se o componente ainda estiver montado
      if (isMounted.current) {
        moduleCache.set(url, { data: json, ts: Date.now() });
        setData(json);
        setError(null);
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // cancelamento intencional

      if (isMounted.current) {
        setError(err.message);
        console.error(`[useApiData] ${endpoint}:`, err.message);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [url, enabled, ttl]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false;
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
  const params = [filterParams, `agrupamento=${agrupamento}`].filter(Boolean).join('&');
  return useApiData('sales/evolucao', params);
}

export function useRanking(tipo, filterParams, limit = 10) {
  const params = [filterParams, `limit=${limit}`].filter(Boolean).join('&');
  return useApiData(`sales/ranking/${tipo}`, params);
}
