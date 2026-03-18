// ============================================================
// pages/Dashboard.jsx — VERSÃO FINAL COMPLETA
// ============================================================
'use client';
import { Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Settings, RefreshCw, LayoutDashboard } from 'lucide-react';

import { useDashboard } from '../context/DashboardContext';
import { useKpis, useEvolucao, useRanking, useApiData } from '../hooks/useApiData';
import { FilterBar }      from './filters/FilterBar';
import { WidgetSelector } from './layout/WidgetSelector';
import { WidgetWrapper }  from './layout/WidgetWrapper';
import { ExportButton }   from './ui/ExportButton';
import { StatusBadge }    from './ui/StatusBadge';
import ErrorBoundary      from './ui/ErrorBoundary';

// ── Widgets (sem SSR) ────────────────────────────────────────
const KpiCard       = dynamic(() => import('./widgets/KpiCard'),       { ssr: false });
const EvolucaoChart = dynamic(() => import('./widgets/EvolucaoChart'), { ssr: false });
const RankingChart  = dynamic(() => import('./widgets/RankingChart'),  { ssr: false });
const StatusChart   = dynamic(() => import('./widgets/StatusChart'),   { ssr: false });
const CurvaAbcChart = dynamic(() => import('./widgets/CurvaAbcChart'), { ssr: false });

// ── Grid sem SSR ─────────────────────────────────────────────
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
const COLS        = { lg: 12,   md: 10,  sm: 6,   xs: 4   };

function Skeleton() {
  return <div className="h-full bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl animate-pulse" />;
}

export default function Dashboard() {
  const { state, dispatch, filterParams } = useDashboard();
  const { widgets, editMode } = state;

  const params = filterParams();
  const activeWidgets = widgets.filter(w => w.active);

  const { data: kpis,       loading: kpisL  } = useKpis(params);
  const { data: evolucao,   loading: evoL   } = useEvolucao(params);
  const { data: vendedores, loading: vendL  } = useRanking('vendedores', params);
  const { data: clientes,   loading: cliL   } = useRanking('clientes', params);
  const { data: produtos,   loading: prodL  } = useRanking('produtos', params);
  const { data: status,     loading: statL  } = useApiData('sales/status', params);
  const { data: qualidade,  loading: qualL  } = useApiData('sales/qualidade', params);
  const { data: abc,        loading: abcL   } = useApiData('sales/curva-abc', params);

  const layout = activeWidgets.map(w => ({
    i: w.id, x: w.x, y: w.y, w: w.w, h: w.h,
    minW: w.type === 'KPI' ? 2 : 3,
    minH: w.type === 'KPI' ? 2 : 3,
  }));

  const handleLayoutChange = useCallback((newLayout) => {
    if (editMode) dispatch({ type: 'UPDATE_LAYOUT', layout: newLayout });
  }, [dispatch, editMode]);

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
        if (id === 'chart-clientes')   return wrap(<RankingChart data={clientes}   loading={cliL}  labelKey="CLIENTE" />);
        if (id === 'chart-produtos')   return wrap(<RankingChart data={produtos}   loading={prodL} labelKey="MATERIAL" />);
        return null;
      case 'CHART_PIE':
        if (id === 'chart-status')    return wrap(<StatusChart data={status}    loading={statL} labelKey="STATUS" />);
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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Topbar ───────────────────────────────────────── */}
      <header
        className="bg-white border-b border-gray-100 px-5 sticky top-0 z-40"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Dashboard de Vendas</h1>
              <p className="text-[11px] text-gray-400">
                {kpiCount} indicadores · {chartCount} gráficos
              </p>
            </div>
          </div>

          {/* Ações da direita */}
          <div className="flex items-center gap-2">
            <StatusBadge />
            <ExportButton />
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_EDIT_MODE', value: !editMode })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                editMode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              {editMode ? 'Concluir' : 'Personalizar'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Filtros ──────────────────────────────────────── */}
      <FilterBar />

      {/* ── Seletor de widgets (edição) ───────────────────── */}
      {editMode && <WidgetSelector widgets={widgets} dispatch={dispatch} />}

      {/* ── Grid principal ───────────────────────────────── */}
      <main className="px-4 pb-8 pt-2">
        <GridLayout
          className="layout"
          layouts={{ lg: layout, md: layout }}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={85}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle"
          margin={[10, 10]}
          containerPadding={[0, 0]}
        >
          {activeWidgets.map(renderWidget).filter(Boolean)}
        </GridLayout>
      </main>

      {/* ── CSS de impressão (print/PDF) ─────────────────── */}
      <style jsx global>{`
        @media print {
          header, .filter-bar, button { display: none !important; }
          .react-grid-item { break-inside: avoid; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
