// ============================================================
// middleware/auth.middleware.js
// Verifica JWT em todas as rotas /api/*
// ============================================================
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dashboard@2024#secret-change-me';

// Rotas públicas que não precisam de token
const PUBLIC_ROUTES = [
  { method: 'POST', path: '/auth/login' },
  { method: 'GET',  path: '/health' },
];

function isPublic(req) {
  return PUBLIC_ROUTES.some(r =>
    r.method === req.method && req.path.endsWith(r.path)
  );
}

module.exports = function authMiddleware(req, res, next) {
  if (isPublic(req)) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acesso não autorizado. Faça login para continuar.',
      code:  'NO_TOKEN',
    });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';
    return res.status(401).json({
      error: code === 'TOKEN_EXPIRED'
        ? 'Sessão expirada. Faça login novamente.'
        : 'Token inválido.',
      code,
    });
  }
};
