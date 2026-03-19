const TYPE_LABELS = {
  R: 'Revenda',
  C: 'Consumo',
  I: 'Inscrito',
  S: 'Simples Nacional',
  T: 'Construtora',
};

export const fmtBRL = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0);

export const fmtFull = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const fmtPct = (value) => `${(+value || 0).toFixed(1)}%`;

export const fmtPMK = (value) => `R$\u202f${(+value || 0).toFixed(2)}/kg`;

export function tipoLabel(tipo) {
  const normalized = String(tipo || '').trim().toUpperCase();
  return TYPE_LABELS[normalized] || String(tipo || '').trim() || 'N/D';
}

