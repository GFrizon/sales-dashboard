// ============================================================
// ConsultorView.jsx — Hierarquia REAL com Oracle
// Lazy loading verdadeiro: cada nível só busca ao expandir
// ============================================================
'use client';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useHierLevel, hierUrl, clearHierCache } from '../hooks/useHierarquia';
import { useApiData, clearApiCache } from '../hooks/useApiData';
import { useDashboard } from '../context/DashboardContext';

// ─────────────────────────────────────────────────────────────
// PALETA
// ─────────────────────────────────────────────────────────────
const LS = {
  0: { rowBg:'#eef2ff', rowHover:'#e0e7ff', border:'#c7d2fe', accent:'#4f46e5', text:'#1e1b4b', sub:'#6366f1', indent:0,  iconBg:'#e0e7ff' },
  1: { rowBg:'#f0f9ff', rowHover:'#e0f2fe', border:'#bae6fd', accent:'#0284c7', text:'#0c4a6e', sub:'#0ea5e9', indent:24, iconBg:'#e0f2fe' },
  2: { rowBg:'#faf5ff', rowHover:'#f3e8ff', border:'#e9d5ff', accent:'#7c3aed', text:'#3b0764', sub:'#8b5cf6', indent:48, iconBg:'#ede9fe' },
  3: { rowBg:'#fffbeb', rowHover:'#fef3c7', border:'#fde68a', accent:'#d97706', text:'#451a03', sub:'#b45309', indent:72, iconBg:'#fef3c7' },
  4: { rowBg:'#f0fdf4', rowHover:'#dcfce7', border:'#bbf7d0', accent:'#16a34a', text:'#14532d', sub:'#15803d', indent:96, iconBg:'#dcfce7' },
};

// ─────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────
const fmtBRL  = v => new Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL', notation:'compact', maximumFractionDigits:1 }).format(v||0);
const fmtFull = v => new Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL' }).format(v||0);
const fmtPct  = v => `${(+v||0).toFixed(1)}%`;
const fmtPMK  = v => `R$\u202f${(+v||0).toFixed(2)}/kg`;

function tipoLabel(tipo) {
  const t = String(tipo || '').trim().toUpperCase();
  if (t === 'R') return 'Revenda';
  if (t === 'C') return 'Consumo';
  if (t === 'I') return 'Inscrito';
  if (t === 'S') return 'Simples Nacional';
  if (t === 'T') return 'Construtora';
  return String(tipo || '').trim() || 'N/D';
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.hv { font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
.hv * { box-sizing:border-box; }
.hv-row { transition:background 0.13s; cursor:pointer; }
.hv-row:active { filter:brightness(0.97); }
.hv-kids { overflow:hidden; max-height:0; transition:max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease; opacity:0; }
.hv-kids.open { max-height:99999px; opacity:1; }
.hv-chev { transition:transform 0.22s cubic-bezier(0.4,0,0.2,1); flex-shrink:0; }
.hv-chev.open { transform:rotate(90deg); }
.hv-lib { background:#dcfce7; color:#166534; }
.hv-blq { background:#fee2e2; color:#991b1b; }
.hv-ana { background:#fef9c3; color:#713f12; }
.mono { font-family:'DM Mono',monospace; }
@keyframes fadeUp { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
.hv-fi { animation:fadeUp 0.16s ease-out forwards; opacity:0; }
@keyframes spin { to{transform:rotate(360deg)} }
.spin { animation:spin 0.7s linear infinite; }
.tab-tr:hover td { background:#f0f4ff !important; }
.chip { transition:all 0.13s; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
.chip:hover { border-color:#6366f1 !important; color:#4f46e5 !important; }
.chip.on { background:#4f46e5 !important; color:#fff !important; border-color:#4f46e5 !important; }
.vtab { transition:all 0.15s; font-family:'Plus Jakarta Sans',sans-serif; }
.vtab.on { background:#1e293b; color:#f8fafc; box-shadow:0 2px 6px rgba(0,0,0,0.15); }
`;

// ─────────────────────────────────────────────────────────────
// MICRO COMPONENTS
// ─────────────────────────────────────────────────────────────
function Chevron({ open, color }) {
  return (
    <svg className={`hv-chev ${open?'open':''}`} width="16" height="16" viewBox="0 0 24 24" fill="none">
      <polyline points="9 18 15 12 9 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', minWidth:66 }}>
      <span style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', lineHeight:1, marginBottom:2 }}>{label}</span>
      <span className="mono" style={{ fontSize:12, fontWeight:700, color, lineHeight:1.2, whiteSpace:'nowrap' }}>{value}</span>
    </div>
  );
}

function Metrics({ rec, desc, com, pmk, recColor }) {
  const dc = +desc>20?'#dc2626':+desc>12?'#d97706':'#16a34a';
  return (
    <div style={{ display:'flex', gap:12, flexShrink:0, alignItems:'center' }}>
      <Metric label="Receita"  value={fmtBRL(rec)}  color={recColor||'#374151'} />
      <Metric label="Desconto" value={fmtPct(desc)} color={dc} />
      <Metric label="Comissão" value={fmtPct(com)}  color="#4f46e5" />
      <Metric label="PMK"      value={fmtPMK(pmk)}  color="#0284c7" />
    </div>
  );
}

function StatusBadge({ s }) {
  const u=(s||'').toUpperCase();
  const cls=u.includes('LIB')?'hv-lib':u.includes('BLO')?'hv-blq':'hv-ana';
  return <span className={cls} style={{ fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:99,textTransform:'uppercase',letterSpacing:'0.04em',whiteSpace:'nowrap' }}>{s}</span>;
}

function Bubble({ n, label, color }) {
  return <span style={{ fontSize:10,color,background:`${color}18`,padding:'2px 8px',borderRadius:99,fontWeight:600,whiteSpace:'nowrap' }}>{n} {label}{n!==1?'s':''}</span>;
}

function Guide({ level }) {
  const s = LS[level];
  return <div style={{ position:'absolute', left:s.indent-15, top:0, bottom:0, width:1, background:s.accent, opacity:0.15 }}/>;
}

// ── Skeleton de loading ──────────────────────────────────────
function SkeletonRows({ count = 3, depth = 1 }) {
  const s = LS[depth];
  return (
    <>
      {Array.from({ length:count }).map((_,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', background:s.rowBg, borderBottom:`1px solid ${s.border}`, padding:'10px 14px', gap:10 }}>
          <div style={{ width:s.indent, flexShrink:0 }}/>
          <div style={{ width:32, height:32, borderRadius:8, background:`${s.accent}22`, flexShrink:0 }}/>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ height:11, width:`${60-i*8}%`, background:`${s.accent}18`, borderRadius:4 }}/>
            <div style={{ height:9,  width:`${40-i*6}%`, background:`${s.accent}12`, borderRadius:4 }}/>
          </div>
          {[1,2,3,4].map(j => (
            <div key={j} style={{ width:66, height:28, background:`${s.accent}12`, borderRadius:4 }}/>
          ))}
        </div>
      ))}
    </>
  );
}

// ── Erro inline ──────────────────────────────────────────────
function ErrorRow({ msg, onRetry, depth = 1 }) {
  const s = LS[depth];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', background:'#fef2f2', borderBottom:`1px solid #fecaca`, fontSize:12 }}>
      <div style={{ width:s.indent, flexShrink:0 }}/>
      <span style={{ color:'#dc2626' }}>⚠️ {msg}</span>
      <button onClick={onRetry} style={{ marginLeft:'auto', fontSize:11, color:'#dc2626', background:'none', border:'1px solid #fca5a5', borderRadius:6, padding:'3px 10px', cursor:'pointer' }}>
        Tentar novamente
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NÍVEL 4 — ITENS (lazy ao abrir pedido)
// ─────────────────────────────────────────────────────────────
function ItemRow({ item, idx }) {
  const s=LS[4];
  return (
    <div className="hv-fi" style={{ animationDelay:`${idx*22}ms`, display:'flex', alignItems:'center', background:s.rowBg, borderBottom:`1px solid ${s.border}`, position:'relative' }}>
      <div style={{ position:'absolute', left:s.indent-15, top:0, bottom:0, width:1, background:s.accent, opacity:0.2 }}/>
      <div style={{ position:'absolute', left:s.indent-15, top:'50%', width:13, height:1, background:s.accent, opacity:0.2 }}/>
      <div style={{ width:s.indent, flexShrink:0 }}/>
      <div style={{ display:'flex', alignItems:'center', flex:1, padding:'7px 14px 7px 0', gap:9 }}>
        <div style={{ width:27, height:27, borderRadius:7, background:s.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13 }}>📦</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
            <span className="mono" style={{ fontSize:10, color:'#6b7280' }}>{item.cod}</span>
            <span style={{ fontSize:11, fontWeight:600, color:s.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180 }}>{item.nome}</span>
            <span style={{ fontSize:9, background:s.iconBg, color:s.accent, padding:'1px 6px', borderRadius:99, fontWeight:700 }}>{item.spec}</span>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:2, flexWrap:'wrap' }}>
            <span style={{ fontSize:9, color:'#9ca3af' }}>Qtde: <b style={{color:s.sub}}>{item.qtde}</b></span>
            <span style={{ fontSize:9, color:'#9ca3af' }}>R$ {item.preco}/un</span>
            <span style={{ fontSize:9, color:'#9ca3af' }}>{item.peso} kg/un</span>
          </div>
        </div>
        <Metrics rec={item.REC} desc={item.DESC} com={item.COM} pmk={item.PMK} recColor={s.accent}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NÍVEL 3 — PEDIDO
// ─────────────────────────────────────────────────────────────
function PedidoRow({ pedido }) {
  const [open, setOpen] = useState(false);
  const s = LS[3];

  // Só busca os itens quando abre
  const { data:itens, loading, error, refetch } = useHierLevel(
    open ? hierUrl(`/pedidos/${pedido.id}/itens`) : null,
    { ttl: 1_800_000 } // 30 min — pedidos fechados não mudam
  );

  function toggle() { setOpen(v => !v); }

  return (
    <div>
      <div className="hv-row" onClick={toggle}
        style={{ display:'flex', alignItems:'center', background:open?s.rowHover:s.rowBg, borderBottom:`1px solid ${s.border}`, borderLeft:`3px solid ${open?s.accent:'transparent'}`, transition:'all 0.13s', position:'relative' }}>
        <Guide level={3}/>
        <div style={{ width:s.indent, flexShrink:0 }}/>
        <div style={{ display:'flex', alignItems:'center', flex:1, padding:'8px 14px 8px 0', gap:9 }}>
          <div style={{ width:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {loading && !itens
              ? <div className="spin" style={{ width:14, height:14, border:`2px solid ${s.border}`, borderTop:`2px solid ${s.accent}`, borderRadius:'50%' }}/>
              : <Chevron open={open} color={s.accent}/>}
          </div>
          <div style={{ width:28, height:28, borderRadius:7, background:s.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:14 }}>📄</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span className="mono" style={{ fontSize:12, fontWeight:700, color:s.text }}>#{pedido.numero}</span>
              <StatusBadge s={pedido.status}/>
              <span style={{ fontSize:10, color:s.sub }}>{pedido.data}</span>
              {pedido.totalItens > 0 && <span style={{ fontSize:10, color:'#9ca3af' }}>{pedido.totalItens} item{pedido.totalItens!==1?'s':''}</span>}
            </div>
          </div>
          <Metrics rec={pedido.REC} desc={pedido.DESC} com={pedido.COM} pmk={pedido.PMK} recColor={s.accent}/>
        </div>
      </div>
      <div className={`hv-kids ${open?'open':''}`}>
        {open && error  && <ErrorRow msg={error} onRetry={refetch} depth={4}/>}
        {open && loading && !itens && <SkeletonRows count={3} depth={4}/>}
        {open && itens   && itens.map((it,i) => <ItemRow key={it.id} item={it} idx={i}/>)}
        {open && itens   && itens.length===0 && (
          <div style={{ padding:'10px 16px', fontSize:11, color:'#9ca3af', background:LS[4].rowBg }}>
            <div style={{ width:LS[4].indent, display:'inline-block' }}/>
            Nenhum item encontrado para este pedido.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NÍVEL 2 — CLIENTE
// ─────────────────────────────────────────────────────────────
function ClienteRow({ cliente, filters }) {
  const [open, setOpen] = useState(false);
  const s = LS[2];

  const { data:pedidos, loading, error, refetch } = useHierLevel(
    open ? hierUrl(`/clientes/${cliente.id}/pedidos`, filters) : null,
    { ttl: 300_000 }
  );

  return (
    <div>
      <div className="hv-row" onClick={() => setOpen(v=>!v)}
        style={{ display:'flex', alignItems:'center', background:open?s.rowHover:s.rowBg, borderBottom:`1px solid ${s.border}`, borderLeft:`3px solid ${open?s.accent:'transparent'}`, transition:'all 0.13s', position:'relative' }}>
        <Guide level={2}/>
        <div style={{ width:s.indent, flexShrink:0 }}/>
        <div style={{ display:'flex', alignItems:'center', flex:1, padding:'9px 14px 9px 0', gap:9 }}>
          <div style={{ width:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {loading && !pedidos
              ? <div className="spin" style={{ width:14, height:14, border:`2px solid ${s.border}`, borderTop:`2px solid ${s.accent}`, borderRadius:'50%' }}/>
              : <Chevron open={open} color={s.accent}/>}
          </div>
          <div style={{ width:30, height:30, borderRadius:8, background:s.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:15 }}>🏢</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:s.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cliente.nome}</div>
            <div style={{ display:'flex', gap:6, marginTop:3, flexWrap:'wrap', alignItems:'center' }}>
              <span className="mono" style={{ fontSize:10, color:'#6b7280' }}>{cliente.codigo}</span>
              <span style={{ fontSize:9, background:s.iconBg, color:s.accent, padding:'1px 7px', borderRadius:99, fontWeight:700 }}>{cliente.uf}</span>
              <span style={{ fontSize:9, color:s.sub, fontWeight:600 }}>{tipoLabel(cliente.tipo)}</span>
              {cliente.totalPedidos > 0 && <Bubble n={cliente.totalPedidos} label="pedido" color={s.accent}/>}
            </div>
          </div>
          <Metrics rec={cliente.REC} desc={cliente.DESC} com={cliente.COM} pmk={cliente.PMK} recColor={s.accent}/>
        </div>
      </div>
      <div className={`hv-kids ${open?'open':''}`}>
        {open && error  && <ErrorRow msg={error} onRetry={refetch} depth={3}/>}
        {open && loading && !pedidos && <SkeletonRows count={4} depth={3}/>}
        {open && pedidos && pedidos.map(p => <PedidoRow key={p.id} pedido={p}/>)}
        {open && pedidos && pedidos.length===0 && (
          <div style={{ padding:'10px 16px', fontSize:11, color:'#9ca3af', background:LS[3].rowBg }}>
            <div style={{ width:LS[3].indent, display:'inline-block' }}/>
            Nenhum pedido encontrado para este cliente no período.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NÍVEL 1 — REPRESENTANTE
// ─────────────────────────────────────────────────────────────
function RepRow({ rep, filters }) {
  const [open, setOpen] = useState(false);
  const s = LS[1];

  const { data:clientes, loading, error, refetch } = useHierLevel(
    open ? hierUrl(`/representantes/${rep.id}/clientes`, filters) : null,
    { ttl: 300_000 }
  );

  return (
    <div>
      <div className="hv-row" onClick={() => setOpen(v=>!v)}
        style={{ display:'flex', alignItems:'center', background:open?s.rowHover:s.rowBg, borderBottom:`1px solid ${s.border}`, borderLeft:`3px solid ${open?s.accent:'transparent'}`, transition:'all 0.13s', position:'relative' }}>
        <Guide level={1}/>
        <div style={{ width:s.indent, flexShrink:0 }}/>
        <div style={{ display:'flex', alignItems:'center', flex:1, padding:'10px 14px 10px 0', gap:10 }}>
          <div style={{ width:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {loading && !clientes
              ? <div className="spin" style={{ width:14, height:14, border:`2px solid ${s.border}`, borderTop:`2px solid ${s.accent}`, borderRadius:'50%' }}/>
              : <Chevron open={open} color={s.accent}/>}
          </div>
          <div style={{ width:32, height:32, borderRadius:9, background:s.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16 }}>🧑‍💼</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:s.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{rep.nome}</div>
            <div style={{ display:'flex', gap:6, marginTop:3, flexWrap:'wrap', alignItems:'center' }}>
              {rep.totalClientes > 0 && <Bubble n={rep.totalClientes} label="cliente"  color={s.accent}/>}
              {rep.totalPedidos  > 0 && <Bubble n={rep.totalPedidos}  label="pedido"   color={s.sub}/>}
              <span style={{ fontSize:10, color:s.sub }}>{fmtFull(rep.REC)}</span>
            </div>
          </div>
          <Metrics rec={rep.REC} desc={rep.DESC} com={rep.COM} pmk={rep.PMK} recColor={s.accent}/>
        </div>
      </div>
      <div className={`hv-kids ${open?'open':''}`}>
        {open && error   && <ErrorRow msg={error} onRetry={refetch} depth={2}/>}
        {open && loading && !clientes && <SkeletonRows count={4} depth={2}/>}
        {open && clientes && clientes.map(c => <ClienteRow key={c.id} cliente={c} filters={filters}/>)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NÍVEL 0 — CONSULTOR
// ─────────────────────────────────────────────────────────────
const STRIPES = ['#4f46e5','#0284c7','#7c3aed','#059669','#d97706'];

function ConsRow({ cons, idx, filters }) {
  const [open, setOpen] = useState(false);
  const s = LS[0]; const stripe = STRIPES[idx % STRIPES.length];

  const { data:reps, loading, error, refetch } = useHierLevel(
    open ? hierUrl(`/consultores/${cons.id}/representantes`, filters) : null,
    { ttl: 300_000 }
  );

  return (
    <div style={{ marginBottom:6, borderRadius:10, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', border:`1px solid ${s.border}` }}>
      <div className="hv-row" onClick={() => setOpen(v=>!v)}
        style={{ display:'flex', alignItems:'center', background:open?s.rowHover:s.rowBg, borderLeft:`5px solid ${stripe}`, transition:'all 0.13s' }}>
        <div style={{ display:'flex', alignItems:'center', flex:1, padding:'13px 16px', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:11, background:`${stripe}20`, border:`2px solid ${stripe}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>👤</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:800, color:s.text, letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cons.nome}</div>
            <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap', alignItems:'center' }}>
              {cons.totalReps     > 0 && <Bubble n={cons.totalReps}     label="representante" color={stripe}/>}
              {cons.totalClientes > 0 && <Bubble n={cons.totalClientes} label="cliente"        color={s.sub}/>}
              {cons.totalPedidos  > 0 && <Bubble n={cons.totalPedidos}  label="pedido"         color="#94a3b8"/>}
            </div>
          </div>
          <Metrics rec={cons.REC} desc={cons.DESC} com={cons.COM} pmk={cons.PMK} recColor={stripe}/>
          <div style={{ marginLeft:6 }}>
            {loading && !reps
              ? <div className="spin" style={{ width:16, height:16, border:`2px solid ${stripe}40`, borderTop:`2px solid ${stripe}`, borderRadius:'50%' }}/>
              : <Chevron open={open} color={stripe}/>}
          </div>
        </div>
      </div>
      <div className={`hv-kids ${open?'open':''}`} style={{ borderTop:open?`1px solid ${s.border}`:'none' }}>
        {open && error && <ErrorRow msg={error} onRetry={refetch} depth={1}/>}
        {open && loading && !reps && <SkeletonRows count={3} depth={1}/>}
        {open && reps && reps.map(r => <RepRow key={r.id} rep={r} filters={filters}/>)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUMMARY BAR
// ─────────────────────────────────────────────────────────────
function SummaryBar({ data, loading }) {
  const cards = [
    { label:'Receita Total',   value: loading ? '…' : fmtBRL(data?.REC),               icon:'💰', color:'#4f46e5', bg:'#eef2ff' },
    { label:'Consultores',     value: loading ? '…' : data?.totalConsultores    ?? 0,   icon:'👤', color:'#0284c7', bg:'#f0f9ff' },
    { label:'Representantes',  value: loading ? '…' : data?.totalRepresentantes ?? 0,   icon:'🧑‍💼', color:'#7c3aed', bg:'#faf5ff' },
    { label:'Clientes',        value: loading ? '…' : data?.totalClientes       ?? 0,   icon:'🏢', color:'#d97706', bg:'#fffbeb' },
    { label:'Pedidos',         value: loading ? '…' : data?.totalPedidos        ?? 0,   icon:'📄', color:'#16a34a', bg:'#f0fdf4' },
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
function TabView({ rows = [], loading = false, error = null, onRetry }) {
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
function ChipGroup({ label, options, value, onChange, formatOption }) {
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
function CacheBadge() {
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
const PERIODOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function ConsultorView() {
  const { state } = useDashboard();
  const globalFilters = state?.filters || {};
  // Filtros locais desta aba (independentes do DashboardContext)
  const [periodo, setPeriodo] = useState('');
  const [tipo,    setTipo]    = useState('');
  const [uf,      setUf]      = useState('');
  const [view,    setView]    = useState('hierarchy');
  const [fKey,    setFKey]    = useState(0);
  const [refreshingAll, setRefreshingAll] = useState(false);

  const { data:filterOptions, refetch:refetchFilterOptions } = useApiData('filters/options', '', { ttl: 600_000 });
  const tipoOptions = useMemo(() => (filterOptions?.tipos || []).map(o => String(o?.value ?? '').trim()).filter(v => v.length > 0), [filterOptions]);
  const ufOptions = useMemo(() => (filterOptions?.ufs || []).map(o => String(o?.value ?? '').trim()).filter(v => v.length > 0), [filterOptions]);

  // Converte filtros para params da API
  const filters = useMemo(() => {
    const f = {};

    // Base: filtros globais do dashboard
    const keys = ['dataInicio', 'dataFim', 'vendedor', 'cliente', 'material', 'tipo', 'controle', 'uneg', 'uf'];
    for (const k of keys) {
      const val = globalFilters?.[k];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        f[k] = val;
      }
    }

    // Locais sobrepoem globais
    if (tipo) f.tipo = tipo;
    if (uf)   f.uf   = uf;

    // Fallback de datas
    if (!f.dataInicio || !f.dataFim) {
      const hoje = new Date().toISOString().split('T')[0];
      const ano  = `${new Date().getFullYear()}-01-01`;
      f.dataInicio = f.dataInicio || ano;
      f.dataFim    = f.dataFim    || hoje;
    }

    // Periodo -> mes especifico
    if (periodo) {
      const mIdx = PERIODOS.indexOf(periodo) + 1;
      if (mIdx > 0) {
        const y = Number(String(f.dataInicio).slice(0, 4)) || new Date().getFullYear();
        const m = String(mIdx).padStart(2,'0');
        f.dataInicio = `${y}-${m}-01`;
        f.dataFim    = `${y}-${m}-${new Date(y, mIdx, 0).getDate()}`;
      }
    }
    return f;
  }, [periodo, tipo, uf, globalFilters]);


  // Resumo geral (KPI cards)
  const { data:resumo, loading:resumoLoading, refetch:refetchResumo } = useHierLevel(
    hierUrl('/resumo', filters),
    { ttl: 300_000 }
  );

  // Consultores
  const { data:consultores, loading:consLoading, error:consError, refetch:refetchCons } = useHierLevel(
    hierUrl('/consultores', filters),
    { ttl: 300_000 }
  );

  // Quando filtros mudam, limpa o cache local e força re-render
  useEffect(() => {
    clearHierCache();
    setFKey(k => k+1);
  }, [periodo, tipo, uf, JSON.stringify(globalFilters)]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = !!(periodo || tipo || uf || globalFilters?.tipo || globalFilters?.uf);

  async function refreshAllData() {
    try {
      setRefreshingAll(true);
      const token = localStorage.getItem('dashboard_token');
      const res = await fetch('/api/cache/prewarm', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      clearHierCache();
      clearApiCache('/api');
      setFKey(k => k + 1);
      await Promise.all([refetchResumo(), refetchCons(), refetchFilterOptions()]);
    } catch (e) {
      alert(`Erro ao atualizar dados: ${e.message}`);
    } finally {
      setRefreshingAll(false);
    }
  }

  async function doExport() {
    // Exporta via endpoint dedicado do backend
    try {
      const qs = new URLSearchParams(filters).toString();
      const token = localStorage.getItem('dashboard_token');
      const res = await fetch(`/api/sales/export${qs?'?'+qs:''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(Array.isArray(rows) ? rows : []);
      ws['!cols'] = Object.keys(rows[0]||{}).map(k => ({ wch:Math.max(k.length+2,12) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Dados');
      XLSX.writeFile(wb, `hierarquia-${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch(e) { alert('Erro ao exportar: '+e.message); }
  }

  return (
    <div className="hv" style={{ minHeight:'100vh', background:'#f8fafc' }}>
      <style>{CSS}</style>

      {/* TOPBAR */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', position:'sticky', top:56, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>

        {/* Row 1 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', gap:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34,height:34,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(79,70,229,0.3)',flexShrink:0,fontSize:17 }}>👤</div>
            <div>
              <div style={{ fontSize:14,fontWeight:800,color:'#1e1b4b',letterSpacing:'-0.01em' }}>Visão por Consultor</div>
              <div style={{ fontSize:10, color:'#64748b', marginTop:1 }}>
                {consLoading
                  ? 'Carregando dados do Oracle…'
                  : <><b style={{color:'#4f46e5'}}>{consultores?.length||0}</b> consultor{consultores?.length!==1?'es':''} · <b style={{color:'#0284c7'}}>{resumo?.totalRepresentantes||0}</b> representantes · <b style={{color:'#7c3aed'}}>{resumo?.totalClientes||0}</b> clientes</>
                }
                {hasFilters && <span style={{color:'#d97706',fontWeight:700,marginLeft:5}}>· filtros ativos</span>}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <CacheBadge/>

            {/* View toggle */}
            <div style={{ display:'flex',background:'#f1f5f9',borderRadius:8,padding:2,gap:1 }}>
              {[{id:'hierarchy',l:'Hierárquico',ic:'🌳'},{id:'tabular',l:'Tabular',ic:'📋'}].map(m=>(
                <button key={m.id} className={`vtab ${view===m.id?'on':''}`} onClick={()=>setView(m.id)} style={{ fontSize:10,padding:'5px 10px',borderRadius:6,border:'none',cursor:'pointer',fontWeight:600,background:view===m.id?'#1e293b':'transparent',color:view===m.id?'#f8fafc':'#6b7280',display:'flex',alignItems:'center',gap:4 }}>
                  <span>{m.ic}</span><span>{m.l}</span>
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button onClick={refreshAllData} disabled={refreshingAll}
              style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:'1px solid #e2e8f0',background:refreshingAll?'#f8fafc':'#fff',fontSize:11,fontWeight:600,color:'#374151',cursor:refreshingAll?'not-allowed':'pointer',opacity:refreshingAll?0.75:1 }}
              onMouseOver={e=>e.currentTarget.style.background='#f1f5f9'} onMouseOut={e=>e.currentTarget.style.background='#fff'}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {refreshingAll ? 'Atualizando...' : 'Atualizar'}
            </button>

            {/* Export */}
            <button onClick={doExport} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,background:'#16a34a',color:'#fff',border:'none',fontSize:11,fontWeight:600,cursor:'pointer' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 15V3m0 12-4-4m4 4 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Row 2: Filters */}
        <div style={{ padding:'8px 16px 11px', borderTop:'1px solid #f1f5f9', display:'flex', gap:18, flexWrap:'wrap', alignItems:'flex-end' }}>
          <ChipGroup label="Período"      options={PERIODOS} value={periodo} onChange={setPeriodo}/>
          <ChipGroup label="Tipo Cliente" options={tipoOptions} value={tipo} onChange={setTipo} formatOption={(o) => tipoLabel(o)}/>
          <ChipGroup label="UF" options={ufOptions} value={uf} onChange={setUf}/>
          {hasFilters && (
            <button onClick={()=>{ setPeriodo('');setTipo('');setUf(''); }}
              style={{ fontSize:10,padding:'4px 10px',borderRadius:99,border:'1px solid #fca5a5',background:'#fff',color:'#dc2626',fontWeight:600,cursor:'pointer',alignSelf:'flex-end',display:'flex',alignItems:'center',gap:4 }}>
              × Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding:'14px 16px' }}>

        {/* Summary */}
        <SummaryBar data={resumo} loading={resumoLoading}/>

        {/* Column headers */}
        {view==='hierarchy' && (
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',background:'#f1f5f9',borderRadius:7,padding:'6px 18px 6px 14px',marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {[{c:LS[0].accent,ic:'👤',l:'Consultor'},{c:LS[1].accent,ic:'🧑‍💼',l:'Representante'},{c:LS[2].accent,ic:'🏢',l:'Cliente'},{c:LS[3].accent,ic:'📄',l:'Pedido'},{c:LS[4].accent,ic:'📦',l:'Item'}]
                .map((it,i,arr)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:4 }}>
                    <div style={{ width:7,height:7,borderRadius:2,background:it.c }}/>
                    <span style={{ fontSize:10,color:'#6b7280',fontWeight:500 }}>{it.ic} {it.l}</span>
                    {i<arr.length-1 && <span style={{ color:'#d1d5db',fontSize:10,marginLeft:2 }}>›</span>}
                  </div>
                ))}
            </div>
            <div style={{ display:'flex',gap:12,flexShrink:0 }}>
              {['Receita','Desconto','Comissão','PMK'].map(l=>(
                <span key={l} style={{ fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',minWidth:66,textAlign:'right' }}>{l}</span>
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {consError && (
          <div style={{ display:'flex',alignItems:'center',gap:10,padding:'16px',background:'#fef2f2',borderRadius:10,marginBottom:12,border:'1px solid #fecaca' }}>
            <span style={{ fontSize:18 }}>⚠️</span>
            <div style={{ flex:1 }}>
              <p style={{ margin:0,fontWeight:600,color:'#dc2626',fontSize:13 }}>Erro ao buscar dados do Oracle</p>
              <p style={{ margin:'2px 0 0',fontSize:11,color:'#9ca3af' }}>{consError}</p>
            </div>
            <button onClick={refetchCons} style={{ padding:'6px 14px',borderRadius:8,border:'1px solid #fca5a5',background:'#fff',color:'#dc2626',fontSize:11,fontWeight:600,cursor:'pointer' }}>
              Tentar novamente
            </button>
          </div>
        )}

        {/* Loading inicial */}
        {consLoading && !consultores && (
          <div style={{ display:'flex',flexDirection:'column',gap:6 }} key="skeleton">
            {[0,1,2].map(i => (
              <div key={i} style={{ borderRadius:10,overflow:'hidden',border:'1px solid #c7d2fe' }}>
                <div style={{ display:'flex',alignItems:'center',gap:12,padding:'13px 16px',background:'#eef2ff',borderLeft:`5px solid ${STRIPES[i]}` }}>
                  <div style={{ width:40,height:40,borderRadius:11,background:`${STRIPES[i]}22`,flexShrink:0 }}/>
                  <div style={{ flex:1,display:'flex',flexDirection:'column',gap:6 }}>
                    <div style={{ height:13,width:'30%',background:`${STRIPES[i]}30`,borderRadius:4 }}/>
                    <div style={{ height:10,width:'20%',background:`${STRIPES[i]}18`,borderRadius:4 }}/>
                  </div>
                  {[1,2,3,4].map(j=>(<div key={j} style={{ width:66,height:30,background:`${STRIPES[i]}18`,borderRadius:4 }}/>))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hierarchy */}
        {view==='hierarchy' && consultores && !consLoading && (
          <div key={fKey} style={{ display:'flex',flexDirection:'column',gap:0 }}>
            {consultores.length === 0 ? (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 24px',gap:14,color:'#9ca3af' }}>
                <div style={{ width:52,height:52,background:'#f1f5f9',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>🔍</div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontWeight:600,color:'#374151',margin:0,fontSize:13 }}>Nenhum consultor encontrado</p>
                  <p style={{ fontSize:11,margin:'4px 0 0',color:'#9ca3af' }}>Tente ajustar os filtros acima</p>
                </div>
              </div>
            ) : (
              consultores.map((c,i) => <ConsRow key={c.id} cons={c} idx={i} filters={filters}/>)
            )}
          </div>
        )}

        {/* Tabular */}
        {view==='tabular' && (
          <div style={{ background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <TabView rows={consultores || []} loading={consLoading} error={consError} onRetry={refetchCons} />
          </div>
        )}

        {/* Footer */}
        <div style={{ display:'flex',gap:16,marginTop:14,flexWrap:'wrap',alignItems:'center' }}>
          <span style={{ fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em' }}>Legenda Desconto:</span>
          {[['#16a34a','≤ 12% Saudável'],['#d97706','12–20% Atenção'],['#dc2626','> 20% Crítico']].map(([c,l])=>(
            <span key={l} style={{ fontSize:10,color:c,fontWeight:600,display:'flex',alignItems:'center',gap:4 }}>
              <span style={{ width:7,height:7,borderRadius:2,background:c,display:'inline-block' }}/>{l}
            </span>
          ))}
          <span style={{ fontSize:9,color:'#94a3b8',marginLeft:'auto' }}>
            ⚡ Dados carregados sob demanda · Cache ativo
          </span>
        </div>
      </div>
    </div>
  );
}
