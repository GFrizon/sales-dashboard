'use client';
import { useState } from 'react';
import { useHierLevel, hierUrl } from '../hooks/useHierarquia';
import { LS, STRIPES } from './consultorView.constants';
import { fmtBRL, fmtFull, fmtPct, fmtPMK, tipoLabel } from './consultorView.formatters';

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

function TankIcon({ color = '#16a34a' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="13" rx="2.5" stroke={color} strokeWidth="1.8" />
      <path d="M6 14c1.2-.9 2.5-.9 3.7 0 1.2.9 2.5.9 3.7 0 1.2-.9 2.5-.9 3.7 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 5v-2h6v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
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
        <div style={{ width:27, height:27, borderRadius:7, background:s.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <TankIcon color={s.accent} />
        </div>
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
          <div style={{ width:28, height:28, borderRadius:7, background:s.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:14 }}>🛢️</div>
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

export function ConsRow({ cons, idx, filters }) {
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
