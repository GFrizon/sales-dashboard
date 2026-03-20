'use client';
import { useEffect, useState } from 'react';
import { fmtBRL, fmtFull, fmtPct, fmtPMK } from './consultorView.formatters';

export function SummaryBar({ data, loading }) {
  const cards = [
    { label:'Receita Total',   value: loading ? '…' : fmtBRL(data?.REC),               icon:'💰', color:'#4f46e5', bg:'#eef2ff' },
    { label:'Consultores',     value: loading ? '…' : data?.totalConsultores    ?? 0,   icon:'👤', color:'#0284c7', bg:'#f0f9ff' },
    { label:'Representantes',  value: loading ? '…' : data?.totalRepresentantes ?? 0,   icon:'🧑‍💼', color:'#7c3aed', bg:'#faf5ff' },
    { label:'Clientes',        value: loading ? '…' : data?.totalClientes       ?? 0,   icon:'🏢', color:'#d97706', bg:'#fffbeb' },
    { label:'Pedidos',         value: loading ? '…' : data?.totalPedidos        ?? 0,   icon:'🛢️', color:'#16a34a', bg:'#f0fdf4' },
    { label:'Desc. Médio',     value: loading ? '…' : fmtPct(data?.DESC),              icon:'🏷️', color:(+data?.DESC)>20?'#dc2626':(+data?.DESC)>12?'#d97706':'#16a34a', bg:(+data?.DESC)>20?'#fef2f2':(+data?.DESC)>12?'#fffbeb':'#f0fdf4' },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, marginBottom:14 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background:c.bg, borderRadius:10, padding:'11px 13px', border:`1px solid ${c.color}22` }}>
          <div style={{ fontSize:16, marginBottom:5 }}>{c.icon}</div>
          <div className="mono" style={{ fontSize:17, fontWeight:800, color:c.color, lineHeight:1, minHeight:22 }}>
            {loading ? <div style={{ width:60, height:18, background:`${c.color}22`, borderRadius:4 }}/> : c.value}
          </div>
          <div style={{ fontSize:9, color:'#6b7280', marginTop:4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TABULAR VIEW — puxa dados do nível de clientes (mesmos filtros)
// ─────────────────────────────────────────────────────────────
export function TabView({ rows = [], loading = false, error = null, onRetry }) {
  if (loading && (!rows || rows.length === 0)) {
    return (
      <div style={{ padding:'22px 20px', color:'#64748b', fontSize:12 }}>
        Carregando tabela...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding:'18px 20px', color:'#dc2626', fontSize:12, display:'flex', alignItems:'center', gap:10 }}>
        <span>Erro ao carregar dados tabulares.</span>
        <button
          onClick={onRetry}
          style={{ fontSize:11, color:'#dc2626', background:'#fff', border:'1px solid #fca5a5', borderRadius:6, padding:'3px 10px', cursor:'pointer' }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div style={{ padding:'24px 20px', textAlign:'center', color:'#94a3b8', fontSize:12 }}>
        Nenhum dado encontrado para os filtros atuais.
      </div>
    );
  }

  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:920 }}>
        <thead>
          <tr style={{ background:'#f8fafc' }}>
            {['Consultor','Receita','Faturamento','Desc. Médio','Comissão Média','PMK','Clientes','Representantes','Pedidos'].map((h) => (
              <th key={h} style={{ textAlign: h === 'Consultor' ? 'left' : 'right', padding:'10px 12px', fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #e2e8f0' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.id || `${r.nome}-${idx}`} className="tab-tr">
              <td style={{ padding:'9px 12px', borderBottom:'1px solid #f1f5f9', fontSize:12, fontWeight:700, color:'#1f2937', whiteSpace:'nowrap' }}>{r.nome}</td>
              <td className="mono" style={{ padding:'9px 12px', borderBottom:'1px solid #f1f5f9', fontSize:11, textAlign:'right', color:'#111827' }}>{fmtFull(r.REC)}</td>
              <td className="mono" style={{ padding:'9px 12px', borderBottom:'1px solid #f1f5f9', fontSize:11, textAlign:'right', color:'#111827' }}>{fmtFull(r.FAT)}</td>
              <td className="mono" style={{ padding:'9px 12px', borderBottom:'1px solid #f1f5f9', fontSize:11, textAlign:'right', color:(+r.DESC)>20?'#dc2626':(+r.DESC)>12?'#d97706':'#16a34a' }}>{fmtPct(r.DESC)}</td>
              <td className="mono" style={{ padding:'9px 12px', borderBottom:'1px solid #f1f5f9', fontSize:11, textAlign:'right', color:'#4f46e5' }}>{fmtPct(r.COM)}</td>
              <td className="mono" style={{ padding:'9px 12px', borderBottom:'1px solid #f1f5f9', fontSize:11, textAlign:'right', color:'#0284c7' }}>{fmtPMK(r.PMK)}</td>
              <td className="mono" style={{ padding:'9px 12px', borderBottom:'1px solid #f1f5f9', fontSize:11, textAlign:'right', color:'#334155' }}>{(r.totalClientes || 0).toLocaleString('pt-BR')}</td>
              <td className="mono" style={{ padding:'9px 12px', borderBottom:'1px solid #f1f5f9', fontSize:11, textAlign:'right', color:'#334155' }}>{(r.totalReps || 0).toLocaleString('pt-BR')}</td>
              <td className="mono" style={{ padding:'9px 12px', borderBottom:'1px solid #f1f5f9', fontSize:11, textAlign:'right', color:'#334155' }}>{(r.totalPedidos || 0).toLocaleString('pt-BR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHIP FILTER
// ─────────────────────────────────────────────────────────────
export function ChipGroup({ label, options, value, onChange, formatOption }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <span style={{ fontSize:9, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:700 }}>{label}</span>
      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
        <button className={`chip ${!value?'on':''}`} onClick={()=>onChange('')} style={{ fontSize:10,padding:'3px 10px',borderRadius:99,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#374151',fontWeight:600,cursor:'pointer' }}>Todos</button>
        {options.map(o => (
          <button key={o} className={`chip ${value===o?'on':''}`} onClick={()=>onChange(value===o?'':o)} style={{ fontSize:10,padding:'3px 10px',borderRadius:99,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#374151',fontWeight:600,cursor:'pointer' }}>{formatOption ? formatOption(o) : o}</button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CACHE STATUS BADGE
// ─────────────────────────────────────────────────────────────
export function CacheBadge() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    fetch('/health').then(r=>r.json()).then(d=>setStatus(d.cache)).catch(()=>{});
  }, []);
  if (!status) return null;
  const isRedis = status.driver === 'redis' && status.connected;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color: isRedis ? '#16a34a' : '#d97706', background: isRedis ? '#f0fdf4' : '#fffbeb', padding:'3px 9px', borderRadius:99, border:`1px solid ${isRedis?'#bbf7d0':'#fde68a'}` }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background: isRedis ? '#16a34a' : '#d97706', display:'inline-block' }}/>
      {isRedis ? 'Redis' : 'Cache Memória'}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
