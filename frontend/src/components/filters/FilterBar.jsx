// ============================================================
// components/filters/FilterBar.jsx — VERSÃO CORRIGIDA
// Correções:
//   1. activeFilterCount vindo do contexto (inclui datas)
//   2. Filtros fecham ao selecionar opção
//   3. Scroll horizontal suave (scrollbar-hide)
//   4. Indicador visual claro de filtros ativos
// ============================================================
'use client';
import { useState, useEffect, useRef } from 'react';
import { Filter, X, ChevronDown, Calendar, Search } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

// ── Dropdown com busca ────────────────────────────────────────
function FilterSelect({ label, value, onChange, options = [], loading }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o =>
    String(o.label || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || '';

  function handleSelect(val) {
    onChange(val);
    setOpen(false);
    setSearch('');
  }

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all ${
          value
            ? 'border-blue-400 bg-blue-50 text-blue-700 ring-1 ring-blue-200'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <span className="text-gray-400 font-normal">{label}:</span>
        <span className="ml-0.5 max-w-[90px] truncate">
          {value ? selectedLabel.split(' - ')[0].substring(0, 14) : 'Todos'}
        </span>
        {value && (
          <span
            className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"
            title="Filtro ativo"
          />
        )}
        <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-60 overflow-hidden">
          {/* Busca */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
              <Search className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                className="flex-1 bg-transparent text-xs outline-none"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de opções */}
          <ul className="max-h-56 overflow-y-auto py-1">
            <li
              onClick={() => handleSelect('')}
              className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 ${
                !value ? 'text-blue-600 font-semibold' : 'text-gray-500'
              }`}
            >
              Todos
            </li>
            {loading && (
              <li className="px-3 py-2 text-xs text-gray-400">Carregando...</li>
            )}
            {!loading && filtered.map((opt, i) => (
              <li
                key={i}
                onClick={() => handleSelect(opt.value)}
                className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-50 truncate ${
                  String(value) === String(opt.value)
                    ? 'text-blue-600 font-semibold bg-blue-50'
                    : 'text-gray-700'
                }`}
                title={opt.label}
              >
                {opt.label}
              </li>
            ))}
            {!loading && filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-gray-400 italic">
                Nenhum resultado
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Filtro de período ─────────────────────────────────────────
function DateRangeFilter({ dataInicio, dataFim, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function today()    { return new Date().toISOString().split('T')[0]; }
  function daysAgo(n) {
    const d = new Date(); d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }

  const PRESETS = [
    { label: 'Hoje',            fn: () => { const d = today(); return [d, d]; } },
    { label: 'Últimos 7 dias',  fn: () => [daysAgo(7), today()] },
    { label: 'Últimos 30 dias', fn: () => [daysAgo(30), today()] },
    { label: 'Últimos 90 dias', fn: () => [daysAgo(90), today()] },
    { label: 'Este ano',        fn: () => [`${new Date().getFullYear()}-01-01`, today()] },
    { label: 'Ano anterior',    fn: () => { const y = new Date().getFullYear() - 1; return [`${y}-01-01`, `${y}-12-31`]; } },
  ];

  const defaultInicio = `${new Date().getFullYear()}-01-01`;
  const hasCustomDate = dataInicio !== defaultInicio || dataFim !== today();

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all ${
          hasCustomDate
            ? 'border-blue-400 bg-blue-50 text-blue-700 ring-1 ring-blue-200'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Calendar className="w-3 h-3 flex-shrink-0" />
        <span>
          {dataInicio && dataFim
            ? `${dataInicio.slice(5).replace('-', '/')} → ${dataFim.slice(5).replace('-', '/')}`
            : 'Período'}
        </span>
        {hasCustomDate && (
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-72 p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Atalhos rápidos</p>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => {
                  const [s, e] = p.fn();
                  onChange('dataInicio', s);
                  onChange('dataFim', e);
                  setOpen(false);
                }}
                className="text-xs px-2 py-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-600 transition-colors text-left"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">Personalizado</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dataInicio}
                onChange={e => onChange('dataInicio', e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400"
              />
              <span className="text-gray-300 text-xs">→</span>
              <input
                type="date"
                value={dataFim}
                onChange={e => onChange('dataFim', e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export function FilterBar() {
  const { state, dispatch, activeFilterCount } = useDashboard();
  const { filters } = state;

  const [options, setOptions]     = useState({});
  const [optLoading, setOptLoading] = useState(false);

  // Busca as opções dos filtros (vendedores, clientes, etc.)
  useEffect(() => {
    setOptLoading(true);
    fetch('/api/filters/options')
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        setOptions(data);
        dispatch({ type: 'SET_FILTER_OPTIONS', payload: data });
      })
      .catch(err => console.error('[FilterBar] erro ao buscar opções:', err))
      .finally(() => setOptLoading(false));
  }, [dispatch]);

  function setFilter(key, value) {
    dispatch({ type: 'SET_FILTER', key, value });
  }

  return (
    <div
      className="bg-white border-b border-gray-100 px-4 py-2 sticky top-14 z-30 filter-bar"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">

        {/* Label com contador */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-medium text-gray-500">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {activeFilterCount}
            </span>
          )}
        </div>

        {/* Separador */}
        <div className="w-px h-4 bg-gray-200 flex-shrink-0" />

        {/* Filtro de datas */}
        <DateRangeFilter
          dataInicio={filters.dataInicio}
          dataFim={filters.dataFim}
          onChange={setFilter}
        />

        {/* Filtros de seleção */}
        <FilterSelect
          label="Vendedor"
          value={filters.vendedor}
          onChange={v => setFilter('vendedor', v)}
          options={options.vendedores || []}
          loading={optLoading}
        />
        <FilterSelect
          label="Cliente"
          value={filters.cliente}
          onChange={v => setFilter('cliente', v)}
          options={options.clientes || []}
          loading={optLoading}
        />
        <FilterSelect
          label="UF"
          value={filters.uf}
          onChange={v => setFilter('uf', v)}
          options={options.ufs || []}
          loading={optLoading}
        />
        <FilterSelect
          label="Produto"
          value={filters.material}
          onChange={v => setFilter('material', v)}
          options={options.materiais || []}
          loading={optLoading}
        />
        <FilterSelect
          label="Status"
          value={filters.controle}
          onChange={v => setFilter('controle', v)}
          options={options.controles || []}
          loading={optLoading}
        />
        <FilterSelect
          label="Tipo"
          value={filters.tipo}
          onChange={v => setFilter('tipo', v)}
          options={options.tipos || []}
          loading={optLoading}
        />
        <FilterSelect
          label="UNEG"
          value={filters.uneg}
          onChange={v => setFilter('uneg', v)}
          options={options.unegs || []}
          loading={optLoading}
        />

        {/* Botão limpar — aparece quando há filtros ativos */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => dispatch({ type: 'RESET_FILTERS' })}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 border border-red-200 transition-colors flex-shrink-0 ml-auto whitespace-nowrap"
          >
            <X className="w-3 h-3" />
            Limpar tudo
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterBar;