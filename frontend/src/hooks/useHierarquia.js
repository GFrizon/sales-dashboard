// ============================================================
// hooks/useHierarquia.js
// Busca dados de um nível da hierarquia sob demanda
// Features:
//   • AbortController — cancela request se componente desmontar
//   • Cache local (Map) — evita refetch ao reabrir o mesmo nó
//   • Retry automático 1x em caso de erro de rede
//   • Estado granular: idle | loading | success | error
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';

const BASE = '/api/hierarquia';

// Cache compartilhado entre instâncias (por URL)
const localCache = new Map();

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('dashboard_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * @param {string|null} url   - URL para buscar (null = não busca)
 * @param {object}      opts  - { ttl, skip }
 */
export function useHierLevel(url, opts = {}) {
  const { ttl = 300_000, skip = false } = opts; // ttl em ms

  const [data,    setData]    = useState(null);
  const [status,  setStatus]  = useState('idle'); // idle|loading|success|error
  const [error,   setError]   = useState(null);
  const abortRef  = useRef(null);
  const mounted   = useRef(true);

  const fetch_ = useCallback(async (forceRefetch = false) => {
    if (!url || skip) return;

    // Cache hit
    if (!forceRefetch) {
      const hit = localCache.get(url);
      if (hit && Date.now() - hit.ts < ttl) {
        setData(hit.data);
        setStatus('success');
        return;
      }
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStatus('loading');
    setError(null);

    const attemptFetch = async (attempt) => {
      try {
        const res = await fetch(url, {
          signal:  abortRef.current.signal,
          headers: { Accept: 'application/json', ...getAuthHeaders() },
        });

        if (!res.ok) {
          if (res.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('dashboard_token');
            window.location.href = '/login';
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        const rows = json.rows ?? json; // suporta { rows: [] } e array direto

        if (!mounted.current) return;

        localCache.set(url, { data: rows, ts: Date.now() });
        setData(rows);
        setStatus('success');
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (attempt < 2) {
          // Retry automático após 800ms
          await new Promise(r => setTimeout(r, 800));
          return attemptFetch(attempt + 1);
        }
        if (!mounted.current) return;
        setError(err.message);
        setStatus('error');
      }
    };

    await attemptFetch(1);
  }, [url, skip, ttl]);

  useEffect(() => {
    mounted.current = true;
    fetch_();
    return () => {
      mounted.current = false;
      abortRef.current?.abort();
    };
  }, [fetch_]);

  const refetch = useCallback(() => fetch_(true), [fetch_]);

  // Limpa o cache desta URL (útil ao mudar filtros)
  const invalidate = useCallback(() => {
    localCache.delete(url);
    fetch_(true);
  }, [url, fetch_]);

  return { data, status, error, refetch, invalidate,
    loading: status === 'loading',
    empty:   status === 'success' && (!data || data.length === 0),
  };
}

// Limpa todo o cache local (chamado ao mudar filtros globais)
export function clearHierCache() {
  localCache.clear();
}

// Gera URL com filtros como query string
export function hierUrl(path, filters = {}) {
  const qs = Object.entries(filters)
    .filter(([,v]) => v)
    .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${BASE}${path}${qs ? `?${qs}` : ''}`;
}
