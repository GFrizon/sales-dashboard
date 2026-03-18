// ============================================================
// server.js — Ponto de entrada do backend
// ============================================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const salesRoutes = require('./routes/sales.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const filterRoutes = require('./routes/filters.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Segurança ────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

// ── Rate limiting ────────────────────────────────────────
const limiter = rateLimit({ windowMs: 60 * 1000, max: 200 });
app.use('/api/', limiter);

// ── Middlewares base ─────────────────────────────────────
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

// ── Rotas ────────────────────────────────────────────────
app.use('/api/sales',     salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/filters',   filterRoutes);

// ── Health check ─────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date(), mock: process.env.MOCK_DB === 'true', db: process.env.DB_CONNECT || 'ORCL' }));

// ── Tratamento de erros ──────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 API rodando em http://localhost:${PORT}`));

module.exports = app;
