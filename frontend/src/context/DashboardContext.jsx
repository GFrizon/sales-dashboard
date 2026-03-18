"use client";

// ============================================================
// context/DashboardContext.jsx — VERSÃO CORRIGIDA
// Correções principais:
//   - clearApiCache chamado corretamente ao mudar filtros
//   - filterParams retorna string estável
//   - RESET_FILTERS restaura datas padrão
//   - Adicionado kpi-pedidos no layout padrão
// ============================================================
import {
  createContext, useContext, useReducer,
  useEffect, useCallback, useMemo,
} from 'react';
import { clearApiCache } from '../hooks/useApiData';

// ── Estado inicial ────────────────────────────────────────────
function getDefaultFilters() {
  const hoje = new Date().toISOString().split('T')[0];
  const inicioAno = `${new Date().getFullYear()}-01-01`;
  return {
    dataInicio: inicioAno,
    dataFim:    hoje,
    vendedor:   '',
    cliente:    '',
    uf:         '',
    material:   '',
    tipo:       '',
    controle:   '',
    uneg:       '',
  };
}

const DEFAULT_FILTERS = getDefaultFilters();

const DEFAULT_WIDGETS = [
  // KPIs — linha 1 (4 cards)
  { id: 'kpi-receita',      type: 'KPI',        title: 'Receita Líquida',      active: true,  x: 0,  y: 0, w: 3, h: 2 },
  { id: 'kpi-faturamento',  type: 'KPI',        title: 'Faturamento Bruto',    active: true,  x: 3,  y: 0, w: 3, h: 2 },
  { id: 'kpi-ticket',       type: 'KPI',        title: 'Ticket Médio',         active: true,  x: 6,  y: 0, w: 3, h: 2 },
  { id: 'kpi-clientes',     type: 'KPI',        title: 'Clientes Ativos',      active: true,  x: 9,  y: 0, w: 3, h: 2 },
  // KPIs — linha 2 (3 cards)
  { id: 'kpi-desconto',     type: 'KPI',        title: 'Desconto Médio',       active: true,  x: 0,  y: 2, w: 4, h: 2 },
  { id: 'kpi-bloqueado',    type: 'KPI',        title: 'Pedidos Bloqueados',   active: true,  x: 4,  y: 2, w: 4, h: 2 },
  { id: 'kpi-pedidos',      type: 'KPI',        title: 'Total de Pedidos',     active: true,  x: 8,  y: 2, w: 4, h: 2 },
  // Gráficos principais
  { id: 'chart-evolucao',   type: 'CHART_LINE', title: 'Evolução de Vendas',   active: true,  x: 0,  y: 4, w: 8, h: 4 },
  { id: 'chart-status',     type: 'CHART_PIE',  title: 'Receita por Status',   active: true,  x: 8,  y: 4, w: 4, h: 4 },
  // Rankings
  { id: 'chart-vendedores', type: 'CHART_BAR',  title: 'Top Vendedores',       active: true,  x: 0,  y: 8, w: 4, h: 5 },
  { id: 'chart-clientes',   type: 'CHART_BAR',  title: 'Top Clientes',         active: true,  x: 4,  y: 8, w: 4, h: 5 },
  { id: 'chart-produtos',   type: 'CHART_BAR',  title: 'Top Produtos',         active: true,  x: 8,  y: 8, w: 4, h: 5 },
  // Análises avançadas
  { id: 'chart-qualidade',  type: 'CHART_PIE',  title: 'Qualidade dos Pedidos',active: false, x: 0,  y: 13, w: 4, h: 4 },
  { id: 'chart-abc',        type: 'CHART_ABC',  title: 'Curva ABC de Produtos',active: false, x: 0,  y: 17, w: 12, h: 5 },
];

// ── Reducer ───────────────────────────────────────────────────
const initialState = {
  filters:       { ...DEFAULT_FILTERS },
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
      return { ...state, filters: { ...getDefaultFilters() } };

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
        widgets: action.payload.widgets || state.widgets,
        filters: { ...getDefaultFilters(), ...(action.payload.filters || {}) },
      };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────
const DashboardContext = createContext(null);

function getCurrentUserId() {
  if (typeof window === 'undefined') return 'user_default';
  try {
    const raw = localStorage.getItem('dashboard_user');
    if (!raw) return 'user_default';
    const user = JSON.parse(raw);
    return user?.id || user?.username || 'user_default';
  } catch {
    return 'user_default';
  }
}

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Carregar preferências salvas
  useEffect(() => {
    try {
      const userId = getCurrentUserId();
      const saved = localStorage.getItem(`dashboard_prefs_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_PREFERENCES', payload: parsed });
      }
    } catch { /* ignora */ }
  }, []);

  // Salvar preferências (debounce 2s)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const userId = getCurrentUserId();
        localStorage.setItem(
          `dashboard_prefs_${userId}`,
          JSON.stringify({ widgets: state.widgets, filters: state.filters })
        );
      } catch { /* ignora */ }
    }, 2000);
    return () => clearTimeout(t);
  }, [state.widgets, state.filters]);

  // CORREÇÃO: Invalidar cache quando filtros mudam
  // Usamos JSON.stringify para detectar mudanças reais nos filtros
  useEffect(() => {
    clearApiCache('/api/sales');
  }, [JSON.stringify(state.filters)]); // eslint-disable-line

  // Gera query string para APIs
  const filterParams = useCallback(() => {
    const f = state.filters;
    const params = new URLSearchParams();
    if (f.dataInicio) params.set('dataInicio', f.dataInicio);
    if (f.dataFim)    params.set('dataFim',    f.dataFim);
    if (f.vendedor)   params.set('vendedor',   f.vendedor);
    if (f.cliente)    params.set('cliente',    f.cliente);
    if (f.uf)         params.set('uf',         f.uf);
    if (f.material)   params.set('material',   f.material);
    if (f.tipo)       params.set('tipo',       f.tipo);
    if (f.controle)   params.set('controle',   f.controle);
    if (f.uneg)       params.set('uneg',       f.uneg);
    return params.toString();
  }, [state.filters]);

  // Conta filtros ativos (datas + outros)
  const activeFilterCount = useMemo(() => {
    const { dataInicio, dataFim, ...rest } = state.filters;
    const def = getDefaultFilters();
    const restCount  = Object.values(rest).filter(v => v !== '').length;
    const dateActive = dataInicio !== def.dataInicio || dataFim !== def.dataFim;
    return restCount + (dateActive ? 1 : 0);
  }, [state.filters]);

  const value = useMemo(
    () => ({ state, dispatch, filterParams, activeFilterCount }),
    [state, dispatch, filterParams, activeFilterCount]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard deve ser usado dentro de DashboardProvider');
  return ctx;
}
