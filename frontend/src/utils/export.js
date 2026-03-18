// ============================================================
// utils/export.js
// Exportação para Excel (.xlsx via SheetJS) e PDF (print)
// ============================================================

// ── Excel ────────────────────────────────────────────────────
export async function exportToExcel(data, filename = 'dashboard-vendas') {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  function addSheet(name, rows) {
    if (!rows?.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    // Largura automática das colunas
    const cols = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length, 12) }));
    ws['!cols'] = cols;
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  if (data.kpis) {
    addSheet('KPIs', [{
      'Receita Líquida':    fmtN(data.kpis.RECEITA_LIQUIDA),
      'Faturamento Bruto':  fmtN(data.kpis.FATURAMENTO_BRUTO),
      'Ticket Médio':       fmtN(data.kpis.TICKET_MEDIO),
      'Clientes Únicos':    data.kpis.CLIENTES_UNICOS,
      'Total Pedidos':      data.kpis.TOTAL_PEDIDOS,
      'Desconto Médio (%)': data.kpis.DESCONTO_MEDIO,
      'Valor Bloqueado':    fmtN(data.kpis.VALOR_BLOQUEADO),
    }]);
  }

  if (data.vendedores?.length) {
    addSheet('Vendedores', data.vendedores.map(v => ({
      'Vendedor':        v.VENDEDOR,
      'Receita (R$)':   fmtN(v.RECEITA),
      'Pedidos':         v.PEDIDOS,
      'Clientes':        v.CLIENTES,
      'Desc. Médio (%)': v.DESCONTO_MEDIO,
      'Comissão (R$)':  fmtN(v.COMISSAO_TOTAL),
      'Bloqueado (R$)': fmtN(v.VALOR_BLOQUEADO),
    })));
  }

  if (data.clientes?.length) {
    addSheet('Clientes', data.clientes.map(c => ({
      'Código':        c.CLI,
      'Cliente':       c.CLIENTE,
      'UF':            c.UF,
      'Município':     c.MUNICIPIO,
      'Tipo':          c.TIPO,
      'Receita (R$)': fmtN(c.RECEITA),
      'Pedidos':       c.PEDIDOS,
      'Desc. (%)':     c.DESCONTO_MEDIO,
    })));
  }

  if (data.produtos?.length) {
    addSheet('Produtos', data.produtos.map(p => ({
      'Código':          p.ITEM,
      'Material':        p.MATERIAL,
      'Especificação':   p.ESPECIFICACAO,
      'Receita (R$)':   fmtN(p.RECEITA),
      'Quantidade':      p.QUANTIDADE,
      'Participação (%)': p.PARTICIPACAO_PERC,
    })));
  }

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}-${date}.xlsx`);
}

function fmtN(v) {
  return v != null ? Number(v).toFixed(2) : '';
}

// ── PDF via print ─────────────────────────────────────────────
export function exportToPDF() {
  window.print();
}
