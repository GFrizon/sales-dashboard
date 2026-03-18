// ============================================================
// routes/auth.routes.js
// ============================================================
const router     = require('express').Router();
const ctrl       = require('../controllers/auth.controller');
const authMiddle = require('../middleware/auth.middleware');

router.post('/login',           ctrl.login);
router.post('/logout',          authMiddle, ctrl.logout);
router.get ('/me',              authMiddle, ctrl.me);
router.get ('/users',           authMiddle, ctrl.listUsers);
router.post('/change-password', authMiddle, ctrl.changePassword);

module.exports = router;
