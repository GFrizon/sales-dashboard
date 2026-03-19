const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const salesRoutes = require('./routes/sales.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const filterRoutes = require('./routes/filters.routes');
const authRoutes = require('./routes/auth.routes');
const hierarquiaRoutes = require('./routes/hierarquia.routes');
const authMiddleware = require('./middleware/auth.middleware');
const errorHandler = require('./middleware/errorHandler');
const cache = require('./utils/cache');
const { warmAllNow, scheduleDailyWarmup, runStartupWarmup } = require('./jobs/cacheWarmer');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 200 });
app.use('/api/', limiter);

app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

app.use('/auth', authRoutes);
app.use('/api', authMiddleware);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/hierarquia', hierarquiaRoutes);
app.post('/api/cache/prewarm', async (req, res, next) => {
  try {
    const info = await warmAllNow('manual_api');
    res.json(info);
  } catch (err) {
    next(err);
  }
});

app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    ts: new Date(),
    mock: process.env.MOCK_DB === 'true',
    db: process.env.DB_CONNECT || 'ORCL',
    cache: cache.status(),
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));

runStartupWarmup().finally(() => {
  scheduleDailyWarmup();
});

module.exports = app;
