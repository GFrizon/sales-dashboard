// ============================================================
// routes/sales.routes.js
// ============================================================
const router = require('express').Router();
const ctrl = require('../controllers/sales.controller');

router.get('/kpis',               ctrl.getKpis);
router.get('/evolucao',           ctrl.getEvolucao);
router.get('/ranking/vendedores', ctrl.getRankingVendedores);
router.get('/ranking/clientes',   ctrl.getRankingClientes);
router.get('/ranking/produtos',   ctrl.getRankingProdutos);
router.get('/status',             ctrl.getStatusDistribuicao);
router.get('/qualidade',          ctrl.getQualidade);
router.get('/curva-abc',          ctrl.getCurvaABC);

module.exports = router;

// Exportação de dados brutos
router.get('/export', ctrl.getExportData);
