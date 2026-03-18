// ============================================================
// components/widgets/CurvaAbcChart.jsx — VERSÃO MELHORADA
// Pareto ABC com resumo executivo e gráfico limpo
// ============================================================
'use client';
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from 'recharts';

const CURVA_COLORS = { A: '#10b981', B: '#f59e0b', C: '#ef4444' };
const CURVA_LABELS = {
  A: { bg: '#f0fdf4', border: '#a7f3d0', text: '#065f46', badge: 'bg-emerald-100 text-emerald-800' },
  B: { bg: '#fffbeb', border: '#fde68a', text: '#78350f', badge: 'bg-amber-100 text-amber-800' },
  C: { bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d', badge: 'bg-red-100 text-red-800' },
};

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
  }).format(v || 0);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const c = CURVA_COLORS[d?.CURVA] || '#6b7280';
  return (
    <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-3 text-xs max-w-[200px]">
      <p className="font-semibold mb-1.5 text-gray-200 truncate">{d?.MATERIAL}</p>
      <div className="space-y-1 text-gray-300">
        <div className="flex justify-between gap-3">
          <span>Receita</span>
          <span className="font-semibold text-white">{formatCurrency(d?.RECEITA)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Participação</span>
          <span className="font-medium text-white">{d?.PERC}%</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Acumulado</span>
          <span className="font-medium text-white">{d?.PERC_ACUM}%</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Curva</span>
          <span className="font-bold" style={{ color: c }}>Curva {d?.CURVA}</span>
        </div>
      </div>
    </div>
  );
};

function SummaryCard({ curva, count, receita, pct }) {
  const s = CURVA_LABELS[curva];
  return (
    <div
      className="flex-1 rounded-lg p-2 border"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-black px-1.5 py-0.5 rounded ${s.badge}`}>
          Curva {curva}
        </span>
        <span className="text-xs font-bold" style={{ color: s.text }}>{pct}%</span>
      </div>
      <div className="text-[10px] text-gray-500 space-y-0.5">
        <div>{count} produto{count !== 1 ? 's' : ''}</div>
        <div className="font-medium" style={{ color: s.text }}>{formatCurrency(receita)}</div>
      </div>
    </div>
  );
}

export function CurvaAbcChart({ data, loading }) {
  if (loading) {
    return (
      <div className="h-full flex items-end gap-1 px-4 pb-8">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-100 rounded-t animate-pulse"
            style={{ height: `${90 - i * 3}%` }}
          />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        Sem dados de curva ABC
      </div>
    );
  }

  // Resumo por curva
  const summary = { A: { count: 0, receita: 0 }, B: { count: 0, receita: 0 }, C: { count: 0, receita: 0 } };
  data.forEach(d => {
    if (summary[d.CURVA]) {
      summary[d.CURVA].count++;
      summary[d.CURVA].receita += Number(d.RECEITA) || 0;
    }
  });
  const total = data.reduce((s, d) => s + (Number(d.RECEITA) || 0), 0);

  // Evita mostrar apenas curva A quando ela domina os primeiros itens.
  // Se houver mais de 25 itens em A, mostramos todos de A + uma janela adicional
  // para incluir B/C na visualização.
  const baseLimit = 25;
  const extraAfterA = 20;
  const dynamicLimit = summary.A.count > baseLimit
    ? Math.min(data.length, summary.A.count + extraAfterA)
    : Math.min(data.length, baseLimit);
  const display = data.slice(0, dynamicLimit);
  const chartWidth = Math.max(900, display.length * 42);

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Resumo executivo */}
      <div className="flex gap-2">
        {['A', 'B', 'C'].map(c => (
          <SummaryCard
            key={c}
            curva={c}
            count={summary[c].count}
            receita={summary[c].receita}
            pct={total > 0 ? ((summary[c].receita / total) * 100).toFixed(0) : 0}
          />
        ))}
      </div>

      {/* Gráfico Pareto */}
      <div className="flex items-center gap-3 px-1 -mt-1 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />
          <span>Barras: Receita</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-[2px] rounded bg-indigo-500" />
          <span>Linha: % acumulado</span>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-x-auto overflow-y-hidden pb-1">
          <div style={{ width: chartWidth, minWidth: '100%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={display} margin={{ top: 5, right: 30, left: 5, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="MATERIAL"
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={45}
                  tickFormatter={v => v?.substring(0, 10)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine yAxisId="right" y={80} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.5} />
                <ReferenceLine yAxisId="right" y={95} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Bar yAxisId="left" dataKey="RECEITA" name="Receita" radius={[3, 3, 0, 0]} maxBarSize={32}>
                  {display.map((d, i) => (
                    <Cell key={i} fill={CURVA_COLORS[d.CURVA] || '#6b7280'} opacity={0.85} />
                  ))}
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="PERC_ACUM"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={false}
                  name="% Acumulado"
                  activeDot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CurvaAbcChart;

