// ============================================================
// components/widgets/StatusChart.jsx
// Pizza / Donut — status e qualidade de vendas
// ============================================================
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const STATUS_COLORS = {
  LIBERADO:  '#10b981',
  BLOQUEADO: '#ef4444',
  SAUDAVEL:  '#10b981',
  ATENCAO:   '#f59e0b',
  PROBLEMA:  '#ef4444',
};

const DEFAULT_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1
  }).format(v);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold mb-1">{d.name}</p>
      <p className="text-gray-600">Receita: <span className="font-medium">{formatCurrency(d.value)}</span></p>
      <p className="text-gray-600">Participação: <span className="font-medium">{d.payload.PERCENTUAL}%</span></p>
    </div>
  );
};

export function StatusChart({ data, loading, labelKey = 'STATUS' }) {
  if (loading) {
    return <div className="h-full flex items-center justify-center">
      <div className="w-32 h-32 rounded-full bg-gray-100 animate-pulse" />
    </div>;
  }

  if (!data?.length) {
    return <div className="h-full flex items-center justify-center text-gray-400 text-sm">
      Nenhum dado
    </div>;
  }

  const formatted = data.map((d, i) => ({
    name: d[labelKey] || d.QUALIDADE || d.CONTROLE,
    value: d.RECEITA,
    PERCENTUAL: d.PERCENTUAL,
    fill: STATUS_COLORS[d[labelKey]] || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={formatted}
            cx="50%"
            cy="45%"
            innerRadius="50%"
            outerRadius="70%"
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {formatted.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StatusChart;
