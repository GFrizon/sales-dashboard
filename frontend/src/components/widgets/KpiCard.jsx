// ============================================================
// components/widgets/KpiCard.jsx — VERSÃO MELHORADA
// Design executivo com tendência, ícones e cores semânticas
// ============================================================
'use client';
import { DollarSign, Users, Tag, Lock, Percent, TrendingUp, ShoppingCart } from 'lucide-react';

const KPI_CONFIG = {
  'kpi-receita': {
    title:  'Receita Líquida',
    field:  'RECEITA_LIQUIDA',
    icon:   DollarSign,
    format: 'currency',
    color:  'emerald',
    desc:   'Após descontos aplicados',
  },
  'kpi-faturamento': {
    title:  'Faturamento Bruto',
    field:  'FATURAMENTO_BRUTO',
    icon:   TrendingUp,
    format: 'currency',
    color:  'blue',
    desc:   'Qtde × Preço unitário',
  },
  'kpi-ticket': {
    title:  'Ticket Médio',
    field:  'TICKET_MEDIO',
    icon:   Tag,
    format: 'currency',
    color:  'violet',
    desc:   'Receita por pedido',
  },
  'kpi-clientes': {
    title:  'Clientes Ativos',
    field:  'CLIENTES_UNICOS',
    icon:   Users,
    format: 'number',
    color:  'indigo',
    desc:   'CNPJs com pedidos',
  },
  'kpi-pedidos': {
    title:  'Total de Pedidos',
    field:  'TOTAL_PEDIDOS',
    icon:   ShoppingCart,
    format: 'number',
    color:  'cyan',
    desc:   'Pedidos no período',
  },
  'kpi-desconto': {
    title:  'Desconto Médio',
    field:  'DESCONTO_MEDIO',
    icon:   Percent,
    format: 'percent',
    color:  'auto', // calculado dinamicamente
    desc:   'Média de desconto concedido',
    thresholds: { good: 10, warn: 20 },
  },
  'kpi-bloqueado': {
    title:  'Pedidos Bloqueados',
    field:  'VALOR_BLOQUEADO',
    icon:   Lock,
    format: 'currency',
    color:  'red',
    desc:   'Aguardando liberação',
  },
};

// Paleta de cores executiva
const PALETTES = {
  emerald: {
    bg:        'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    border:    '#a7f3d0',
    iconBg:    '#10b981',
    iconColor: '#fff',
    valColor:  '#065f46',
    descColor: '#6ee7b7',
  },
  blue: {
    bg:        'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    border:    '#93c5fd',
    iconBg:    '#3b82f6',
    iconColor: '#fff',
    valColor:  '#1e3a8a',
    descColor: '#93c5fd',
  },
  violet: {
    bg:        'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    border:    '#c4b5fd',
    iconBg:    '#7c3aed',
    iconColor: '#fff',
    valColor:  '#3b0764',
    descColor: '#c4b5fd',
  },
  indigo: {
    bg:        'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
    border:    '#a5b4fc',
    iconBg:    '#4338ca',
    iconColor: '#fff',
    valColor:  '#1e1b4b',
    descColor: '#a5b4fc',
  },
  cyan: {
    bg:        'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
    border:    '#67e8f9',
    iconBg:    '#0891b2',
    iconColor: '#fff',
    valColor:  '#164e63',
    descColor: '#67e8f9',
  },
  amber: {
    bg:        'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    border:    '#fcd34d',
    iconBg:    '#d97706',
    iconColor: '#fff',
    valColor:  '#78350f',
    descColor: '#fcd34d',
  },
  red: {
    bg:        'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    border:    '#fca5a5',
    iconBg:    '#dc2626',
    iconColor: '#fff',
    valColor:  '#7f1d1d',
    descColor: '#fca5a5',
  },
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

  const { title, icon: Icon, format, desc, thresholds } = config;
  const rawValue = data?.[config.field];

  // Cor dinâmica para desconto
  let colorKey = config.color;
  if (colorKey === 'auto' && thresholds) {
    if (rawValue != null) {
      if      (rawValue <= thresholds.good) colorKey = 'emerald';
      else if (rawValue <= thresholds.warn) colorKey = 'amber';
      else                                  colorKey = 'red';
    } else {
      colorKey = 'amber';
    }
  }

  const p = PALETTES[colorKey] || PALETTES.blue;

  return (
    <div
      className="h-full flex flex-col justify-between p-4 rounded-xl overflow-hidden relative"
      style={{ background: p.bg, border: `1px solid ${p.border}` }}
    >
      {/* Decoração de fundo */}
      <div
        className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10"
        style={{ backgroundColor: p.iconBg }}
      />

      {/* Header: ícone + título */}
      <div className="flex items-start justify-between gap-2 relative z-10">
        <p className="text-xs font-semibold text-gray-500 leading-tight uppercase tracking-wide">
          {title}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ backgroundColor: p.iconBg }}
        >
          <Icon className="w-4 h-4" style={{ color: p.iconColor }} />
        </div>
      </div>

      {/* Valor principal */}
      <div className="relative z-10 my-1">
        {loading ? (
          <div className="h-7 w-24 bg-white/60 rounded-lg animate-pulse" />
        ) : (
          <div
            className="text-2xl font-bold leading-none tracking-tight"
            style={{ color: p.valColor }}
          >
            {fmt(rawValue, format)}
          </div>
        )}
      </div>

      {/* Descrição */}
      <p className="text-[10px] font-medium relative z-10 truncate" style={{ color: p.descColor }}>
        {desc}
      </p>
    </div>
  );
}