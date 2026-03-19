const { query } = require('../config/database');
const { BASE_CTE, buildWhereClause } = require('../services/salesQuery.service');
const hierSvc = require('../services/hierarquia.service');
const cache = require('../utils/cache');

const SALES_CACHE_TTL = parseInt(process.env.SALES_CACHE_TTL_SEC || '86400', 10);
const FILTER_CACHE_TTL = parseInt(process.env.FILTER_CACHE_TTL_SEC || '86400', 10);
const HIER_RESUMO_TTL = parseInt(process.env.HIER_RESUMO_TTL_SEC || '86400', 10);
const HIER_CONS_TTL = parseInt(process.env.HIER_CONS_TTL_SEC || '86400', 10);

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function defaultFilters() {
  const y = new Date().getFullYear();
  return {
    dataInicio: `${y}-01-01`,
    dataFim: todayIso(),
    vendedor: '',
    cliente: '',
    uf: '',
    material: '',
    tipo: '',
    controle: '',
    uneg: '',
  };
}

function salesCacheKey(prefix, filters, extra = '') {
  return `${prefix}:${JSON.stringify(filters)}${extra ? `:${extra}` : ''}`;
}

function hierCacheKey(prefix, params = {}) {
  const sorted = Object.keys(params)
    .sort()
    .filter(k => params[k])
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return sorted ? `${prefix}:${sorted}` : prefix;
}

async function warmFilters(filters = {}) {
  const { whereClause, params } = buildWhereClause(filters);
  const [vendedores, clientes, ufs, materiais, tipos, controles, unegs] = await Promise.all([
    query(`${BASE_CTE} SELECT DISTINCT REPRES AS "value", REPRES AS "label" FROM BASE ${whereClause} ORDER BY 1`, { ...params }),
    query(`${BASE_CTE} SELECT DISTINCT CLI AS "value", CLIENTE AS "label" FROM BASE ${whereClause} ORDER BY 2`, { ...params }),
    query(`${BASE_CTE} SELECT DISTINCT UF AS "value", UF AS "label" FROM BASE ${whereClause} ${whereClause ? 'AND' : 'WHERE'} UF IS NOT NULL ORDER BY 1`, { ...params }),
    query(`${BASE_CTE} SELECT DISTINCT ITEM AS "value", MATERIAL AS "label" FROM BASE ${whereClause} ORDER BY 2`, { ...params }),
    query(`${BASE_CTE} SELECT DISTINCT TIPO AS "value", TIPO AS "label" FROM BASE ${whereClause} ${whereClause ? 'AND' : 'WHERE'} TIPO IS NOT NULL ORDER BY 1`, { ...params }),
    query(`${BASE_CTE} SELECT DISTINCT CONTROLE AS "value", CONTROLE AS "label" FROM BASE ${whereClause} ORDER BY 1`, { ...params }),
    query(`${BASE_CTE} SELECT DISTINCT UNEG AS "value", UNEG AS "label" FROM BASE ${whereClause} ORDER BY 1`, { ...params }),
  ]);
  await cache.set(`filter_options:${JSON.stringify(filters)}`, { vendedores, clientes, ufs, materiais, tipos, controles, unegs }, FILTER_CACHE_TTL);
}

async function warmSales(filters) {
  const { whereClause, params } = buildWhereClause(filters);

  const kpiSql = `
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
  const kpis = (await query(kpiSql, params))[0] || {};
  await cache.set(salesCacheKey('kpis', filters), kpis, SALES_CACHE_TTL);

  const evoSql = `
    ${BASE_CTE}
    SELECT
      TO_CHAR(DATA, 'YYYY-MM')                  AS "PERIODO",
      ROUND(SUM(RECEITA_LIQUIDA), 2)            AS "RECEITA",
      ROUND(SUM(FATURAMENTO_BRUTO), 2)          AS "FATURAMENTO_BRUTO",
      COUNT(DISTINCT PEDIDO)                    AS "PEDIDOS"
    FROM BASE
    ${whereClause}
    GROUP BY TO_CHAR(DATA, 'YYYY-MM')
    ORDER BY 1
  `;
  await cache.set(salesCacheKey('evolucao', filters, 'MES'), await query(evoSql, params), SALES_CACHE_TTL);

  const vendSql = `
    ${BASE_CTE}
    SELECT
      REPRES AS "VENDEDOR",
      ROUND(SUM(RECEITA_LIQUIDA), 2)            AS "RECEITA",
      ROUND(SUM(FATURAMENTO_BRUTO), 2)          AS "FATURAMENTO",
      COUNT(DISTINCT PEDIDO)                    AS "PEDIDOS",
      COUNT(DISTINCT CLI)                       AS "CLIENTES",
      ROUND(AVG(PE_DESCONTO), 1)                AS "DESCONTO_MEDIO",
      ROUND(SUM(VALOR_COMISSAO), 2)             AS "COMISSAO_TOTAL",
      ROUND(SUM(CASE WHEN UPPER(CONTROLE) LIKE '%BLOQ%' THEN RECEITA_LIQUIDA ELSE 0 END), 2) AS "VALOR_BLOQUEADO"
    FROM BASE
    ${whereClause}
    GROUP BY REPRES
    ORDER BY "RECEITA" DESC
    FETCH FIRST 10 ROWS ONLY
  `;
  await cache.set(salesCacheKey('ranking_vendedores', filters, '10'), await query(vendSql, params), SALES_CACHE_TTL);

  const cliSql = `
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
    FETCH FIRST 10 ROWS ONLY
  `;
  await cache.set(salesCacheKey('ranking_clientes', filters, '10'), await query(cliSql, params), SALES_CACHE_TTL);

  const prodSql = `
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
    FETCH FIRST 15 ROWS ONLY
  `;
  await cache.set(salesCacheKey('ranking_produtos', filters, '15'), await query(prodSql, params), SALES_CACHE_TTL);

  const statusSql = `
    ${BASE_CTE}
    SELECT
      CONTROLE                                                                                 AS "STATUS",
      ROUND(SUM(RECEITA_LIQUIDA), 2)                                                          AS "RECEITA",
      COUNT(DISTINCT PEDIDO)                                                                   AS "PEDIDOS",
      ROUND(SUM(RECEITA_LIQUIDA) / NULLIF(SUM(SUM(RECEITA_LIQUIDA)) OVER (), 0) * 100, 1)   AS "PERCENTUAL"
    FROM BASE
    ${whereClause}
    GROUP BY CONTROLE
    ORDER BY "RECEITA" DESC
  `;
  await cache.set(salesCacheKey('status', filters), await query(statusSql, params), SALES_CACHE_TTL);

  const qualidadeSql = `
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
  await cache.set(salesCacheKey('qualidade', filters), await query(qualidadeSql, params), SALES_CACHE_TTL);

  const abcSql = `
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
  await cache.set(salesCacheKey('curva_abc', filters), await query(abcSql, params), SALES_CACHE_TTL);
}

async function warmHier(filters) {
  const resumo = await hierSvc.getResumo(filters);
  const consultores = await hierSvc.getConsultores(filters);
  await cache.set(hierCacheKey('hier:resumo', filters), resumo, HIER_RESUMO_TTL);
  await cache.set(hierCacheKey('hier:cons', filters), consultores, HIER_CONS_TTL);
}

async function warmAllNow(reason = 'manual') {
  const started = Date.now();
  const filters = defaultFilters();
  await Promise.all([
    warmFilters(filters),
    warmSales(filters),
    warmHier(filters),
  ]);
  return {
    ok: true,
    reason,
    tookMs: Date.now() - started,
    filters,
  };
}

let timer = null;

function scheduleDailyWarmup() {
  const enabled = process.env.CACHE_PREWARM_ENABLED !== 'false';
  if (!enabled) return;

  const hour = parseInt(process.env.CACHE_PREWARM_HOUR || '5', 10);
  const minute = parseInt(process.env.CACHE_PREWARM_MINUTE || '0', 10);

  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next.getTime() - now.getTime();

  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      const info = await warmAllNow('daily');
      console.log(`[cache-warmer] warmup daily concluido em ${info.tookMs}ms`);
    } catch (err) {
      console.error('[cache-warmer] warmup daily falhou:', err.message);
    } finally {
      scheduleDailyWarmup();
    }
  }, delay);

  console.log(`[cache-warmer] proximo aquecimento em ${next.toISOString()}`);
}

async function runStartupWarmup() {
  const enabled = process.env.CACHE_PREWARM_ENABLED !== 'false';
  if (!enabled) return;
  if (process.env.CACHE_PREWARM_ON_START === 'false') return;
  try {
    const info = await warmAllNow('startup');
    console.log(`[cache-warmer] warmup startup concluido em ${info.tookMs}ms`);
  } catch (err) {
    console.error('[cache-warmer] warmup startup falhou:', err.message);
  }
}

module.exports = {
  warmAllNow,
  scheduleDailyWarmup,
  runStartupWarmup,
};
