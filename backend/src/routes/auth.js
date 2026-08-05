const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeNickname(value) {
  const nick = String(value || '').trim();
  return nick.length ? nick.slice(0, 80) : null;
}

function isValidEmail(email) {
  return email.includes('@') && email.length >= 5;
}

function displayName(researcher) {
  return researcher.nickname || researcher.email;
}

async function enrollInActiveProjects(researcherId) {
  await query(
    `INSERT INTO project_members (project_id, researcher_id, status)
     SELECT id, $1, 'approved'
     FROM projects
     WHERE active = TRUE
     ON CONFLICT (project_id, researcher_id) DO NOTHING`,
    [researcherId],
  );
}

async function logLoginAttempt({ researcherId, email, success, req }) {
  await query(
    `INSERT INTO researcher_login_events
      (researcher_id, email, success, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      researcherId || null,
      email,
      success,
      req.ip || req.headers['x-forwarded-for'] || null,
      req.headers['user-agent'] || null,
    ],
  );
}

function signToken(researcher) {
  return jwt.sign(
    {
      id: researcher.id,
      email: researcher.email,
      nickname: researcher.nickname || null,
      role: researcher.role || 'researcher',
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  );
}

function userPayload(researcher) {
  return {
    id: researcher.id,
    email: researcher.email,
    nickname: researcher.nickname || null,
    displayName: displayName(researcher),
    role: researcher.role || 'researcher',
  };
}

router.post('/register', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const useNickname = Boolean(req.body.useNickname);
  const nickname = useNickname ? normalizeNickname(req.body.nickname) : null;

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  if (!password) {
    return res.status(400).json({ error: 'missing_password' });
  }
  if (useNickname && !nickname) {
    return res.status(400).json({ error: 'missing_nickname' });
  }

  try {
    const existing = await query(
      'SELECT id FROM researchers WHERE email = $1',
      [email],
    );
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'email_taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await query(
      `INSERT INTO researchers (email, password_hash, nickname)
       VALUES ($1, $2, $3)
       RETURNING id, email, nickname, role, created_at`,
      [email, passwordHash, nickname],
    );

    const researcher = inserted.rows[0];
    await enrollInActiveProjects(researcher.id);

    const token = signToken(researcher);
    res.status(201).json({
      token,
      user: {
        ...userPayload(researcher),
        createdAt: researcher.created_at,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  if (!password) {
    return res.status(400).json({ error: 'missing_password' });
  }

  try {
    const result = await query(
      `SELECT id, email, nickname, role, password_hash, active
       FROM researchers WHERE email = $1`,
      [email],
    );
    const researcher = result.rows[0];

    if (!researcher || !researcher.active) {
      await logLoginAttempt({ email, success: false, req });
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const valid = await bcrypt.compare(password, researcher.password_hash);
    if (!valid) {
      await logLoginAttempt({
        researcherId: researcher.id,
        email,
        success: false,
        req,
      });
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    await logLoginAttempt({
      researcherId: researcher.id,
      email,
      success: true,
      req,
    });
    await enrollInActiveProjects(researcher.id);

    const token = signToken(researcher);
    res.json({
      token,
      user: userPayload(researcher),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, nickname, role, created_at
       FROM researchers
       WHERE id = $1 AND active = TRUE`,
      [req.user.id],
    );
    const researcher = result.rows[0];
    if (!researcher) {
      return res.status(404).json({ error: 'not_found' });
    }
    res.json({
      ...userPayload(researcher),
      createdAt: researcher.created_at,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
