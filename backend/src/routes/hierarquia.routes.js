// ============================================================
// routes/hierarquia.routes.js
// ============================================================
const router = require('express').Router();
const ctrl   = require('../controllers/hierarquia.controller');

// Resumo geral (KPI cards do topo)
router.get('/resumo',                                  ctrl.resumo);

// Nível 0 — Consultores
router.get('/consultores',                             ctrl.consultores);

// Nível 1 — Representantes de um consultor
router.get('/consultores/:id/representantes',          ctrl.representantes);

// Nível 2 — Clientes de um representante
router.get('/representantes/:id/clientes',             ctrl.clientes);

// Nível 3 — Pedidos de um cliente
router.get('/clientes/:id/pedidos',                    ctrl.pedidos);

// Nível 4 — Itens de um pedido
router.get('/pedidos/:id/itens',                       ctrl.itens);

// Admin — invalida cache
router.delete('/cache',                                ctrl.invalidateCache);

module.exports = router;
