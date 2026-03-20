// ============================================================
// ConsultorView.jsx — Hierarquia REAL com Oracle
// Lazy loading verdadeiro: cada nível só busca ao expandir
// ============================================================
'use client';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useHierLevel, hierUrl, clearHierCache } from '../hooks/useHierarquia';
import { useApiData, clearApiCache } from '../hooks/useApiData';
import { useDashboard } from '../context/DashboardContext';
import { LS, STRIPES, PERIODOS } from './consultorView.constants';
import { tipoLabel } from './consultorView.formatters';
import { CONSULTOR_VIEW_CSS } from './consultorView.styles';
import { ConsRow } from './consultorView.tree';
import { SummaryBar, TabView, ChipGroup, CacheBadge } from './consultorView.widgets';

export default function ConsultorView() {
  const { state } = useDashboard();
  const globalFilters = state?.filters || {};
  // Filtros locais desta aba (independentes do DashboardContext)
  const [periodo, setPeriodo] = useState('');
  const [tipo,    setTipo]    = useState('');
  const [uf,      setUf]      = useState('');
  const [ano,     setAno]     = useState(String(new Date().getFullYear()));
  const [view,    setView]    = useState('hierarchy');
  const [fKey,    setFKey]    = useState(0);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const currentYear = String(new Date().getFullYear());

  const { data:filterOptions, refetch:refetchFilterOptions } = useApiData('filters/options', '', { ttl: 600_000 });
  const tipoOptions = useMemo(() => (filterOptions?.tipos || []).map(o => String(o?.value ?? '').trim()).filter(v => v.length > 0), [filterOptions]);
  const ufOptions = useMemo(() => (filterOptions?.ufs || []).map(o => String(o?.value ?? '').trim()).filter(v => v.length > 0), [filterOptions]);
  const anoOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 3, y - 2, y - 1, y, y + 1].map(String);
  }, []);

  useEffect(() => {
    const globalYear = String(globalFilters?.dataInicio || '').slice(0, 4);
    if (/^\d{4}$/.test(globalYear)) {
      setAno(globalYear);
    }
  }, [globalFilters?.dataInicio]);

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

    // Periodo -> mes especifico (com ano explicito)
    if (periodo) {
      const mIdx = PERIODOS.indexOf(periodo) + 1;
      if (mIdx > 0) {
        const y = Number(ano) || Number(String(f.dataInicio).slice(0, 4)) || new Date().getFullYear();
        const m = String(mIdx).padStart(2,'0');
        f.dataInicio = `${y}-${m}-01`;
        f.dataFim    = `${y}-${m}-${new Date(y, mIdx, 0).getDate()}`;
      }
    }
    return f;
  }, [periodo, ano, tipo, uf, globalFilters]);


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
  }, [periodo, ano, tipo, uf, JSON.stringify(globalFilters)]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = !!(periodo || tipo || uf || ano !== currentYear || globalFilters?.tipo || globalFilters?.uf);

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
      <style>{CONSULTOR_VIEW_CSS}</style>

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
                {periodo && <span style={{ color:'#475569', marginLeft:5 }}>· período: {periodo}/{ano}</span>}
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
          <ChipGroup label="Período (mês)" options={PERIODOS} value={periodo} onChange={setPeriodo}/>
          <ChipGroup label="Ano" options={anoOptions} value={ano} onChange={(v) => setAno(v || currentYear)}/>
          <ChipGroup label="Tipo Cliente" options={tipoOptions} value={tipo} onChange={setTipo} formatOption={(o) => tipoLabel(o)}/>
          <ChipGroup label="UF" options={ufOptions} value={uf} onChange={setUf}/>
          {hasFilters && (
            <button onClick={()=>{ setPeriodo('');setAno(currentYear);setTipo('');setUf(''); }}
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
              {[{c:LS[0].accent,ic:'👤',l:'Consultor'},{c:LS[1].accent,ic:'🧑‍💼',l:'Representante'},{c:LS[2].accent,ic:'🏢',l:'Cliente'},{c:LS[3].accent,ic:'🛢️',l:'Pedido'},{c:LS[4].accent,ic:'🚰',l:'Item'}]
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

