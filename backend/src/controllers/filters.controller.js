// ============================================================
// controllers/filters.controller.js — COM SUPORTE A MOCK
// ============================================================
const { query } = require('../config/database');
const { BASE_CTE } = require('../services/salesQuery.service');
const cache = require('../utils/cache');
const mock  = require('../services/mockData.service');

const IS_MOCK = process.env.MOCK_DB === 'true';

exports.getFilterOptions = async (req, res, next) => {
  try {
    if (IS_MOCK) return res.json(mock.getMockFilterOptions());

    const cached = cache.get('filter_options');
    if (cached) return res.json(cached);

    const [vendedores, clientes, ufs, materiais, tipos, controles, unegs] = await Promise.all([
      query(`${BASE_CTE} SELECT DISTINCT REPRES AS "value", REPRES AS "label" FROM BASE ORDER BY 1`),
      query(`${BASE_CTE} SELECT DISTINCT CLI AS "value", CLIENTE AS "label" FROM BASE ORDER BY 2`),
      query(`${BASE_CTE} SELECT DISTINCT UF AS "value", UF AS "label" FROM BASE WHERE UF IS NOT NULL ORDER BY 1`),
      query(`${BASE_CTE} SELECT DISTINCT ITEM AS "value", MATERIAL AS "label" FROM BASE ORDER BY 2`),
      query(`${BASE_CTE} SELECT DISTINCT TIPO AS "value", TIPO AS "label" FROM BASE WHERE TIPO IS NOT NULL ORDER BY 1`),
      query(`${BASE_CTE} SELECT DISTINCT CONTROLE AS "value", CONTROLE AS "label" FROM BASE ORDER BY 1`),
      query(`${BASE_CTE} SELECT DISTINCT UNEG AS "value", UNEG AS "label" FROM BASE ORDER BY 1`),
    ]);

    const result = { vendedores, clientes, ufs, materiais, tipos, controles, unegs };
    cache.set('filter_options', result, 600);
    res.json(result);
  } catch (err) { next(err); }
};
