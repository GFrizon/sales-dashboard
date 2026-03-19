// ============================================================
// config/database.js - Conexao Oracle
// ============================================================
require('dotenv').config();
const fs = require('fs');

let oracledb;
try {
  oracledb = require('oracledb');
} catch (e) {
  console.warn('oracledb nao instalado. Usando modo mock.');
}

let pool = null;
let poolPromise = null;
let thickModeInitialized = false;

function initOracleClientIfNeeded() {
  if (!oracledb || thickModeInitialized) return;
  if (process.env.MOCK_DB === 'true') return;

  const candidates = [
    process.env.ORACLE_CLIENT_LIB_DIR,
    'C:\\oracle\\product\\12.2.0\\client_1\\bin',
    'C:\\oracle\\product\\12.2.0\\client_2\\bin',
    'C:\\Oracle\\product\\12.2.0\\client_2\\bin',
    'C:\\Oracle\\product\\12.2.0\\client_1\\bin',
  ].filter(Boolean);

  for (const libDir of candidates) {
    if (!fs.existsSync(libDir)) continue;
    try {
      oracledb.initOracleClient({ libDir });
      thickModeInitialized = true;
      console.log(`Oracle thick mode ativo (${libDir})`);
      return;
    } catch (err) {
      console.warn(`Falha ao inicializar Oracle thick mode em ${libDir}: ${err.message}`);
    }
  }
}

const DB_CONFIG = {
  user: process.env.DB_USER || 'bakof',
  password: process.env.DB_PASS || 'bakof',
  connectString: process.env.DB_CONNECT || 'ORCL',
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60,
  poolPingInterval: 60,
  stmtCacheSize: 30,
};

async function getPool() {
  if (pool) return pool;
  if (poolPromise) return poolPromise;
  if (!oracledb) throw new Error('oracledb nao instalado');

  initOracleClientIfNeeded();

  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  oracledb.fetchAsString = [oracledb.CLOB];
  oracledb.autoCommit = true;

  poolPromise = oracledb.createPool(DB_CONFIG)
    .then((createdPool) => {
      pool = createdPool;
      console.log(`Oracle pool criado -> ${DB_CONFIG.connectString} (user: ${DB_CONFIG.user})`);
      return pool;
    })
    .catch((err) => {
      poolPromise = null;
      throw err;
    });

  return poolPromise;
}

async function query(sql, params = []) {
  if (!oracledb || process.env.MOCK_DB === 'true') {
    console.warn('Mock DB ativo - retornando dados vazios');
    return [];
  }

  const p = await getPool();
  const conn = await p.getConnection();
  try {
    const result = await conn.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      fetchArraySize: 500,
    });
    return result.rows || [];
  } catch (err) {
    console.error('SQL Error:', err.message);
    console.error('SQL:', sql.substring(0, 200));
    throw err;
  } finally {
    await conn.close();
  }
}

process.on('SIGINT', () => pool?.close(0).then(() => process.exit(0)));
process.on('SIGTERM', () => pool?.close(0).then(() => process.exit(0)));

module.exports = { getPool, query };
