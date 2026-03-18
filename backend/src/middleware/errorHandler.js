// ============================================================
// middleware/errorHandler.js
// ============================================================
module.exports = (err, req, res, next) => {
  console.error('❌ API Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
