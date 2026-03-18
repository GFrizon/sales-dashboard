// ============================================================
// context/AuthContext.jsx
// Gerencia autenticação JWT no frontend
// ============================================================
'use client';
import {
  createContext, useContext, useState, useEffect,
  useCallback, useMemo,
} from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

const TOKEN_KEY = 'dashboard_token';
const USER_KEY  = 'dashboard_user';
const AUTH_BASE = '/auth'; // usa o proxy do Next.js
const LOGIN_TIMEOUT_MS = 12000;

function parseJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // verifica token salvo
  const [error,   setError]   = useState(null);

  // ── Recupera sessão salva ───────────────────────────────────
  useEffect(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const saved = localStorage.getItem(USER_KEY);
      if (token && saved) {
        const payload = parseJwtPayload(token);
        if (payload?.exp && payload.exp * 1000 > Date.now()) {
          setUser(JSON.parse(saved));
        } else {
          // Token expirado
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
    } catch { /* ignora */ }
    setLoading(false);
  }, []);

  // ── Interceptor global: adiciona Bearer nos requests ────────
  // (usado pelos hooks useApiData via getAuthHeader)

  const getToken = useCallback(() => {
    try { return localStorage.getItem(TOKEN_KEY); }
    catch { return null; }
  }, []);

  const getAuthHeader = useCallback(() => {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, [getToken]);

  // ── Login ───────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);
    try {
      const res = await fetch(`${AUTH_BASE}/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login.');
        return false;
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY,  JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Login demorou demais. Tente novamente.');
      } else {
        setError('Não foi possível conectar ao servidor.');
      }
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  // ── Logout ──────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${AUTH_BASE}/logout`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      router.push('/login');
    }
  }, [getToken, router]);

  // ── Troca de senha ──────────────────────────────────────────
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const res = await fetch(`${AUTH_BASE}/change-password`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body:    JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao alterar senha.');
    return true;
  }, [getAuthHeader]);

  const isAdmin = user?.role === 'admin';

  const value = useMemo(() => ({
    user, loading, error, isAdmin,
    login, logout, changePassword,
    getToken, getAuthHeader,
    setError,
  }), [user, loading, error, isAdmin, login, logout, changePassword, getToken, getAuthHeader]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
