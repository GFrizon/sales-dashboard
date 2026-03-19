// ============================================================
// controllers/sales.controller.js — COM SUPORTE A MOCK
// ============================================================
const { query } = require('../config/database');
const { BASE_CTE, buildWhereClause } = require('../services/salesQuery.service');
const cache = require('../utils/cache');
const mock  = require('../services/mockData.service');

const IS_MOCK = process.env.MOCK_DB === 'true';
const SALES_CACHE_TTL = parseInt(process.env.SALES_CACHE_TTL_SEC || '86400', 10);

function getFilters(req) {
  return {
    dataInicio: req.query.dataInicio,
    dataFim:    req.query.dataFim,
    vendedor:   req.query.vendedor,
    cliente:    req.query.cliente,
    uf:         req.query.uf,
    material:   req.query.material,
    tipo:       req.query.tipo,
    controle:   req.query.controle,
    uneg:       req.query.uneg,
  };
}

function salesCacheKey(prefix, filters, extra = '') {
  return `${prefix}:${JSON.stringify(filters)}${extra ? `:${extra}` : ''}`;
}

// ── GET /api/sales/kpis ──────────────────────────────────────
exports.getKpis = async (req, res, next) => {
  try {
    if (IS_MOCK) return res.json(mock.getMockKpis());

    const filters = getFilters(req);
    const cacheKey = salesCacheKey('kpis', filters);
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const { whereClause, params } = buildWhereClause(filters);
    const sql = `
      ${BASE_CTE}
      SELECT
        ROUND(SUM(RECEITA_LIQUIDA), 2)                                                        AS "RECEITA_LIQUIDA",
        ROUND(SUM(FATURAMENTO_BRUTO), 2)                                                      AS "FATURAMENTO_BRUTO",
        ROUND(SUM(VALOR_DESCONTO), 2)                                                         AS "VALOR_DESCONTO",
        ROUND(SUM(VALOR_COMISSAO), 2)                                                         AS "VALOR_COMISSAO",
        ROUND(AVG(PE_DESCONTO), 2)                                                            AS "DESCONTO_MEDIO",
        COUNT(DISTINCT CLI)                                                                   AS "CLIENTES_UNICOS",
        COUNT(DISTINCT PEDIDO)                                                                AS "TOTAL_PEDIDOS",
        ROUND(SUM(RECEITA_LIQUIDA) / NULLIF(COUNT(DISTINCT PEDIDO), 0), 2)                   AS "TICKET_MEDIO",
        ROUND(SUM(CASE WHEN UPPER(CONTROLE) LIKE '%BLOQ%' THEN RECEITA_LIQUIDA ELSE 0 END), 2) AS "VALOR_BLOQUEADO",
        ROUND(SUM(CASE WHEN UPPER(CONTROLE) LIKE '%BLOQ%' THEN RECEITA_LIQUIDA ELSE 0 END)
              / NULLIF(SUM(RECEITA_LIQUIDA), 0) * 100, 1)                                    AS "PERC_BLOQUEADO"
      FROM BASE
      ${whereClause}
    `;
    const rows = await query(sql, params);
    const result = rows[0] || {};
    await cache.set(cacheKey, result, SALES_CACHE_TTL);
    res.json(result);
  } catch (err) { next(err); }
};

// ── GET /api/sales/evolucao ──────────────────────────────────
exports.getEvolucao = async (req, res, next) => {
  try {
    if (IS_MOCK) return res.json(mock.getMockEvolucao());

    const filters = getFilters(req);
    const agrupamento = req.query.agrupamento || 'MES';
    const cacheKey = salesCacheKey('evolucao', filters, agrupamento);
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);
    const { whereClause, params } = buildWhereClause(filters);
    const periodoExpr = agrupamento === 'DIA'
      ? `TO_CHAR(DATA, 'YYYY-MM-DD')`
      : agrupamento === 'ANO'
      ? `TO_CHAR(DATA, 'YYYY')`
      : `TO_CHAR(DATA, 'YYYY-MM')`;
    const sql = `
      ${BASE_CTE}
      SELECT
        ${periodoExpr}                        AS "PERIODO",
        ROUND(SUM(RECEITA_LIQUIDA), 2)        AS "RECEITA",
        ROUND(SUM(FATURAMENTO_BRUTO), 2)      AS "FATURAMENTO_BRUTO",
        COUNT(DISTINCT PEDIDO)               AS "PEDIDOS"
      FROM BASE
      ${whereClause}
      GROUP BY ${periodoExpr}
      ORDER BY 1
    `;
    const rows = await query(sql, params);
    await cache.set(cacheKey, rows, SALES_CACHE_TTL);
    res.json(rows);
  } catch (err) { next(err); }
};

// ── GET /api/sales/ranking/vendedores ────────────────────────
exports.getRankingVendedores = async (req, res, next) => {
  try {
    if (IS_MOCK) return res.json(mock.getMockRankingVendedores());

    const filters = getFilters(req);
    const limit = parseInt(req.query.limit) || 10;
    const cacheKey = salesCacheKey('ranking_vendedores', filters, String(limit));
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);
    const { whereClause, params } = buildWhereClause(filters);
    const sql = `
      ${BASE_CTE}
      SELECT
        REPRES                                                                                   AS "VENDEDOR",
        ROUND(SUM(RECEITA_LIQUIDA), 2)                                                           AS "RECEITA",
        ROUND(SUM(FATURAMENTO_BRUTO), 2)                                                         AS "FATURAMENTO",
        COUNT(DISTINCT PEDIDO)                                                                   AS "PEDIDOS",
        COUNT(DISTINCT CLI)                                                                      AS "CLIENTES",
        ROUND(AVG(PE_DESCONTO), 1)                                                               AS "DESCONTO_MEDIO",
        ROUND(SUM(VALOR_COMISSAO), 2)                                                            AS "COMISSAO_TOTAL",
        ROUND(SUM(CASE WHEN UPPER(CONTROLE) LIKE '%BLOQ%' THEN RECEITA_LIQUIDA ELSE 0 END), 2)  AS "VALOR_BLOQUEADO"
      FROM BASE
      ${whereClause}
      GROUP BY REPRES
      ORDER BY "RECEITA" DESC
      FETCH FIRST ${limit} ROWS ONLY
    `;
    const rows = await query(sql, params);
    await cache.set(cacheKey, rows, SALES_CACHE_TTL);
    res.json(rows);
  } catch (err) { next(err); }
};

// ── GET /api/sales/ranking/clientes ─────────────────────────
exports.getRankingClientes = async (req, res, next) => {
  try {
    if (IS_MOCK) return res.json(mock.getMockRankingClientes());

    const filters = getFilters(req);
    const limit = parseInt(req.query.limit) || 10;
    const cacheKey = salesCacheKey('ranking_clientes', filters, String(limit));
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);
    const { whereClause, params } = buildWhereClause(filters);
    const sql = `
      ${BASE_CTE}
      SELECT
        CLI, CLIENTE, UF, MUNICIPIO, TIPO,
        ROUND(SUM(RECEITA_LIQUIDA), 2)   AS "RECEITA",
        COUNT(DISTINCT PEDIDO)           AS "PEDIDOS",
        ROUND(AVG(PE_DESCONTO), 1)       AS "DESCONTO_MEDIO"
      FROM BASE
      ${whereClause}
      GROUP BY CLI, CLIENTE, UF, MUNICIPIO, TIPO
      ORDER BY "RECEITA" DESC
      FETCH FIRST ${limit} ROWS ONLY
    `;
    const rows = await query(sql, params);
    await cache.set(cacheKey, rows, SALES_CACHE_TTL);
    res.json(rows);
  } catch (err) { next(err); }
};

// ── GET /api/sales/ranking/produtos ─────────────────────────
exports.getRankingProdutos = async (req, res, next) => {
  try {
    if (IS_MOCK) return res.json(mock.getMockRankingProdutos());

    const filters = getFilters(req);
    const limit = parseInt(req.query.limit) || 15;
    const cacheKey = salesCacheKey('ranking_produtos', filters, String(limit));
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);
    const { whereClause, params } = buildWhereClause(filters);
    const sql = `
      ${BASE_CTE}
      SELECT
        ITEM, MATERIAL, ESPECIFICACAO,
        ROUND(SUM(RECEITA_LIQUIDA), 2)                                                          AS "RECEITA",
        SUM(QTDE)                                                                               AS "QUANTIDADE",
        ROUND(SUM(PESO * QTDE), 2)                                                              AS "PESO_TOTAL",
        ROUND(SUM(RECEITA_LIQUIDA) / NULLIF(SUM(SUM(RECEITA_LIQUIDA)) OVER (), 0) * 100, 2)   AS "PARTICIPACAO_PERC"
      FROM BASE
      ${whereClause}
      GROUP BY ITEM, MATERIAL, ESPECIFICACAO
      ORDER BY "RECEITA" DESC
      FETCH FIRST ${limit} ROWS ONLY
    `;
    const rows = await query(sql, params);
    await cache.set(cacheKey, rows, SALES_CACHE_TTL);
    res.json(rows);
  } catch (err) { next(err); }
};

// ── GET /api/sales/status ─────────────────────────────────────
exports.getStatusDistribuicao = async (req, res, next) => {
  try {
    if (IS_MOCK) return res.json(mock.getMockStatus());

    const filters = getFilters(req);
    const cacheKey = salesCacheKey('status', filters);
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);
    const { whereClause, params } = buildWhereClause(filters);
    const sql = `
      ${BASE_CTE}
      SELECT
        CONTROLE                                                                                  AS "STATUS",
        ROUND(SUM(RECEITA_LIQUIDA), 2)                                                            AS "RECEITA",
        COUNT(DISTINCT PEDIDO)                                                                    AS "PEDIDOS",
        ROUND(SUM(RECEITA_LIQUIDA) / NULLIF(SUM(SUM(RECEITA_LIQUIDA)) OVER (), 0) * 100, 1)     AS "PERCENTUAL"
      FROM BASE
      ${whereClause}
      GROUP BY CONTROLE
      ORDER BY "RECEITA" DESC
    `;
    const rows = await query(sql, params);
    await cache.set(cacheKey, rows, SALES_CACHE_TTL);
    res.json(rows);
  } catch (err) { next(err); }
};

// ── GET /api/sales/qualidade ──────────────────────────────────
exports.getQualidade = async (req, res, next) => {
  try {
    if (IS_MOCK) return res.json(mock.getMockQualidade());

    const filters = getFilters(req);
    const cacheKey = salesCacheKey('qualidade', filters);
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);
    const { whereClause, params } = buildWhereClause(filters);
    const sql = `
      ${BASE_CTE}
      SELECT
        QUALIDADE,
        COUNT(DISTINCT PEDIDO)                                                                   AS "PEDIDOS",
        ROUND(SUM(RECEITA_LIQUIDA), 2)                                                           AS "RECEITA",
        ROUND(SUM(RECEITA_LIQUIDA) / NULLIF(SUM(SUM(RECEITA_LIQUIDA)) OVER (), 0) * 100, 1)    AS "PERCENTUAL"
      FROM BASE
      ${whereClause}
      GROUP BY QUALIDADE
    `;
    const rows = await query(sql, params);
    await cache.set(cacheKey, rows, SALES_CACHE_TTL);
    res.json(rows);
  } catch (err) { next(err); }
};

// ── GET /api/sales/curva-abc ──────────────────────────────────
exports.getCurvaABC = async (req, res, next) => {
  try {
    if (IS_MOCK) return res.json(mock.getMockCurvaABC());

    const filters = getFilters(req);
    const cacheKey = salesCacheKey('curva_abc', filters);
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);
    const { whereClause, params } = buildWhereClause(filters);
    const sql = `
      ${BASE_CTE},
      RANKED AS (
        SELECT
          ITEM, MATERIAL,
          ROUND(SUM(RECEITA_LIQUIDA), 2)                                                              AS RECEITA,
          ROUND(SUM(RECEITA_LIQUIDA) / SUM(SUM(RECEITA_LIQUIDA)) OVER () * 100, 2)                  AS PERC,
          SUM(SUM(RECEITA_LIQUIDA)) OVER (ORDER BY SUM(RECEITA_LIQUIDA) DESC
            ROWS UNBOUNDED PRECEDING) / SUM(SUM(RECEITA_LIQUIDA)) OVER () * 100                     AS PERC_ACUM
        FROM BASE
        ${whereClause}
        GROUP BY ITEM, MATERIAL
      )
      SELECT
        ITEM, MATERIAL,
        RECEITA, PERC,
        ROUND(PERC_ACUM, 1) AS "PERC_ACUM",
        CASE WHEN PERC_ACUM <= 80 THEN 'A' WHEN PERC_ACUM <= 95 THEN 'B' ELSE 'C' END AS "CURVA"
      FROM RANKED
      ORDER BY RECEITA DESC
    `;
    const rows = await query(sql, params);
    await cache.set(cacheKey, rows, SALES_CACHE_TTL);
    res.json(rows);
  } catch (err) { next(err); }
};

// ── GET /api/sales/export ─────────────────────────────────────
// Retorna dados brutos para exportação Excel (todos os campos)
exports.getExportData = async (req, res, next) => {
  try {
    const filters = getFilters(req);
    if (IS_MOCK) {
      return res.json({
        vendedores: mock.getMockRankingVendedores(),
        clientes:   mock.getMockRankingClientes(),
        produtos:   mock.getMockRankingProdutos(),
        kpis:       mock.getMockKpis(),
      });
    }
    const { whereClause, params } = buildWhereClause(filters);
    const sql = `
      ${BASE_CTE}
      SELECT
        UNEG, PEDIDO, REPRES AS VENDEDOR, CLIENTE, CNPJ, UF, MUNICIPIO, CLI,
        TO_CHAR(DATA, 'DD/MM/YYYY') AS DATA,
        ITEM, MATERIAL, ESPECIFICACAO, QTDE, PRECO,
        ROUND(FATURAMENTO_BRUTO, 2) AS FATURAMENTO_BRUTO,
        PE_DESCONTO, ROUND(VALOR_DESCONTO, 2) AS VALOR_DESCONTO,
        ROUND(RECEITA_LIQUIDA, 2) AS RECEITA_LIQUIDA,
        PE_COMISSAO, ROUND(VALOR_COMISSAO, 2) AS VALOR_COMISSAO,
        CONTROLE, QUALIDADE, TIPO, CONSULTOR
      FROM BASE
      ${whereClause}
      ORDER BY DATA DESC, PEDIDO, ITEM
    `;
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};
