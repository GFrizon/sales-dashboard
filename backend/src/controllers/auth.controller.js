// ============================================================
// controllers/auth.controller.js
// Autenticação JWT com fallback para usuários em .env
// ============================================================
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const { query } = require('../config/database');

const SECRET   = process.env.JWT_SECRET  || 'dashboard@2024#secret-change-me';
const EXPIRES  = process.env.JWT_EXPIRES || '10h';

// ── Usuários de fallback (quando sem banco ou tabela ainda) ───
// Em produção: popule a tabela dashboard_users
const FALLBACK_USERS = (() => {
  try {
    const raw = process.env.DASHBOARD_USERS;
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
})() || [
  {
    id:       'u001',
    username: 'admin',
    // senha: admin123  (gere novo hash com: node -e "require('bcryptjs').hash('suasenha',10).then(console.log)")
    password: '$2a$10$AZQIGMVhRMqL/5onBJ7U8Ofl5l3H0xubzVnsfN4gtbjjNsARNCTT.',
    name:     'Administrador',
    role:     'admin',
    email:    'admin@empresa.com',
    avatar:   'AD',
  },
  {
    id:       'u002',
    username: 'diretor',
    // senha: diretor123
    password: '$2a$10$mdsU6hBEtxeeqGlIm1TKIus6wBF3ti3eqM7mDO7lTyRs0YyvnZUf2',
    name:     'Diretor Comercial',
    role:     'viewer',
    email:    'diretor@empresa.com',
    avatar:   'DC',
  },
];

// ── Busca usuário (DB primeiro, fallback depois) ──────────────
async function findUser(username) {
  try {
    const rows = await query(
      `SELECT id, username, password_hash AS password, full_name AS name,
              role, email, avatar
       FROM   dashboard_users
       WHERE  LOWER(username) = LOWER(:1)
         AND  active = 1`,
      [username]
    );
    if (rows.length > 0) return rows[0];
  } catch {
    // tabela pode não existir ainda — usa fallback
  }
  return FALLBACK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

// ── POST /auth/login ──────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    const user = await findUser(username.trim());
    if (!user) {
      // Resposta genérica (não revelar se usuário existe)
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const pwField = user.PASSWORD || user.password;
    const valid   = await bcrypt.compare(password, pwField);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const payload = {
      id:       user.ID       || user.id,
      username: user.USERNAME || user.username,
      name:     user.NAME     || user.name,
      role:     user.ROLE     || user.role,
      email:    user.EMAIL    || user.email,
      avatar:   user.AVATAR   || user.avatar || (user.NAME || user.name || 'U').substring(0, 2).toUpperCase(),
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: EXPIRES });

    res.json({
      token,
      user:      payload,
      expiresIn: EXPIRES,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /auth/me ──────────────────────────────────────────────
exports.me = (req, res) => {
  res.json({ user: req.user });
};

// ── POST /auth/logout ─────────────────────────────────────────
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logout realizado com sucesso.' });
};

// ── GET /auth/users  (apenas admin) ──────────────────────────
exports.listUsers = async (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  try {
    const rows = await query(
      `SELECT id, username, full_name AS name, role, email, active
       FROM   dashboard_users
       ORDER  BY full_name`
    );
    res.json(rows);
  } catch {
    // fallback
    res.json(FALLBACK_USERS.map(({ password, ...u }) => u));
  }
};

// ── POST /auth/change-password ────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres.' });
    }

    const user = await findUser(req.user.username);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const valid = await bcrypt.compare(currentPassword, user.PASSWORD || user.password);
    if (!valid) return res.status(401).json({ error: 'Senha atual incorreta.' });

    const hash = await bcrypt.hash(newPassword, 10);
    try {
      await query(
        'UPDATE dashboard_users SET password_hash = :1, updated_at = SYSDATE WHERE id = :2',
        [hash, req.user.id]
      );
    } catch {
      return res.status(501).json({ error: 'Banco não configurado. Altere via .env.' });
    }

    res.json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (err) {
    next(err);
  }
};
