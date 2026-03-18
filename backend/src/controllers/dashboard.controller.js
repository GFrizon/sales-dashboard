// ============================================================
// controllers/dashboard.controller.js
// Persiste as preferências de layout do usuário
// ============================================================
const { query } = require('../config/database');

// GET /api/dashboard/preferences/:userId
exports.getPreferences = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const rows = await query(
      `SELECT preferences FROM dashboard_preferences WHERE user_id = :1`,
      [userId]
    );
    if (!rows.length) return res.json({ layout: [], activeWidgets: [] });
    res.json(JSON.parse(rows[0].PREFERENCES));
  } catch (err) {
    next(err);
  }
};

// POST /api/dashboard/preferences/:userId
exports.savePreferences = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const payload = JSON.stringify(req.body);

    // Upsert simples
    const exists = await query(
      `SELECT 1 FROM dashboard_preferences WHERE user_id = :1`,
      [userId]
    );

    if (exists.length) {
      await query(
        `UPDATE dashboard_preferences SET preferences = :1, updated_at = SYSDATE WHERE user_id = :2`,
        [payload, userId]
      );
    } else {
      await query(
        `INSERT INTO dashboard_preferences (user_id, preferences, created_at, updated_at)
         VALUES (:1, :2, SYSDATE, SYSDATE)`,
        [userId, payload]
      );
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* SQL para criar a tabela de preferências:
CREATE TABLE dashboard_preferences (
  user_id     VARCHAR2(100) PRIMARY KEY,
  preferences CLOB,
  created_at  DATE,
  updated_at  DATE
);
*/
