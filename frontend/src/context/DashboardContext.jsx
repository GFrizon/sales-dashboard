"use client";

// ============================================================
// context/DashboardContext.jsx
// Estado global do dashboard: filtros, layout, widgets ativos
// ============================================================
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// ── Estado inicial ───────────────────────────────────────
const DEFAULT_FILTERS = {
  dataInicio: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // 1 jan do ano atual
  dataFim:    new Date().toISOString().split('T')[0],
  vendedor:   '',
  cliente:    '',
  uf:         '',
  material:   '',
  tipo:       '',
  controle:   '',
  uneg:       '',
};

const DEFAULT_WIDGETS = [
  { id: 'kpi-receita',       type: 'KPI',          title: 'Receita Líquida',        active: true,  x: 0, y: 0, w: 3, h: 2 },
  { id: 'kpi-faturamento',   type: 'KPI',          title: 'Faturamento Bruto',      active: true,  x: 3, y: 0, w: 3, h: 2 },
  { id: 'kpi-ticket',        type: 'KPI',          title: 'Ticket Médio',           active: true,  x: 6, y: 0, w: 3, h: 2 },
  { id: 'kpi-clientes',      type: 'KPI',          title: 'Clientes Únicos',        active: true,  x: 9, y: 0, w: 3, h: 2 },
  { id: 'kpi-desconto',      type: 'KPI',          title: '% Desconto Médio',       active: true,  x: 0, y: 2, w: 3, h: 2 },
  { id: 'kpi-bloqueado',     type: 'KPI',          title: 'Valor Bloqueado',        active: true,  x: 3, y: 2, w: 3, h: 2 },
  { id: 'chart-evolucao',    type: 'CHART_LINE',   title: 'Evolução de Vendas',     active: true,  x: 0, y: 4, w: 8, h: 4 },
  { id: 'chart-status',      type: 'CHART_PIE',    title: 'Receita por Status',     active: true,  x: 8, y: 4, w: 4, h: 4 },
  { id: 'chart-vendedores',  type: 'CHART_BAR',    title: 'Ranking Vendedores',     active: true,  x: 0, y: 8, w: 6, h: 4 },
  { id: 'chart-clientes',    type: 'CHART_BAR',    title: 'Ranking Clientes',       active: true,  x: 6, y: 8, w: 6, h: 4 },
  { id: 'chart-qualidade',   type: 'CHART_PIE',    title: 'Qualidade de Vendas',    active: false, x: 0, y: 12, w: 4, h: 4 },
  { id: 'chart-produtos',    type: 'CHART_BAR',    title: 'Ranking Produtos',       active: false, x: 4, y: 12, w: 8, h: 4 },
  { id: 'chart-abc',         type: 'CHART_ABC',    title: 'Curva ABC',              active: false, x: 0, y: 16, w: 12, h: 5 },
];

// ── Reducer ──────────────────────────────────────────────
const initialState = {
  filters:       DEFAULT_FILTERS,
  widgets:       DEFAULT_WIDGETS,
  editMode:      false,
  filterOptions: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, [action.key]: action.value } };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'RESET_FILTERS':
      return { ...state, filters: DEFAULT_FILTERS };
    case 'TOGGLE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.map(w =>
          w.id === action.id ? { ...w, active: !w.active } : w
        ),
      };
    case 'UPDATE_LAYOUT':
      return {
        ...state,
        widgets: state.widgets.map(w => {
          const item = action.layout.find(l => l.i === w.id);
          return item ? { ...w, x: item.x, y: item.y, w: item.w, h: item.h } : w;
        }),
      };
    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.value };
    case 'SET_FILTER_OPTIONS':
      return { ...state, filterOptions: action.payload };
    case 'LOAD_PREFERENCES':
      return {
        ...state,
        widgets:  action.payload.widgets  || state.widgets,
        filters:  action.payload.filters  || state.filters,
      };
    default:
      return state;
  }
}

// ── Context & Provider ───────────────────────────────────
const DashboardContext = createContext(null);

const USER_ID = 'user_default'; // Em produção, vem do auth

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Carregar preferências salvas (localStorage como fallback)
  useEffect(() => {
    const saved = localStorage.getItem(`dashboard_prefs_${USER_ID}`);
    if (saved) {
      try { dispatch({ type: 'LOAD_PREFERENCES', payload: JSON.parse(saved) }); }
      catch { /* ignora JSON inválido */ }
    }
  }, []);

  // Salvar preferências automaticamente (debounce de 2s)
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(
        `dashboard_prefs_${USER_ID}`,
        JSON.stringify({ widgets: state.widgets, filters: state.filters })
      );
      // Em produção: POST /api/dashboard/preferences/:userId
    }, 2000);
    return () => clearTimeout(t);
  }, [state.widgets, state.filters]);

  // Query string de filtros para as APIs
  const filterParams = useCallback(() => {
    return new URLSearchParams(
      Object.entries(state.filters).filter(([, v]) => v !== '')
    ).toString();
  }, [state.filters]);

  return (
    <DashboardContext.Provider value={{ state, dispatch, filterParams }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard deve ser usado dentro de DashboardProvider');
  return ctx;
}
