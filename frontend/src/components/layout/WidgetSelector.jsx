// ============================================================
// components/layout/WidgetSelector.jsx
// Painel lateral para ativar/desativar widgets (modo edição)
// ============================================================
import { BarChart2, TrendingUp, PieChart, Hash, CheckCircle2, Circle } from 'lucide-react';

const WIDGET_ICONS = {
  KPI:        Hash,
  CHART_LINE: TrendingUp,
  CHART_BAR:  BarChart2,
  CHART_PIE:  PieChart,
  CHART_ABC:  BarChart2,
};

const GROUP_LABELS = {
  KPI:        'Indicadores (KPIs)',
  CHART_LINE: 'Gráficos de Linha',
  CHART_BAR:  'Gráficos de Barras',
  CHART_PIE:  'Gráficos de Pizza',
  CHART_ABC:  'Análises',
};

export function WidgetSelector({ widgets, dispatch }) {
  // Agrupar por tipo
  const groups = widgets.reduce((acc, w) => {
    const g = w.type;
    if (!acc[g]) acc[g] = [];
    acc[g].push(w);
    return acc;
  }, {});

  return (
    <div className="mx-4 mb-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <p className="text-xs font-semibold text-blue-700">
          Modo edição ativo — clique nos widgets para ativar/desativar, arraste para reorganizar
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {Object.entries(groups).map(([type, items]) => {
          const Icon = WIDGET_ICONS[type] || BarChart2;
          return (
            <div key={type}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-1">
                {GROUP_LABELS[type] || type}
              </p>
              {items.map(w => (
                <button
                  key={w.id}
                  onClick={() => dispatch({ type: 'TOGGLE_WIDGET', id: w.id })}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all mb-1 ${
                    w.active
                      ? 'bg-white border border-blue-300 text-blue-700 shadow-sm'
                      : 'bg-white/60 border border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {w.active
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    : <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  }
                  <Icon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate text-left">{w.title}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WidgetSelector;
