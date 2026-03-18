// ============================================================
// components/filters/FilterBar.jsx — VERSÃO CORRIGIDA E MELHORADA
// Filtros funcionais com:
//   - Tags visuais de filtros ativos
//   - Dropdown limpo sem necessidade de digitar
//   - Indicador claro de filtros aplicados
//   - Date picker com atalhos rápidos
// ============================================================
'use client';
import { useState, useEffect, useRef } from 'react';
import { Filter, X, ChevronDown, Calendar, Check } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

// ── Dropdown simples (sem busca obrigatória) ──────────────────
function FilterSelect({ label, value, onChange, options = [], loading, placeholder = 'Todos' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

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

  const selectedOption = options.find(o => String(o.value) === String(value));
  const selectedLabel  = selectedOption?.label || '';

  function handleSelect(val) {
    onChange(val);
    setOpen(false);
    setSearch('');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all ${
          value
            ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <span className={value ? 'text-blue-200 text-[10px]' : 'text-gray-400 text-[10px]'}>{label}</span>
        <span className="max-w-[80px] truncate">
          {value ? selectedLabel.split(' - ')[0].substring(0, 16) : placeholder}
        </span>
        {value
          ? <X className="w-3 h-3 text-blue-200 hover:text-white flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); onChange(''); }} />
          : <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        }
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-[120] bg-white border border-gray-200 rounded-xl shadow-2xl w-56 overflow-hidden">
          {options.length > 8 && (
            <div className="p-2 border-b border-gray-100">
              <input
                autoFocus
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-blue-400"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}

          <ul className="max-h-60 overflow-y-auto py-1">
            <li
              onClick={() => handleSelect('')}
              className="flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 text-gray-500"
            >
              <span>Todos</span>
              {!value && <Check className="w-3 h-3 text-blue-500" />}
            </li>
            {loading && (
              <li className="px-3 py-2 text-xs text-gray-400 italic">Carregando opções...</li>
            )}
            {!loading && filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-gray-400 italic">Nenhum resultado</li>
            )}
            {!loading && filtered.map((opt, i) => (
              <li
                key={i}
                onClick={() => handleSelect(opt.value)}
                className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                  String(value) === String(opt.value)
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={opt.label}
              >
                <span className="truncate max-w-[180px]">{opt.label}</span>
                {String(value) === String(opt.value) && <Check className="w-3 h-3 text-blue-500 flex-shrink-0" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Período com atalhos ────────────────────────────────────────
function PeriodFilter({ dataInicio, dataFim, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const today    = () => new Date().toISOString().split('T')[0];
  const daysAgo  = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };
  const thisYear = () => `${new Date().getFullYear()}-01-01`;
  const lastYear = () => `${new Date().getFullYear() - 1}-01-01`;
  const lastYearEnd = () => `${new Date().getFullYear() - 1}-12-31`;

  const PRESETS = [
    { label: 'Hoje',         start: today(),    end: today()       },
    { label: 'Últimos 7d',   start: daysAgo(7), end: today()       },
    { label: 'Últimos 30d',  start: daysAgo(30),end: today()       },
    { label: 'Últimos 90d',  start: daysAgo(90),end: today()       },
    { label: 'Este ano',     start: thisYear(), end: today()       },
    { label: 'Ano anterior', start: lastYear(), end: lastYearEnd() },
  ];

  function apply(start, end) {
    onChange('dataInicio', start);
    onChange('dataFim', end);
    setOpen(false);
  }

  const defaultInicio = `${new Date().getFullYear()}-01-01`;
  const isCustom = dataInicio !== defaultInicio || dataFim !== today();

  const label = `${dataInicio?.slice(5).replace('-','/')} – ${dataFim?.slice(5).replace('-','/')}`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all ${
          isCustom
            ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Calendar className="w-3 h-3 flex-shrink-0" />
        <span>{label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-[120] bg-white border border-gray-200 rounded-xl shadow-2xl w-72 p-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Período rápido</p>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {PRESETS.map(p => {
              const active = dataInicio === p.start && dataFim === p.end;
              return (
                <button
                  key={p.label}
                  onClick={() => apply(p.start, p.end)}
                  className={`text-xs px-2 py-2 rounded-lg transition-all font-medium ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Intervalo personalizado</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dataInicio}
                onChange={e => onChange('dataInicio', e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
              />
              <span className="text-gray-300 text-xs font-bold">→</span>
              <input
                type="date"
                value={dataFim}
                onChange={e => onChange('dataFim', e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
              />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 w-full py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tags de filtros ativos ─────────────────────────────────────
function ActiveFilterTags({ filters, filterOptions, onRemove, onClearAll }) {
  const tags = [];

  const LABELS = {
    vendedor: 'Vendedor', cliente: 'Cliente', uf: 'UF',
    material: 'Produto', controle: 'Status', tipo: 'Tipo', uneg: 'UNEG',
  };

  Object.entries(LABELS).forEach(([key, label]) => {
    if (filters[key]) {
      // Tenta encontrar o label amigável nas options
      const opts = filterOptions?.[key === 'vendedor' ? 'vendedores'
        : key === 'cliente' ? 'clientes'
        : key === 'uf' ? 'ufs'
        : key === 'material' ? 'materiais'
        : key === 'controle' ? 'controles'
        : key === 'tipo' ? 'tipos'
        : 'unegs'] || [];
      const opt = opts.find(o => String(o.value) === String(filters[key]));
      const displayVal = opt ? opt.label.split(' - ')[0].substring(0, 20) : filters[key];
      tags.push({ key, label, value: displayVal });
    }
  });

  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tags.map(tag => (
        <span
          key={tag.key}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[11px] font-medium"
        >
          <span className="text-blue-500">{tag.label}:</span>
          {tag.value}
          <button
            onClick={() => onRemove(tag.key)}
            className="ml-0.5 text-blue-400 hover:text-blue-700 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-[11px] text-red-500 hover:text-red-700 font-medium px-1.5 py-0.5 hover:bg-red-50 rounded-full transition-colors"
      >
        Limpar tudo
      </button>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export function FilterBar() {
  const { state, dispatch, activeFilterCount } = useDashboard();
  const { filters, filterOptions } = state;

  const [options, setOptions]       = useState({});
  const [optLoading, setOptLoading] = useState(false);

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

  function clearAll() {
    dispatch({ type: 'RESET_FILTERS' });
  }

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div
      className="bg-white border-b border-gray-100 sticky top-14 z-[110] filter-bar"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      {/* Linha principal de filtros */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-visible flex-wrap" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
          <Filter className="w-3.5 h-3.5" />
          {hasActiveFilters && (
            <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="w-px h-4 bg-gray-200 flex-shrink-0" />

        {/* Período */}
        <PeriodFilter
          dataInicio={filters.dataInicio}
          dataFim={filters.dataFim}
          onChange={setFilter}
        />

        {/* Separador */}
        <div className="w-px h-4 bg-gray-100 flex-shrink-0" />

        {/* Filtros de dimensão */}
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
          label="Unidade"
          value={filters.uneg}
          onChange={v => setFilter('uneg', v)}
          options={options.unegs || []}
          loading={optLoading}
        />

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex-shrink-0 ml-1 font-medium"
          >
            <X className="w-3 h-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Tags de filtros ativos */}
      {hasActiveFilters && (
        <div className="px-4 pb-2">
          <ActiveFilterTags
            filters={filters}
            filterOptions={options}
            onRemove={key => setFilter(key, '')}
            onClearAll={clearAll}
          />
        </div>
      )}
    </div>
  );
}

export default FilterBar;
