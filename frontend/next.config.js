// ============================================================
// next.config.js
// ============================================================
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Rewrite para o backend em dev (evita CORS)
  async rewrites() {
    const backendBase = process.env.BACKEND_URL || 'http://localhost:4000';
    return [
      {
        source: '/auth/:path*',
        destination: `${backendBase}/auth/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${backendBase}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${backendBase}/health`,
      },
    ];
  },
};

module.exports = nextConfig;
