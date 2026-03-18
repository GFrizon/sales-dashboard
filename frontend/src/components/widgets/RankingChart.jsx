// ============================================================
// components/widgets/RankingChart.jsx
// Gráfico de barras horizontal para rankings (vendedores/clientes/produtos)
// ============================================================
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell
} from 'recharts';

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1
  }).format(v);
}

// Cores do pódio → gradiente suave
const BAR_COLORS = [
  '#10b981', '#34d399', '#6ee7b7',
  '#3b82f6', '#60a5fa', '#93c5fd',
  '#8b5cf6', '#a78bfa', '#c4b5fd',
  '#f59e0b',
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs max-w-xs">
      <p className="font-semibold text-gray-800 mb-1 truncate">{d?.VENDEDOR || d?.CLIENTE || d?.MATERIAL}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Receita:</span>
          <span className="font-medium text-emerald-600">{formatCurrency(d?.RECEITA)}</span>
        </div>
        {d?.PEDIDOS && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Pedidos:</span>
            <span className="font-medium">{d.PEDIDOS}</span>
          </div>
        )}
        {d?.DESCONTO_MEDIO != null && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Desc. médio:</span>
            <span className={`font-medium ${d.DESCONTO_MEDIO > 20 ? 'text-red-600' : d.DESCONTO_MEDIO > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {d.DESCONTO_MEDIO}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export function RankingChart({ data, loading, labelKey = 'VENDEDOR', valueKey = 'RECEITA', limit = 8 }) {
  if (loading) {
    return <div className="space-y-2 p-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" style={{ width: `${85 - i * 10}%` }} />
      ))}
    </div>;
  }

  if (!data?.length) {
    return <div className="h-full flex items-center justify-center text-gray-400 text-sm">
      Nenhum dado encontrado
    </div>;
  }

  // Truncar nome para caber no label
  const formatted = data.slice(0, limit).map(d => ({
    ...d,
    _label: (d[labelKey] || '').split(' - ')[0].substring(0, 20),
  }));

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formatted}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis
            type="number"
            tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="_label"
            tick={{ fontSize: 11, fill: '#374151' }}
            width={120}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
          <Bar dataKey={valueKey} radius={[0, 4, 4, 0]} maxBarSize={24}>
            {formatted.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RankingChart;
