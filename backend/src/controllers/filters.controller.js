// ============================================================
// controllers/filters.controller.js — COM SUPORTE A MOCK
// ============================================================
const { query } = require('../config/database');
const { BASE_CTE, buildWhereClause } = require('../services/salesQuery.service');
const cache = require('../utils/cache');
const mock  = require('../services/mockData.service');

const IS_MOCK = process.env.MOCK_DB === 'true';
const FILTER_CACHE_TTL = parseInt(process.env.FILTER_CACHE_TTL_SEC || '86400', 10);

exports.getFilterOptions = async (req, res, next) => {
  try {
    if (IS_MOCK) return res.json(mock.getMockFilterOptions());

    const filters = {
      dataInicio: req.query.dataInicio,
      dataFim: req.query.dataFim,
      vendedor: req.query.vendedor,
      cliente: req.query.cliente,
      uf: req.query.uf,
      material: req.query.material,
      tipo: req.query.tipo,
      controle: req.query.controle,
      uneg: req.query.uneg,
    };
    const { whereClause, params } = buildWhereClause(filters);
    const cacheKey = `filter_options:${JSON.stringify(filters)}`;

    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const [vendedores, clientes, ufs, materiais, tipos, controles, unegs] = await Promise.all([
      query(`${BASE_CTE} SELECT DISTINCT REPRES AS "value", REPRES AS "label" FROM BASE ${whereClause} ORDER BY 1`, { ...params }),
      query(`${BASE_CTE} SELECT DISTINCT CLI AS "value", CLIENTE AS "label" FROM BASE ${whereClause} ORDER BY 2`, { ...params }),
      query(`${BASE_CTE} SELECT DISTINCT UF AS "value", UF AS "label" FROM BASE ${whereClause} ${whereClause ? 'AND' : 'WHERE'} UF IS NOT NULL ORDER BY 1`, { ...params }),
      query(`${BASE_CTE} SELECT DISTINCT ITEM AS "value", MATERIAL AS "label" FROM BASE ${whereClause} ORDER BY 2`, { ...params }),
      query(`${BASE_CTE} SELECT DISTINCT TIPO AS "value", TIPO AS "label" FROM BASE ${whereClause} ${whereClause ? 'AND' : 'WHERE'} TIPO IS NOT NULL ORDER BY 1`, { ...params }),
      query(`${BASE_CTE} SELECT DISTINCT CONTROLE AS "value", CONTROLE AS "label" FROM BASE ${whereClause} ORDER BY 1`, { ...params }),
      query(`${BASE_CTE} SELECT DISTINCT UNEG AS "value", UNEG AS "label" FROM BASE ${whereClause} ORDER BY 1`, { ...params }),
    ]);

    const result = { vendedores, clientes, ufs, materiais, tipos, controles, unegs };
    await cache.set(cacheKey, result, FILTER_CACHE_TTL);
    res.json(result);
  } catch (err) { next(err); }
};
