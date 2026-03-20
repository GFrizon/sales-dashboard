// ============================================================
// controllers/hierarquia.controller.js
// TTLs de cache por nivel:
//   Consultores / Resumo  -> 5 min   (dados agregados, leves)
//   Representantes        -> 5 min
//   Clientes              -> 5 min
//   Pedidos               -> 10 min  (lista de pedidos, muda pouco)
//   Itens                 -> 30 min  (item de pedido fechado = imutavel)
// ============================================================
const svc   = require('../services/hierarquia.service');
const cache = require('../utils/cache');
const HIER_RESUMO_TTL = parseInt(process.env.HIER_RESUMO_TTL_SEC || '86400', 10);
const HIER_CONS_TTL = parseInt(process.env.HIER_CONS_TTL_SEC || '86400', 10);
const HIER_REPS_TTL = parseInt(process.env.HIER_REPS_TTL_SEC || '43200', 10);
const HIER_CLIS_TTL = parseInt(process.env.HIER_CLIS_TTL_SEC || '43200', 10);
const HIER_PEDS_TTL = parseInt(process.env.HIER_PEDS_TTL_SEC || '43200', 10);
const HIER_ITENS_TTL = parseInt(process.env.HIER_ITENS_TTL_SEC || '86400', 10);

// Gera chave de cache estavel a partir dos query params
function cacheKey(prefix, params = {}) {
  const sorted = Object.keys(params)
    .sort()
    .filter(k => params[k])
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return sorted ? `${prefix}:${sorted}` : prefix;
}

// Extrai os filtros globais do request (periodo, UF, etc.)
function globalFilters(req) {
  const { dataInicio, dataFim, vendedor, cliente, uf, material, tipo, controle, uneg } = req.query;
  return { dataInicio, dataFim, vendedor, cliente, uf, material, tipo, controle, uneg };
}

// GET /api/hierarquia/resumo
exports.resumo = async (req, res, next) => {
  try {
    const filters = globalFilters(req);
    const key = cacheKey('hier:resumo', filters);
    const hit = await cache.get(key);
    if (hit) return res.json({ ...hit, _cache: true });

    const data = await svc.getResumo(filters);
    await cache.set(key, data, HIER_RESUMO_TTL);
    res.json(data);
  } catch (err) { next(err); }
};

// GET /api/hierarquia/consultores
exports.consultores = async (req, res, next) => {
  try {
    const filters = globalFilters(req);
    const key = cacheKey('hier:cons', filters);
    const hit = await cache.get(key);
    if (hit) return res.json({ rows: hit, _cache: true });

    const rows = await svc.getConsultores(filters);
    await cache.set(key, rows, HIER_CONS_TTL);
    res.json({ rows });
  } catch (err) { next(err); }
};

// GET /api/hierarquia/consultores/:id/representantes
exports.representantes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filters = globalFilters(req);
    const key = cacheKey(`hier:reps:${id}`, filters);
    const hit = await cache.get(key);
    if (hit) return res.json({ rows: hit, _cache: true });

    const rows = await svc.getRepresentantes(id, filters);
    await cache.set(key, rows, HIER_REPS_TTL);
    res.json({ rows });
  } catch (err) { next(err); }
};

// GET /api/hierarquia/representantes/:id/clientes
exports.clientes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filters = globalFilters(req);
    const key = cacheKey(`hier:clis:${id}`, filters);
    const hit = await cache.get(key);
    if (hit) return res.json({ rows: hit, _cache: true });

    const rows = await svc.getClientes(id, filters);
    await cache.set(key, rows, HIER_CLIS_TTL);
    res.json({ rows });
  } catch (err) { next(err); }
};

// GET /api/hierarquia/clientes/:id/pedidos
exports.pedidos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filters = globalFilters(req);
    const key = cacheKey(`hier:peds:${id}`, filters);
    const hit = await cache.get(key);
    if (hit) return res.json({ rows: hit, _cache: true });

    const rows = await svc.getPedidos(id, filters);
    await cache.set(key, rows, HIER_PEDS_TTL); // pedidos mudam menos
    res.json({ rows });
  } catch (err) { next(err); }
};

// GET /api/hierarquia/pedidos/:id/itens
exports.itens = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { uneg } = req.query;
    const key = `hier:itens:${id}${uneg ? `:${uneg}` : ''}`;
    const hit = await cache.get(key);
    if (hit) return res.json({ rows: hit, _cache: true });

    const rows = await svc.getItens(id, uneg);
    await cache.set(key, rows, HIER_ITENS_TTL); // itens de pedido fechado sao imutaveis
    res.json({ rows });
  } catch (err) { next(err); }
};

// DELETE /api/hierarquia/cache - invalida cache (admin)
exports.invalidateCache = async (req, res, next) => {
  try {
    await cache.flushPrefix('hier:');
    res.json({ ok: true, message: 'Cache da hierarquia limpo.' });
  } catch (err) { next(err); }
};

