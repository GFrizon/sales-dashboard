// ============================================================
// app/login/page.jsx
// Tela de login executiva — dark fintech aesthetic
// ============================================================
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth }   from '../../context/AuthContext';

// ── Partículas animadas de fundo ─────────────────────────────
function Particles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const dots = Array.from({ length: 60 }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      r:  Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      a:  Math.random() * 0.4 + 0.1,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(d => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width)  d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${d.a})`;
        ctx.fill();
      });

      // linhas entre pontos próximos
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

// ── Componente do ticker de métricas ─────────────────────────
function MetricTicker() {
  const metrics = [
    '📈  Receita monitorada em tempo real',
    '🔒  Dados protegidos com criptografia',
    '👥  Personalização por usuário',
    '📊  Curva ABC • Rankings • KPIs',
    '🌎  Cobertura nacional de vendas',
  ];
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % metrics.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(t);
  }, []); // eslint-disable-line

  return (
    <p
      style={{
        fontSize: 13,
        color: '#94a3b8',
        transition: 'opacity 0.4s',
        opacity: visible ? 1 : 0,
        minHeight: 20,
        textAlign: 'center',
        letterSpacing: '0.01em',
      }}
    >
      {metrics[idx]}
    </p>
  );
}

export default function LoginPage() {
  const { login, error, setError, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [shake,    setShake]    = useState(false);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Redireciona se já está logado
  useEffect(() => {
    if (!authLoading && user) router.replace('/');
  }, [user, authLoading, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const ok = await login(username.trim(), password);

    setLoading(false);
    if (ok) {
      router.replace('/');
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  }

  if (!mounted || authLoading) return null;

  // ── Estilos inline (sem Tailwind nas animações complexas) ──
  const styles = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%, #0f1f3d 0%, #070d1a 60%, #000 100%)',
      fontFamily: '"DM Sans", "Inter", system-ui, sans-serif',
      padding: '24px',
      position: 'relative',
    },
    card: {
      position: 'relative',
      zIndex: 10,
      width: '100%',
      maxWidth: 440,
      animation: mounted ? 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
    },
    glass: {
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(56, 189, 248, 0.12)',
      borderRadius: 24,
      padding: '40px 36px',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      animation: shake ? 'shake 0.5s ease' : 'none',
    },
    logo: {
      width: 84,
      height: 84,
      background: '#ffffff',
      borderRadius: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      border: '1px solid rgba(56, 189, 248, 0.2)',
      boxShadow: '0 10px 28px rgba(14, 165, 233, 0.28)',
      overflow: 'hidden',
    },
    logoImg: { width: 64, height: 64, objectFit: 'contain' },
    title: {
      fontSize: 26,
      fontWeight: 700,
      color: '#f1f5f9',
      textAlign: 'center',
      marginBottom: 4,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    subtitle: {
      fontSize: 13,
      color: '#64748b',
      textAlign: 'center',
      marginBottom: 32,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
    },
    label: {
      display: 'block',
      fontSize: 12,
      fontWeight: 600,
      color: '#94a3b8',
      marginBottom: 8,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    },
    inputWrap: {
      position: 'relative',
      marginBottom: 20,
    },
    input: {
      width: '100%',
      background: 'rgba(30, 41, 59, 0.8)',
      border: '1px solid rgba(71, 85, 105, 0.5)',
      borderRadius: 12,
      padding: '13px 16px',
      fontSize: 14,
      color: '#e2e8f0',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
    },
    inputFocus: {
      borderColor: '#0ea5e9',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.12)',
    },
    eyeBtn: {
      position: 'absolute',
      right: 14,
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: '#64748b',
      cursor: 'pointer',
      padding: 4,
      display: 'flex',
      alignItems: 'center',
    },
    errorBox: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.25)',
      borderRadius: 10,
      padding: '10px 14px',
      marginBottom: 20,
      fontSize: 13,
      color: '#fca5a5',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    button: {
      width: '100%',
      padding: '14px 20px',
      background: loading
        ? 'rgba(14, 165, 233, 0.5)'
        : 'linear-gradient(135deg, #0ea5e9, #2563eb)',
      border: 'none',
      borderRadius: 12,
      color: '#fff',
      fontSize: 15,
      fontWeight: 600,
      cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
      boxShadow: loading ? 'none' : '0 4px 16px rgba(14, 165, 233, 0.35)',
      letterSpacing: '0.01em',
      fontFamily: 'inherit',
    },
    divider: {
      height: 1,
      background: 'rgba(71, 85, 105, 0.3)',
      margin: '28px 0',
    },
    hintBox: {
      background: 'rgba(30, 41, 59, 0.5)',
      border: '1px solid rgba(71, 85, 105, 0.3)',
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 20,
    },
    hintTitle: {
      fontSize: 11,
      color: '#475569',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: 6,
    },
    hintRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      color: '#64748b',
      padding: '2px 0',
    },
    hintVal: {
      fontFamily: 'monospace',
      color: '#0ea5e9',
      fontSize: 11,
    },
  };

  return (
    <>
      {/* Fontes */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* CSS animations */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%,100%  { transform: translateX(0); }
          15%, 45% { transform: translateX(-8px); }
          30%, 60% { transform: translateX(8px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .login-input:focus {
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12) !important;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(14, 165, 233, 0.45) !important;
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>

      <Particles />

      {/* Glow decorativo */}
      <div style={{
        position: 'fixed',
        top: '20%', left: '10%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 1,
      }} />
      <div style={{
        position: 'fixed',
        bottom: '15%', right: '10%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 1,
      }} />

      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.glass}>

            {/* Logo */}
            <div style={styles.logo}>
              <img src="/branding/bakof-logo.png" alt="Bakof" style={styles.logoImg} />
            </div>

            <h1 style={styles.title}>Dashboard de Vendas</h1>
            <p style={styles.subtitle}>Acesso Restrito · Executivo</p>

            {/* Hint de credenciais (remover em produção) */}
            {process.env.NODE_ENV !== 'production' && (
              <div style={styles.hintBox}>
                <div style={styles.hintTitle}>Credenciais de Demonstração</div>
                <div style={styles.hintRow}>
                  <span>Administrador</span>
                  <span style={styles.hintVal}>admin / admin123</span>
                </div>
                <div style={styles.hintRow}>
                  <span>Diretor</span>
                  <span style={styles.hintVal}>diretor / diretor123</span>
                </div>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div style={styles.errorBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1" fill="#ef4444" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="on">
              {/* Usuário */}
              <div style={styles.inputWrap}>
                <label style={styles.label} htmlFor="username">Usuário</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#475569',
                    pointerEvents: 'none',
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="seu.usuario"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="login-input"
                    style={{ ...styles.input, paddingLeft: 40 }}
                    required
                  />
                </div>
              </div>

              {/* Senha */}
              <div style={styles.inputWrap}>
                <label style={styles.label} htmlFor="password">Senha</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#475569',
                    pointerEvents: 'none',
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="login-input"
                    style={{ ...styles.input, paddingLeft: 40, paddingRight: 42 }}
                    required
                  />
                  <button
                    type="button"
                    style={styles.eyeBtn}
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={-1}
                  >
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                          stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Botão */}
              <button
                type="submit"
                className="login-btn"
                style={styles.button}
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24"
                      style={{ animation: 'spin 0.8s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" />
                      <path d="M12 2a10 10 0 0 1 10 10"
                        stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
                    </svg>
                    Autenticando...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    Entrar no Dashboard
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M12 5l7 7-7 7"
                        stroke="white" strokeWidth="2.2"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            <div style={styles.divider} />
            <MetricTicker />
          </div>

          {/* Rodapé */}
          <p style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 11,
            color: '#334155',
            letterSpacing: '0.04em',
          }}>
            © {new Date().getFullYear()} Dashboard de Vendas · Acesso interno
          </p>
          <p style={{
            textAlign: 'center',
            marginTop: 4,
            fontSize: 10,
            color: '#64748b',
            opacity: 0.75,
            letterSpacing: '0.03em',
          }}>
            Gabriel Chimello Frizon
          </p>
        </div>
      </div>
    </>
  );
}
