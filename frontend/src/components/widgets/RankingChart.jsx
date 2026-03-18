// ============================================================
// components/widgets/RankingChart.jsx — VERSÃO MELHORADA
// Layout com valor em texto + barra de progresso (mais legível para diretor)
// ============================================================
'use client';

function formatCurrency(v) {
  if (!v && v !== 0) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
  }).format(v);
}

const RANK_COLORS = [
  '#f59e0b', // 1º - ouro
  '#9ca3af', // 2º - prata
  '#b45309', // 3º - bronze
  '#3b82f6', '#6366f1', '#8b5cf6',
  '#10b981', '#14b8a6', '#0891b2',
  '#ec4899', '#ef4444', '#f97316',
];

function RankBadge({ rank }) {
  const colors = {
    1: 'bg-amber-400 text-amber-900',
    2: 'bg-gray-300 text-gray-700',
    3: 'bg-orange-300 text-orange-800',
  };
  return (
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${
        colors[rank] || 'bg-gray-100 text-gray-500'
      }`}
    >
      {rank}
    </div>
  );
}

export function RankingChart({ data, loading, labelKey = 'VENDEDOR', limit = 10 }) {
  if (loading) {
    return (
      <div className="space-y-2.5 p-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-2.5 bg-gray-100 rounded animate-pulse" style={{ width: `${80 - i * 8}%` }} />
              <div className="h-1.5 bg-gray-50 rounded animate-pulse" style={{ width: `${70 - i * 8}%` }} />
            </div>
            <div className="w-14 h-3.5 bg-gray-100 rounded animate-pulse flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        Nenhum dado encontrado
      </div>
    );
  }

  const items   = data.slice(0, limit);
  const maxVal  = items[0]?.RECEITA || 1;

  return (
    <div className="h-full overflow-y-auto space-y-1.5 pr-1" style={{ scrollbarWidth: 'thin' }}>
      {items.map((d, i) => {
        const label    = (d[labelKey] || '').split(' - ')[0];
        const receita  = Number(d.RECEITA) || 0;
        const pct      = (receita / maxVal) * 100;
        const color    = RANK_COLORS[i] || '#9ca3af';

        return (
          <div key={i} className="group flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <RankBadge rank={i + 1} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-800 truncate" title={label}>
                  {label}
                </span>
                <span className="text-xs font-bold text-gray-700 flex-shrink-0 tabular-nums">
                  {formatCurrency(receita)}
                </span>
              </div>

              {/* Barra de progresso */}
              <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>

              {/* Sub-info */}
              <div className="flex gap-3 mt-0.5">
                {d.PEDIDOS != null && (
                  <span className="text-[10px] text-gray-400">
                    {d.PEDIDOS} pedido{d.PEDIDOS !== 1 ? 's' : ''}
                  </span>
                )}
                {d.CLIENTES != null && (
                  <span className="text-[10px] text-gray-400">
                    {d.CLIENTES} cliente{d.CLIENTES !== 1 ? 's' : ''}
                  </span>
                )}
                {d.DESCONTO_MEDIO != null && (
                  <span className={`text-[10px] font-medium ${
                    d.DESCONTO_MEDIO > 20 ? 'text-red-500'
                    : d.DESCONTO_MEDIO > 10 ? 'text-amber-500'
                    : 'text-emerald-500'
                  }`}>
                    {d.DESCONTO_MEDIO}% desc.
                  </span>
                )}
                {d.PARTICIPACAO_PERC != null && (
                  <span className="text-[10px] text-gray-400">
                    {d.PARTICIPACAO_PERC}% do total
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RankingChart;