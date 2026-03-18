// ============================================================
// components/widgets/StatusChart.jsx — VERSÃO CORRIGIDA
// Correções:
//   - Agrupa status com poucos itens em "Outros"
//   - Limita a 5 fatias máximo
//   - Layout limpo com legenda lateral e total central
//   - Cores semânticas (verde=ok, vermelho=problema, etc.)
// ============================================================
'use client';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

// Mapeamento semântico de cores por palavra-chave no status
function getStatusColor(label = '', index = 0) {
  const l = label.toUpperCase();
  if (l.includes('LIBERA') || l.includes('SAUDAV') || l.includes('OK') || l.includes('ATIVO')) return '#10b981';
  if (l.includes('BLOQ') || l.includes('PROBLEMA') || l.includes('CANCEL') || l.includes('PEND')) return '#ef4444';
  if (l.includes('ATEN') || l.includes('REVIS') || l.includes('AGUARD')) return '#f59e0b';
  if (l.includes('ENTREGUE') || l.includes('FATURA') || l.includes('CONCLU')) return '#3b82f6';
  if (l.includes('OUTROS')) return '#9ca3af';

  const PALETTE = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];
  return PALETTE[index % PALETTE.length];
}

function formatCurrency(v) {
  if (!v && v !== 0) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
  }).format(v);
}

function formatPercent(v) {
  return `${Number(v || 0).toFixed(1)}%`;
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-gray-900 text-white rounded-lg shadow-xl p-3 text-xs min-w-[160px]">
      <p className="font-semibold mb-1.5 truncate">{d.name}</p>
      <div className="space-y-1 text-gray-300">
        <div className="flex justify-between gap-4">
          <span>Receita</span>
          <span className="font-medium text-white">{formatCurrency(d.value)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Participação</span>
          <span className="font-medium text-white">{formatPercent(d.PERCENTUAL)}</span>
        </div>
        {d.PEDIDOS && (
          <div className="flex justify-between gap-4">
            <span>Pedidos</span>
            <span className="font-medium text-white">{d.PEDIDOS}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Label central do donut
function CenterLabel({ cx, cy, total, subtitle }) {
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" className="text-gray-900">
        <tspan fontSize="18" fontWeight="700" fill="#111827">{formatCurrency(total)}</tspan>
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle">
        <tspan fontSize="10" fill="#9ca3af">{subtitle}</tspan>
      </text>
    </g>
  );
}

export function StatusChart({ data, loading, labelKey = 'STATUS', title = 'Receita por Status' }) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-28 h-28 rounded-full border-8 border-gray-100 border-t-gray-200 animate-spin" />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
        <div className="w-16 h-16 rounded-full border-4 border-dashed border-gray-200" />
        <span className="text-xs">Sem dados para exibir</span>
      </div>
    );
  }

  // Normalizar e ordenar por receita
  const normalized = data
    .map(d => ({
      name: d[labelKey] || d.QUALIDADE || d.CONTROLE || d.STATUS || 'Desconhecido',
      value: Number(d.RECEITA) || 0,
      PERCENTUAL: d.PERCENTUAL,
      PEDIDOS: d.PEDIDOS,
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Limitar a 4 items + "Outros" se necessário
  const MAX_SLICES = 5;
  let slices;

  if (normalized.length <= MAX_SLICES) {
    slices = normalized;
  } else {
    const top = normalized.slice(0, MAX_SLICES - 1);
    const rest = normalized.slice(MAX_SLICES - 1);
    const outrosTotal = rest.reduce((s, d) => s + d.value, 0);
    const totalGeral  = normalized.reduce((s, d) => s + d.value, 0);
    slices = [
      ...top,
      {
        name: 'Outros',
        value: outrosTotal,
        PERCENTUAL: ((outrosTotal / totalGeral) * 100).toFixed(1),
        PEDIDOS: rest.reduce((s, d) => s + (d.PEDIDOS || 0), 0),
      },
    ];
  }

  // Recalcular percentuais sobre total real
  const total = slices.reduce((s, d) => s + d.value, 0);
  const finalSlices = slices.map((d, i) => ({
    ...d,
    PERCENTUAL: total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0',
    color: getStatusColor(d.name, i),
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center">
        {/* Donut */}
        <div className="flex-shrink-0" style={{ width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={finalSlices}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={64}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {finalSlices.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {/* Centro manual */}
              <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle">
                <tspan x="50%" fontSize="15" fontWeight="700" fill="#111827">
                  {formatCurrency(total).replace('R$', '').trim()}
                </tspan>
              </text>
              <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle">
                <tspan x="50%" fontSize="9" fill="#9ca3af">total</tspan>
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda lateral */}
        <div className="flex-1 ml-3 space-y-1.5 overflow-hidden">
          {finalSlices.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-medium text-gray-700 truncate" title={d.name}>
                    {d.name}
                  </span>
                  <span className="text-[11px] font-bold text-gray-800 flex-shrink-0">
                    {formatPercent(d.PERCENTUAL)}
                  </span>
                </div>
                {/* Barra de progresso */}
                <div className="h-1 bg-gray-100 rounded-full mt-0.5">
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{ width: `${d.PERCENTUAL}%`, backgroundColor: d.color }}
                  />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {formatCurrency(d.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatusChart;