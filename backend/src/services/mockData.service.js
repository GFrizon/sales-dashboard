// ============================================================
// services/mockData.service.js
// Dados realistas para testar o frontend sem banco Oracle
// Ative com MOCK_DB=true no .env
// ============================================================

const VENDEDORES = [
  'CARLOS HENRIQUE - V001', 'ANA PAULA - V002', 'ROBERTO SILVA - V003',
  'FERNANDA COSTA - V004', 'MARCELO SANTOS - V005', 'JULIANA LIMA - V006',
  'PEDRO ALVES - V007', 'CAMILA ROCHA - V008',
];
const CLIENTES = [
  'INDÚSTRIA METALÚRGICA ALFA LTDA', 'CONSTRUTORA BETA S.A.', 'DISTRIBUIDORA GAMMA ME',
  'GRUPO DELTA INDUSTRIAL', 'FÁBRICA EPSILON EIRELI', 'COMÉRCIO ZETA LTDA',
  'INDÚSTRIA ETA S.A.', 'TRANSPORTES THETA LTDA', 'SERVIÇOS IOTA ME',
  'PRODUTOS KAPPA S.A.',
];
const PRODUTOS = [
  'PARAFUSO 1/4 INOX', 'PORCA SEXTAVADA M8', 'ARRUELA PLANA 5/16',
  'CHAVE ALLEN 4MM', 'PINO CILÍNDRICO 6X20', 'REBITE POP 4.8X10',
  'MOLA COMPRESSÃO D3', 'ANEL DE VEDAÇÃO 12', 'BUCHA NYLON M6', 'ESPAÇADOR 10X5',
];
const UFS = ['SP', 'MG', 'RS', 'PR', 'SC', 'RJ', 'GO', 'MT'];

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

// ── KPIs ────────────────────────────────────────────────────
function getMockKpis() {
  return {
    RECEITA_LIQUIDA:    4_823_540.75,
    FATURAMENTO_BRUTO:  5_412_890.00,
    VALOR_DESCONTO:       589_349.25,
    VALOR_COMISSAO:       162_386.70,
    DESCONTO_MEDIO:            10.89,
    CLIENTES_UNICOS:             143,
    TOTAL_PEDIDOS:               512,
    TICKET_MEDIO:           9_420.20,
    VALOR_BLOQUEADO:       421_830.00,
    PERC_BLOQUEADO:              8.7,
  };
}

// ── Evolução mensal ─────────────────────────────────────────
function getMockEvolucao() {
  const meses = ['2024-01','2024-02','2024-03','2024-04','2024-05','2024-06',
                 '2024-07','2024-08','2024-09','2024-10','2024-11','2024-12'];
  return meses.map((m, i) => {
    const fat = rand(380_000, 620_000);
    const desc = rand(0.08, 0.14);
    return {
      PERIODO:          m,
      FATURAMENTO_BRUTO: Math.round(fat * 100) / 100,
      RECEITA:           Math.round(fat * (1 - desc) * 100) / 100,
      PEDIDOS:           randInt(35, 65),
    };
  });
}

// ── Ranking vendedores ───────────────────────────────────────
function getMockRankingVendedores() {
  return VENDEDORES.map((v, i) => {
    const receita = rand(200_000, 900_000) * (1 - i * 0.08);
    return {
      VENDEDOR:        v,
      RECEITA:         Math.round(receita * 100) / 100,
      FATURAMENTO:     Math.round(receita * 1.12 * 100) / 100,
      PEDIDOS:         randInt(20, 80),
      CLIENTES:        randInt(8, 30),
      DESCONTO_MEDIO:  Math.round(rand(6, 22) * 10) / 10,
      COMISSAO_TOTAL:  Math.round(receita * 0.03 * 100) / 100,
      VALOR_BLOQUEADO: Math.round(rand(5_000, 80_000) * 100) / 100,
    };
  }).sort((a, b) => b.RECEITA - a.RECEITA);
}

// ── Ranking clientes ─────────────────────────────────────────
function getMockRankingClientes() {
  return CLIENTES.map((c, i) => ({
    CLI:           `00${1000 + i}`,
    CLIENTE:       c,
    UF:            pick(UFS),
    MUNICIPIO:     'SÃO PAULO',
    TIPO:          pick(['INDUSTRIA', 'COMERCIO', 'SERVICOS']),
    RECEITA:       Math.round(rand(50_000, 650_000) * (1 - i * 0.07) * 100) / 100,
    PEDIDOS:       randInt(5, 40),
    DESCONTO_MEDIO: Math.round(rand(5, 18) * 10) / 10,
  })).sort((a, b) => b.RECEITA - a.RECEITA);
}

// ── Ranking produtos ─────────────────────────────────────────
function getMockRankingProdutos() {
  const total = 4_823_540.75;
  let acum = 0;
  return PRODUTOS.map((p, i) => {
    const rec = rand(100_000, 900_000) * (1 - i * 0.09);
    acum += rec;
    return {
      ITEM:         `MAT${String(i + 1).padStart(4, '0')}`,
      MATERIAL:     p,
      ESPECIFICACAO: 'ESPECIFICAÇÃO ' + (i + 1),
      RECEITA:      Math.round(rec * 100) / 100,
      QUANTIDADE:   randInt(200, 5000),
      PESO_TOTAL:   Math.round(rand(100, 2000) * 100) / 100,
      PARTICIPACAO_PERC: Math.round((rec / total) * 1000) / 10,
    };
  }).sort((a, b) => b.RECEITA - a.RECEITA);
}

// ── Status ───────────────────────────────────────────────────
function getMockStatus() {
  return [
    { STATUS: 'LIBERADO',  RECEITA: 4_401_710.75, PEDIDOS: 468, PERCENTUAL: 91.3 },
    { STATUS: 'BLOQUEADO', RECEITA:   421_830.00, PEDIDOS:  44, PERCENTUAL:  8.7 },
  ];
}

// ── Qualidade ────────────────────────────────────────────────
function getMockQualidade() {
  return [
    { QUALIDADE: 'SAUDAVEL', PEDIDOS: 312, RECEITA: 3_218_600.00, PERCENTUAL: 66.7 },
    { QUALIDADE: 'ATENCAO',  PEDIDOS: 156, RECEITA: 1_183_110.75, PERCENTUAL: 24.5 },
    { QUALIDADE: 'PROBLEMA', PEDIDOS:  44, RECEITA:   421_830.00, PERCENTUAL:  8.7 },
  ];
}

// ── Curva ABC ────────────────────────────────────────────────
function getMockCurvaABC() {
  const rows = getMockRankingProdutos();
  const total = rows.reduce((s, r) => s + r.RECEITA, 0);
  let acum = 0;
  return rows.map(r => {
    acum += r.RECEITA;
    const percAcum = (acum / total) * 100;
    return {
      ...r,
      PERC:      Math.round((r.RECEITA / total) * 1000) / 10,
      PERC_ACUM: Math.round(percAcum * 10) / 10,
      CURVA:     percAcum <= 80 ? 'A' : percAcum <= 95 ? 'B' : 'C',
    };
  });
}

// ── Opções de filtros ────────────────────────────────────────
function getMockFilterOptions() {
  return {
    vendedores: VENDEDORES.map(v => ({ value: v, label: v })),
    clientes:   CLIENTES.map((c, i) => ({ value: `00${1000 + i}`, label: c })),
    ufs:        UFS.map(u => ({ value: u, label: u })),
    materiais:  PRODUTOS.map((p, i) => ({ value: `MAT${String(i+1).padStart(4,'0')}`, label: p })),
    tipos:      ['INDUSTRIA','COMERCIO','SERVICOS'].map(t => ({ value: t, label: t })),
    controles:  ['LIBERADO','BLOQUEADO'].map(c => ({ value: c, label: c })),
    unegs:      ['01','02','03'].map(u => ({ value: u, label: `UNEG ${u}` })),
  };
}

module.exports = {
  getMockKpis,
  getMockEvolucao,
  getMockRankingVendedores,
  getMockRankingClientes,
  getMockRankingProdutos,
  getMockStatus,
  getMockQualidade,
  getMockCurvaABC,
  getMockFilterOptions,
};
