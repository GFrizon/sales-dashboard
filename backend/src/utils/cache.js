// ============================================================
// utils/cache.js
// Cache com Redis (produção) + Map em memória (fallback)
// Se Redis não estiver disponível, degrada graciosamente
// ============================================================
const REDIS_URL = process.env.REDIS_URL || null;

// ── Tenta conectar ao Redis ────────────────────────────────
let redisClient = null;
let redisReady  = false;
let usingRedis  = false;

async function initRedis() {
  if (!REDIS_URL) return;
  try {
    const Redis = require('ioredis');
    redisClient = new Redis(REDIS_URL, {
      connectTimeout:    3000,
      commandTimeout:    2000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.on('connect', () => {
      redisReady = true;
      usingRedis = true;
      console.log('[cache] Redis conectado:', REDIS_URL);
    });
    redisClient.on('error', (err) => {
      if (redisReady) console.warn('[cache] Redis erro, usando memória:', err.message);
      redisReady = false;
    });
    redisClient.on('close', () => { redisReady = false; });

    await redisClient.connect();
  } catch (e) {
    console.warn('[cache] Redis indisponível, usando cache em memória:', e.message);
    redisClient = null;
  }
}

// Inicializa em background — não bloqueia o servidor
initRedis().catch(() => {});

// ── Fallback: Map com TTL ─────────────────────────────────
const memStore = new Map();

function memGet(key) {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.exp) { memStore.delete(key); return null; }
  return entry.val;
}
function memSet(key, val, ttlSec) {
  // Evita crescimento ilimitado
  if (memStore.size > 2000) {
    const oldest = [...memStore.entries()].sort((a,b) => a[1].exp - b[1].exp);
    oldest.slice(0, 200).forEach(([k]) => memStore.delete(k));
  }
  memStore.set(key, { val, exp: Date.now() + ttlSec * 1000 });
}
function memDel(key) { memStore.delete(key); }
function memFlushPrefix(prefix) {
  for (const k of memStore.keys()) {
    if (k.startsWith(prefix)) memStore.delete(k);
  }
}

// ── API pública ──────────────────────────────────────────
async function get(key) {
  if (redisReady && redisClient) {
    try {
      const raw = await redisClient.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch { /* fallback */ }
  }
  return memGet(key);
}

async function set(key, value, ttlSec = 300) {
  const serial = JSON.stringify(value);
  if (redisReady && redisClient) {
    try {
      await redisClient.setex(key, ttlSec, serial);
      return;
    } catch { /* fallback */ }
  }
  memSet(key, value, ttlSec);
}

async function del(key) {
  if (redisReady && redisClient) {
    try { await redisClient.del(key); } catch { /* ignore */ }
  }
  memDel(key);
}

// Apaga todas as chaves com determinado prefixo
async function flushPrefix(prefix) {
  if (redisReady && redisClient) {
    try {
      // SCAN é seguro para produção (não bloqueia como KEYS)
      let cursor = '0';
      do {
        const [next, keys] = await redisClient.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = next;
        if (keys.length) await redisClient.del(...keys);
      } while (cursor !== '0');
      return;
    } catch { /* fallback */ }
  }
  memFlushPrefix(prefix);
}

function status() {
  return {
    driver:    usingRedis && redisReady ? 'redis' : 'memory',
    connected: redisReady,
    memKeys:   memStore.size,
  };
}

module.exports = { get, set, del, flushPrefix, status };
