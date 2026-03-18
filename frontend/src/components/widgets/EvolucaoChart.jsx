// ============================================================
// components/widgets/EvolucaoChart.jsx — VERSÃO MELHORADA
// Gráfico de área com tooltip rico e botões de agrupamento
// ============================================================
'use client';
import { useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';

function formatCurrency(v) {
  if (!v && v !== 0) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
  }).format(v);
}

function formatPeriod(p = '') {
  if (p.length === 7) { // YYYY-MM
    const [y, m] = p.split('-');
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${months[parseInt(m) - 1]}/${y.slice(2)}`;
  }
  return p;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const receita = payload.find(p => p.dataKey === 'RECEITA');
  const fat     = payload.find(p => p.dataKey === 'FATURAMENTO_BRUTO');
  return (
    <div className="bg-gray-900 text-white rounded-xl shadow-2xl p-3 text-xs min-w-[180px] border border-gray-700">
      <p className="font-bold text-gray-200 mb-2 pb-2 border-b border-gray-700">
        {formatPeriod(label)}
      </p>
      {fat && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-gray-400">Faturamento</span>
          </div>
          <span className="font-semibold text-blue-300">{formatCurrency(fat.value)}</span>
        </div>
      )}
      {receita && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-gray-400">Receita Líq.</span>
          </div>
          <span className="font-semibold text-emerald-300">{formatCurrency(receita.value)}</span>
        </div>
      )}
      {fat && receita && (
        <div className="mt-2 pt-2 border-t border-gray-700 flex items-center justify-between gap-4">
          <span className="text-gray-500 text-[10px]">Desconto implícito</span>
          <span className="text-amber-400 font-semibold text-[10px]">
            {(((fat.value - receita.value) / fat.value) * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex items-center gap-4 justify-end mb-1">
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-1.5 rounded-full bg-blue-400 opacity-70" />
      <span className="text-[11px] text-gray-500">Faturamento Bruto</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-1.5 rounded-full bg-emerald-500" />
      <span className="text-[11px] text-gray-500">Receita Líquida</span>
    </div>
  </div>
);

export function EvolucaoChart({ data, loading }) {
  if (loading) {
    return (
      <div className="h-full flex items-end gap-2 px-2 pb-6">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-100 rounded-t animate-pulse"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        Nenhum dado no período selecionado
      </div>
    );
  }

  const formatted = data.map(d => ({
    ...d,
    _periodo: formatPeriod(d.PERIODO),
  }));

  // Calcula média de receita para linha de referência
  const mediaReceita = data.reduce((s, d) => s + (d.RECEITA || 0), 0) / data.length;

  return (
    <div className="h-full flex flex-col">
      <CustomLegend />
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="_periodo"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={38}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={mediaReceita}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
            <Area
              type="monotone"
              dataKey="FATURAMENTO_BRUTO"
              stroke="#3b82f6"
              strokeWidth={1.5}
              fill="url(#gradFat)"
              dot={false}
              activeDot={{ r: 4, stroke: '#3b82f6', fill: '#fff', strokeWidth: 2 }}
              name="Faturamento Bruto"
            />
            <Area
              type="monotone"
              dataKey="RECEITA"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#gradReceita)"
              dot={false}
              activeDot={{ r: 5, stroke: '#10b981', fill: '#fff', strokeWidth: 2 }}
              name="Receita Líquida"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default EvolucaoChart;