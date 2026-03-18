// ============================================================
// components/auth/AuthGuard.jsx
// Redireciona para /login se não autenticado
// ============================================================
'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const PUBLIC_PATHS = ['/login'];

export function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router  = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      router.replace('/login');
    }
  }, [user, loading, isPublic, router]);

  // Tela de carregamento durante verificação do token
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#070d1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{
          width: 44,
          height: 44,
          background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"
              stroke="white" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{
          width: 32, height: 32,
          border: '3px solid rgba(14,165,233,0.2)',
          borderTop: '3px solid #0ea5e9',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user && !isPublic) return null;

  return children;
}

export default AuthGuard;
