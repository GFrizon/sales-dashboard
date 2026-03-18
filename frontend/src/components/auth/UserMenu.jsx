// ============================================================
// components/auth/UserMenu.jsx
// Avatar + nome + menu de perfil no header
// ============================================================
'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export function UserMenu() {
  const { user, logout, changePassword } = useAuth();
  const [open,    setOpen]    = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [cur, setCur] = useState('');
  const [nw,  setNw]  = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  async function handlePwChange(e) {
    e.preventDefault();
    setMsg(''); setErr('');
    try {
      await changePassword(cur, nw);
      setMsg('Senha alterada com sucesso!');
      setCur(''); setNw('');
      setTimeout(() => { setPwModal(false); setMsg(''); }, 2000);
    } catch (e) {
      setErr(e.message);
    }
  }

  if (!user) return null;

  const roleLabel = { admin: 'Administrador', viewer: 'Visualizador' }[user.role] || user.role;
  const roleColor = user.role === 'admin' ? '#f59e0b' : '#38bdf8';

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
        >
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', fontSize: 11 }}
          >
            {user.avatar || user.name?.substring(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-gray-800 leading-tight max-w-[120px] truncate">
              {user.name}
            </div>
            <div className="text-[10px] leading-tight" style={{ color: roleColor }}>
              {roleLabel}
            </div>
          </div>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"
              stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
            style={{ width: 220 }}
          >
            {/* Header do menu */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}
                >
                  {user.avatar || user.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white leading-tight truncate" style={{ maxWidth: 140 }}>
                    {user.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                </div>
              </div>
            </div>

            <div className="py-1.5">
              <button
                onClick={() => { setOpen(false); setPwModal(true); }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2"
                    stroke="currentColor" strokeWidth="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Alterar senha
              </button>

              <div className="my-1 border-t border-gray-100" />

              <button
                onClick={() => { setOpen(false); logout(); }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <polyline points="16 17 21 12 16 7"
                    stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="21" y1="12" x2="9" y2="12"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Alterar senha */}
      {pwModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setPwModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Alterar Senha</h3>
              <button
                onClick={() => { setPwModal(false); setErr(''); setMsg(''); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <form onSubmit={handlePwChange} className="px-6 py-5 space-y-4">
              {err && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  {err}
                </div>
              )}
              {msg && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
                  ✓ {msg}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Senha atual
                </label>
                <input
                  type="password"
                  value={cur}
                  onChange={e => setCur(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nova senha
                </label>
                <input
                  type="password"
                  value={nw}
                  onChange={e => setNw(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  minLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}
              >
                Salvar nova senha
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default UserMenu;
