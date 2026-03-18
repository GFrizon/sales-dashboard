// ============================================================
// components/widgets/EvolucaoChart.jsx
// Gráfico de linha — evolução de receita no tempo
// ============================================================
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1
  }).format(v);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function EvolucaoChart({ data, loading }) {
  if (loading) {
    return <div className="h-full flex items-center justify-center">
      <div className="w-full h-48 bg-gray-100 rounded animate-pulse" />
    </div>;
  }

  if (!data?.length) {
    return <div className="h-full flex items-center justify-center text-gray-400 text-sm">
      Nenhum dado encontrado
    </div>;
  }

  return (
    <div className="h-full w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="PERIODO"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            formatter={v => v === 'RECEITA_LIQUIDA' ? 'Receita Líquida' : 'Faturamento Bruto'}
          />
          <Area
            type="monotone"
            dataKey="FATURAMENTO_BRUTO"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fill="url(#colorFaturamento)"
            dot={false}
            name="FATURAMENTO_BRUTO"
          />
          <Area
            type="monotone"
            dataKey="RECEITA"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#colorReceita)"
            dot={false}
            name="RECEITA_LIQUIDA"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default EvolucaoChart;
