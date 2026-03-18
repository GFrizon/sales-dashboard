// ============================================================
// routes/dashboard.routes.js
// ============================================================
const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');

router.get('/preferences/:userId',  ctrl.getPreferences);
router.post('/preferences/:userId', ctrl.savePreferences);

module.exports = router;
