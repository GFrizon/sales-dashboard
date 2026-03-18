// ============================================================
// components/widgets/CurvaAbcChart.jsx
// Gráfico de Pareto — Curva ABC de produtos
// ============================================================
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';

const CURVA_COLORS = { A: '#10b981', B: '#f59e0b', C: '#ef4444' };

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1
  }).format(v);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs max-w-xs">
      <p className="font-semibold text-gray-800 mb-1 truncate">{d.MATERIAL}</p>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Receita:</span>
          <span className="font-medium">{formatCurrency(d.RECEITA)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Participação:</span>
          <span className="font-medium">{d.PERC}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Acumulado:</span>
          <span className="font-medium">{d.PERC_ACUM}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Curva:</span>
          <span className={`font-bold ${d.CURVA === 'A' ? 'text-emerald-600' : d.CURVA === 'B' ? 'text-amber-600' : 'text-red-500'}`}>
            {d.CURVA}
          </span>
        </div>
      </div>
    </div>
  );
};

// Legenda de resumo por curva
function CurvaSummary({ data }) {
  const summary = { A: { count: 0, receita: 0 }, B: { count: 0, receita: 0 }, C: { count: 0, receita: 0 } };
  data.forEach(d => {
    summary[d.CURVA].count++;
    summary[d.CURVA].receita += d.RECEITA;
  });
  const total = data.reduce((s, d) => s + d.RECEITA, 0);

  return (
    <div className="flex gap-3 mb-2">
      {['A', 'B', 'C'].map(curva => (
        <div key={curva} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
          <span className={`text-sm font-bold ${curva === 'A' ? 'text-emerald-600' : curva === 'B' ? 'text-amber-600' : 'text-red-500'}`}>
            Curva {curva}
          </span>
          <span className="text-xs text-gray-500">
            {summary[curva].count} itens · {((summary[curva].receita / total) * 100).toFixed(0)}% da receita
          </span>
        </div>
      ))}
    </div>
  );
}

export function CurvaAbcChart({ data, loading }) {
  if (loading) {
    return <div className="h-full bg-gray-50 rounded-lg animate-pulse" />;
  }
  if (!data?.length) {
    return <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sem dados</div>;
  }

  // Limitar a top 30 para não poluir
  const display = data.slice(0, 30);

  return (
    <div className="h-full flex flex-col">
      <CurvaSummary data={data} />
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={display} margin={{ top: 0, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="MATERIAL"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              angle={-35}
              textAnchor="end"
              interval={0}
              height={50}
              tickFormatter={v => v?.substring(0, 12)}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={v => `${v}%`}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar yAxisId="left" dataKey="RECEITA" name="Receita" radius={[3, 3, 0, 0]} maxBarSize={28}>
              {display.map((d, i) => (
                <Cell key={i} fill={CURVA_COLORS[d.CURVA]} opacity={0.85} />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="PERC_ACUM"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              name="% Acumulado"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default CurvaAbcChart;
