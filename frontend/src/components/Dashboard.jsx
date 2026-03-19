// ============================================================
// components/Dashboard.jsx — COM ABAS DE NAVEGAÇÃO
// Adicionado: tab switcher (Dashboard | Consultores)
// Mantido: todo o código original do dashboard executivo
// ============================================================
'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Settings, RefreshCw, LayoutDashboard, TrendingUp,
  ChevronRight, LayoutGrid, Users,
} from 'lucide-react';

import { useDashboard }                                  from '../context/DashboardContext';
import { useKpis, useEvolucao, useRanking, useApiData }  from '../hooks/useApiData';
import { FilterBar }      from './filters/FilterBar';
import { WidgetSelector } from './layout/WidgetSelector';
import { WidgetWrapper }  from './layout/WidgetWrapper';
import { ExportButton }   from './ui/ExportButton';
import { StatusBadge }    from './ui/StatusBadge';
import ErrorBoundary      from './ui/ErrorBoundary';
import { UserMenu }       from './auth/UserMenu';
import ConsultorView      from './ConsultorView';   // ← NOVO

// ── Widgets (sem SSR) ─────────────────────────────────────────
const KpiCard       = dynamic(() => import('./widgets/KpiCard'),       { ssr: false });
const EvolucaoChart = dynamic(() => import('./widgets/EvolucaoChart'), { ssr: false });
const RankingChart  = dynamic(() => import('./widgets/RankingChart'),  { ssr: false });
const StatusChart   = dynamic(() => import('./widgets/StatusChart'),   { ssr: false });
const CurvaAbcChart = dynamic(() => import('./widgets/CurvaAbcChart'), { ssr: false });

const GridLayout = dynamic(
  async () => {
    const mod = await import('react-grid-layout');
    const rgl = mod.default || mod;
    const { Responsive, WidthProvider } = rgl;
    return WidthProvider(Responsive);
  },
  { ssr: false }
);

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480 };
const COLS        = { lg: 12, md: 10, sm: 6, xs: 4 };

function buildAutoLayout(widgets, cols = 12) {
  const ordered = [...widgets]
    .filter((w) => w.active)
    .sort((a, b) => {
      const pa = a.type === 'KPI' ? 0 : 1;
      const pb = b.type === 'KPI' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return String(a.id).localeCompare(String(b.id));
    });

  const layout = [];
  let x = 0;
  let y = 0;
  let rowH = 0;

  for (const w of ordered) {
    const width = Math.max(1, Math.min(Number(w.w) || 3, cols));
    const height = Math.max(1, Number(w.h) || (w.type === 'KPI' ? 2 : 4));

    if (x + width > cols) {
      x = 0;
      y += rowH;
      rowH = 0;
    }

    layout.push({ i: w.id, x, y, w: width, h: height });
    x += width;
    rowH = Math.max(rowH, height);
  }

  return layout;
}

function Skeleton() {
  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl animate-pulse" />
  );
}

function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  return (
    <div className="text-right hidden md:block">
      <div className="text-xs font-bold text-gray-700 tabular-nums">{time}</div>
      <div className="text-[10px] text-gray-400 capitalize">{today}</div>
    </div>
  );
}

function useWidgetData(activeWidgets, params) {
  const has = (id) => activeWidgets.some(w => w.id === id);

  const { data: kpis,       loading: kpisL  } = useKpis(params);
  const { data: evolucao,   loading: evoL   } = useEvolucao(params);
  const { data: vendedores, loading: vendL  } = useRanking('vendedores', params);
  const { data: clientes,   loading: cliL   } = useRanking('clientes',   params);
  const { data: produtos,   loading: prodL  } = useApiData(
    'sales/ranking/produtos', params ? `${params}&limit=15` : 'limit=15',
    { enabled: has('chart-produtos') }
  );
  const { data: status,     loading: statL  } = useApiData('sales/status',   params);
  const { data: qualidade,  loading: qualL  } = useApiData('sales/qualidade', params,
    { enabled: has('chart-qualidade') }
  );
  const { data: abc,        loading: abcL   } = useApiData('sales/curva-abc', params,
    { enabled: has('chart-abc') }
  );

  return {
    kpis, kpisL, evolucao, evoL,
    vendedores, vendL, clientes, cliL, produtos, prodL,
    status, statL, qualidade, qualL, abc, abcL,
  };
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { state, dispatch, filterParams, activeFilterCount } = useDashboard();
  const { widgets, editMode } = state;
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // ── NOVO: controle de aba ───────────────────────────────────
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'consultores'

  const params        = filterParams();
  const activeWidgets = widgets.filter(w => w.active);

  const {
    kpis, kpisL, evolucao, evoL,
    vendedores, vendL, clientes, cliL, produtos, prodL,
    status, statL, qualidade, qualL, abc, abcL,
  } = useWidgetData(activeWidgets, params);

  const layout = activeWidgets.map(w => ({
    i: w.id, x: w.x, y: w.y, w: w.w, h: w.h,
    minW: w.type === 'KPI' ? 2 : 3,
    minH: w.type === 'KPI' ? 2 : 3,
  }));

  const handleLayoutChange = useCallback((newLayout) => {
    if (editMode) dispatch({ type: 'UPDATE_LAYOUT', layout: newLayout });
  }, [dispatch, editMode]);

  const handleAutoArrange = useCallback(() => {
    const autoLayout = buildAutoLayout(widgets, COLS.lg);
    if (autoLayout.length) {
      dispatch({ type: 'UPDATE_LAYOUT', layout: autoLayout });
    }
  }, [dispatch, widgets]);

  function handleRefresh() {
    import('../hooks/useApiData').then(m => m.clearApiCache());
    setLastRefresh(Date.now());
    window.location.reload();
  }

  function renderWidget(widget) {
    const { id, type, title } = widget;

    const wrap = (content) => (
      <div key={id}>
        <ErrorBoundary>
          <WidgetWrapper title={title} editMode={editMode} widgetId={id}>
            <Suspense fallback={<Skeleton />}>
              {content}
            </Suspense>
          </WidgetWrapper>
        </ErrorBoundary>
      </div>
    );

    switch (type) {
      case 'KPI':
        return wrap(<KpiCard widgetId={id} data={kpis} loading={kpisL} />);

      case 'CHART_LINE':
        return wrap(<EvolucaoChart data={evolucao} loading={evoL} />);

      case 'CHART_BAR':
        if (id === 'chart-vendedores') return wrap(<RankingChart data={vendedores} loading={vendL} labelKey="VENDEDOR" />);
        if (id === 'chart-clientes')   return wrap(<RankingChart data={clientes}   loading={cliL}  labelKey="CLIENTE"  />);
        if (id === 'chart-produtos')   return wrap(<RankingChart data={produtos}   loading={prodL} labelKey="MATERIAL" />);
        return null;

      case 'CHART_PIE':
        if (id === 'chart-status')    return wrap(<StatusChart data={status}    loading={statL} labelKey="STATUS"    />);
        if (id === 'chart-qualidade') return wrap(<StatusChart data={qualidade} loading={qualL} labelKey="QUALIDADE" />);
        return null;

      case 'CHART_ABC':
        return wrap(<CurvaAbcChart data={abc} loading={abcL} />);

      default:
        return null;
    }
  }

  const kpiCount   = activeWidgets.filter(w => w.type === 'KPI').length;
  const chartCount = activeWidgets.filter(w => w.type !== 'KPI').length;

  const receitaFmt = kpis?.RECEITA_LIQUIDA
    ? new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL',
        notation: 'compact', maximumFractionDigits: 1,
      }).format(kpis.RECEITA_LIQUIDA)
    : null;

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HEADER PRINCIPAL ─────────────────────────────────── */}
      <header
        className="bg-white border-b border-gray-100 px-4 sticky top-0 z-40"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-between h-14 gap-2">

          {/* Logo + título */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-md">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black text-gray-900 leading-tight tracking-tight">
                Dashboard de Vendas
              </h1>
              {activeTab === 'dashboard' && (
                <p className="text-[10px] text-gray-400 leading-tight">
                  {kpiCount} indicadores · {chartCount} análises
                  {activeFilterCount > 0 && (
                    <span className="ml-1.5 text-blue-600 font-semibold">
                      · {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* ── ABAS DE NAVEGAÇÃO (NOVO) ── */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 flex-shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden xs:block">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('consultores')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                activeTab === 'consultores'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden xs:block">Consultores</span>
            </button>
          </div>

          {/* Receita rápida — só no tab Dashboard */}
          {activeTab === 'dashboard' && receitaFmt && !kpisL && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-700 font-medium">Receita:</span>
              <span className="text-sm font-black text-emerald-800">{receitaFmt}</span>
            </div>
          )}

          {/* Ações — só no tab Dashboard */}
          <div className="flex items-center gap-1.5 ml-auto">
            {activeTab === 'dashboard' && (
              <>
                <LiveClock />
                <StatusBadge />
                <ExportButton />
                <button
                  onClick={handleRefresh}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Atualizar dados"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleAutoArrange}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:block">Organizar</span>
                </button>
                <button
                  onClick={() => dispatch({ type: 'SET_EDIT_MODE', value: !editMode })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    editMode
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Settings className={`w-3.5 h-3.5 ${editMode ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                  <span className="hidden sm:block">{editMode ? 'Concluir' : 'Personalizar'}</span>
                </button>
              </>
            )}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* ── CONTEÚDO CONDICIONAL POR ABA ─────────────────────── */}

      {/* ABA: CONSULTORES */}
      {activeTab === 'consultores' && <ConsultorView />}

      {/* ABA: DASHBOARD (original) */}
      {activeTab === 'dashboard' && (
        <>
          {/* Filtros */}
          <FilterBar />

          {/* Seletor de widgets */}
          {editMode && <WidgetSelector widgets={widgets} dispatch={dispatch} />}

          {/* Grid principal */}
          <main className="px-4 pb-8 pt-3">
            {activeWidgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
                <LayoutDashboard className="w-12 h-12 opacity-30" />
                <p className="text-sm font-medium">Nenhum widget ativo</p>
                <button
                  onClick={() => dispatch({ type: 'SET_EDIT_MODE', value: true })}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Personalizar dashboard <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <GridLayout
                className="layout"
                layouts={{ lg: layout, md: layout }}
                breakpoints={BREAKPOINTS}
                cols={COLS}
                rowHeight={82}
                isDraggable={editMode}
                isResizable={editMode}
                onLayoutChange={handleLayoutChange}
                draggableHandle=".drag-handle"
                margin={[10, 10]}
                containerPadding={[0, 0]}
              >
                {activeWidgets.map(renderWidget).filter(Boolean)}
              </GridLayout>
            )}
          </main>
        </>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @media print {
          header, .filter-bar, button { display: none !important; }
          .react-grid-item { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
