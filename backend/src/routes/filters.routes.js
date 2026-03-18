// ============================================================
// routes/filters.routes.js
// ============================================================
const router = require('express').Router();
const ctrl = require('../controllers/filters.controller');

router.get('/options', ctrl.getFilterOptions);

module.exports = router;
