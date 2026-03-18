// ============================================================
// utils/cache.js — Cache em memória simples com TTL
// Em produção, substituir por Redis (ioredis)
// ============================================================
const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlSeconds = 300) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function del(key) {
  store.delete(key);
}

function flush() {
  store.clear();
}

module.exports = { get, set, del, flush };
