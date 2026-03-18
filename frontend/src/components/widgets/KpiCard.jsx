// ============================================================
// components/widgets/KpiCard.jsx — VERSÃO FINAL
// Título incluído dentro do card (wrapper não tem header para KPIs)
// ============================================================
'use client';
import { DollarSign, Users, Tag, Lock, Percent } from 'lucide-react';

const KPI_CONFIG = {
  'kpi-receita': {
    title: 'Receita Líquida',
    field: 'RECEITA_LIQUIDA',
    icon: DollarSign,
    format: 'currency',
    color: 'emerald',
    sub: 'após descontos',
  },
  'kpi-faturamento': {
    title: 'Faturamento Bruto',
    field: 'FATURAMENTO_BRUTO',
    icon: DollarSign,
    format: 'currency',
    color: 'blue',
    sub: 'QTDE × PREÇO',
  },
  'kpi-ticket': {
    title: 'Ticket Médio',
    field: 'TICKET_MEDIO',
    icon: Tag,
    format: 'currency',
    color: 'violet',
    sub: 'por pedido',
  },
  'kpi-clientes': {
    title: 'Clientes Únicos',
    field: 'CLIENTES_UNICOS',
    icon: Users,
    format: 'number',
    color: 'indigo',
    sub: 'CNPJs distintos',
  },
  'kpi-desconto': {
    title: '% Desconto Médio',
    field: 'DESCONTO_MEDIO',
    icon: Percent,
    format: 'percent',
    color: 'amber',
    sub: 'média de desconto',
    thresholds: { ok: 10, warn: 20 },
  },
  'kpi-bloqueado': {
    title: 'Valor Bloqueado',
    field: 'VALOR_BLOQUEADO',
    icon: Lock,
    format: 'currency',
    color: 'red',
    sub: 'pedidos bloqueados',
  },
};

const PALETTES = {
  emerald: { bg: '#f0fdf4', iconBg: '#dcfce7', iconColor: '#16a34a', valColor: '#15803d', subColor: '#86efac', border: '#bbf7d0' },
  blue:    { bg: '#eff6ff', iconBg: '#dbeafe', iconColor: '#2563eb', valColor: '#1d4ed8', subColor: '#93c5fd', border: '#bfdbfe' },
  violet:  { bg: '#f5f3ff', iconBg: '#ede9fe', iconColor: '#7c3aed', valColor: '#6d28d9', subColor: '#c4b5fd', border: '#ddd6fe' },
  indigo:  { bg: '#eef2ff', iconBg: '#e0e7ff', iconColor: '#4338ca', valColor: '#3730a3', subColor: '#a5b4fc', border: '#c7d2fe' },
  amber:   { bg: '#fffbeb', iconBg: '#fef3c7', iconColor: '#d97706', valColor: '#b45309', subColor: '#fcd34d', border: '#fde68a' },
  red:     { bg: '#fef2f2', iconBg: '#fee2e2', iconColor: '#dc2626', valColor: '#b91c1c', subColor: '#fca5a5', border: '#fecaca' },
};

function fmt(value, format) {
  if (value == null || value === '') return '—';
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL',
        notation: 'compact', maximumFractionDigits: 1,
      }).format(value);
    case 'percent':
      return `${Number(value).toFixed(1)}%`;
    case 'number':
      return new Intl.NumberFormat('pt-BR').format(value);
    default:
      return String(value);
  }
}

export default function KpiCard({ widgetId, data, loading }) {
  const config = KPI_CONFIG[widgetId];
  if (!config) return null;

  const { title, icon: Icon, format, sub, thresholds } = config;
  let colorKey = config.color;

  const rawValue = data?.[config.field];

  if (widgetId === 'kpi-desconto' && rawValue != null && thresholds) {
    if (rawValue > thresholds.warn)    colorKey = 'red';
    else if (rawValue > thresholds.ok) colorKey = 'amber';
    else                               colorKey = 'emerald';
  }

  const p = PALETTES[colorKey] || PALETTES.blue;

  return (
    <div
      className="h-full flex flex-col p-4 rounded-xl"
      style={{ background: p.bg, border: `1px solid ${p.border}` }}
    >
      {/* Título + ícone */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">
          {title}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: p.iconBg }}
        >
          <Icon className="w-4 h-4" style={{ color: p.iconColor }} />
        </div>
      </div>

      {/* Valor principal */}
      <div className="flex-1 flex items-center">
        {loading ? (
          <div className="h-8 w-28 bg-white/70 rounded-lg animate-pulse" />
        ) : (
          <span className="text-2xl font-bold tracking-tight" style={{ color: p.valColor }}>
            {fmt(rawValue, format)}
          </span>
        )}
      </div>

      {/* Sub-label */}
      <p className="text-xs mt-2 font-medium" style={{ color: p.iconColor, opacity: 0.7 }}>
        {sub}
      </p>
    </div>
  );
}
