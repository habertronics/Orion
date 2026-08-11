const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { createRateLimiter } = require('../middleware/rateLimit');
const { repAuthRequired, signRepToken } = require('../middleware/repAuth');
const { sendInviteEmail } = require('../services/inviteEmail');

const router = express.Router();

const registerRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'rate_limited',
});

const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'rate_limited',
});

const acceptRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'rate_limited',
});

const INVITE_TTL_HOURS = 12;
const PUBLIC_APP_ORIGIN =
  process.env.PUBLIC_APP_ORIGIN || 'https://habertronic-orion.netlify.app';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeFullName(value) {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  return name.length ? name.slice(0, 200) : null;
}

function normalizePhone(value) {
  const phone = String(value || '').trim();
  return phone.length ? phone.slice(0, 40) : null;
}

function isValidEmail(email) {
  return email.includes('@') && email.length >= 5;
}

function isValidPhone(phone) {
  if (!phone) return true;
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function parseInviteType(value) {
  const t = String(value || 'researcher').trim().toLowerCase();
  if (t === 'preceptorship') return 'preceptorship';
  return 'researcher';
}

function displayName(rep) {
  return rep.full_name || rep.email;
}

function userPayload(rep) {
  return {
    id: rep.id,
    email: rep.email,
    fullName: rep.full_name || null,
    displayName: displayName(rep),
    role: 'representative',
  };
}

function acceptPathForToken(token) {
  return `/reps/aceptar/?t=${encodeURIComponent(token)}`;
}

function acceptUrlForToken(token) {
  return `${PUBLIC_APP_ORIGIN.replace(/\/$/, '')}${acceptPathForToken(token)}`;
}

function registerUrlForEmail(email) {
  const base = `${PUBLIC_APP_ORIGIN.replace(/\/$/, '')}/`;
  return `${base}?inviteEmail=${encodeURIComponent(email)}`;
}

/** POST /api/reps/auth/register */
router.post('/auth/register', registerRateLimit, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const fullName = normalizeFullName(req.body.fullName);
  const phone = normalizePhone(req.body.phone);

  if (!fullName) {
    return res.status(400).json({ error: 'missing_full_name' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'missing_password' });
  }
  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ error: 'invalid_phone' });
  }

  try {
    const [asRep, asResearcher] = await Promise.all([
      query('SELECT id FROM representatives WHERE email = $1', [email]),
      query('SELECT id FROM researchers WHERE email = $1', [email]),
    ]);
    if (asRep.rows[0] || asResearcher.rows[0]) {
      return res.status(409).json({ error: 'email_taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await query(
      `INSERT INTO representatives (email, password_hash, full_name, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, created_at`,
      [email, passwordHash, fullName, phone || null],
    );
    const rep = inserted.rows[0];
    const token = signRepToken(rep);
    return res.status(201).json({
      token,
      user: { ...userPayload(rep), createdAt: rep.created_at },
    });
  } catch (err) {
    console.error('Rep register error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

/** POST /api/reps/auth/login */
router.post('/auth/login', loginRateLimit, async (req, res) => {
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
      `SELECT id, email, full_name, password_hash, active
       FROM representatives WHERE email = $1`,
      [email],
    );
    const rep = result.rows[0];
    if (!rep || !rep.active) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    const valid = await bcrypt.compare(password, rep.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    const token = signRepToken(rep);
    return res.json({ token, user: userPayload(rep) });
  } catch (err) {
    console.error('Rep login error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

/** GET /api/reps/auth/me */
router.get('/auth/me', repAuthRequired, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, full_name, created_at
       FROM representatives WHERE id = $1 AND active = TRUE`,
      [req.user.id],
    );
    const rep = result.rows[0];
    if (!rep) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    return res.json({ user: userPayload(rep) });
  } catch (err) {
    console.error('Rep me error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

/** POST /api/reps/invites — crea sesión QR */
router.post('/invites', repAuthRequired, async (req, res) => {
  const inviteType = parseInviteType(req.body.inviteType);
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

  try {
    const inserted = await query(
      `INSERT INTO invitations
        (representative_id, token, invite_type, status, expires_at)
       VALUES ($1, $2, $3, 'open', $4)
       RETURNING id, token, invite_type, status, created_at, expires_at`,
      [req.user.id, token, inviteType, expiresAt.toISOString()],
    );
    const row = inserted.rows[0];
    return res.status(201).json({
      id: row.id,
      token: row.token,
      inviteType: row.invite_type,
      status: row.status,
      expiresAt: row.expires_at,
      acceptPath: acceptPathForToken(row.token),
      acceptUrl: acceptUrlForToken(row.token),
    });
  } catch (err) {
    console.error('Rep create invite error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

/** GET /api/reps/invites — listado del representante */
router.get('/invites', repAuthRequired, async (req, res) => {
  try {
    const result = await query(
      `SELECT i.id, i.invitee_email, i.invite_type, i.status,
              i.created_at, i.expires_at, i.accepted_at, i.researcher_id,
              r.full_name AS researcher_name
       FROM invitations i
       LEFT JOIN researchers r ON r.id = i.researcher_id
       WHERE i.representative_id = $1
       ORDER BY i.created_at DESC
       LIMIT 100`,
      [req.user.id],
    );
    return res.json({
      invitations: result.rows.map((row) => ({
        id: row.id,
        inviteeEmail: row.invitee_email,
        inviteType: row.invite_type,
        status: row.status,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        acceptedAt: row.accepted_at,
        researcherId: row.researcher_id,
        researcherName: row.researcher_name || null,
        medicoAcepto: row.status === 'accepted' || row.status === 'registered',
      })),
    });
  } catch (err) {
    console.error('Rep list invites error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

/** GET /api/reps/invites/public/:token — pantalla del médico */
router.get('/invites/public/:token', async (req, res) => {
  const token = String(req.params.token || '').trim();
  if (!token) {
    return res.status(400).json({ error: 'invalid_token' });
  }
  try {
    const result = await query(
      `SELECT i.id, i.token, i.invite_type, i.status, i.expires_at, i.invitee_email,
              rep.full_name AS rep_name, rep.email AS rep_email
       FROM invitations i
       JOIN representatives rep ON rep.id = i.representative_id
       WHERE i.token = $1`,
      [token],
    );
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'invite_not_found' });
    }
    const expired = new Date(row.expires_at).getTime() < Date.now();
    if (expired && row.status === 'open') {
      await query(
        `UPDATE invitations SET status = 'expired' WHERE id = $1 AND status = 'open'`,
        [row.id],
      );
      row.status = 'expired';
    }
    return res.json({
      inviteType: row.invite_type,
      status: row.status,
      expiresAt: row.expires_at,
      alreadyAccepted: row.status === 'accepted' || row.status === 'registered',
      inviteeEmail: row.invitee_email || null,
      representativeName: row.rep_name,
      labName: 'Cuerpo médico · Laboratorio Sofía',
    });
  } catch (err) {
    console.error('Public invite get error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

/**
 * POST /api/reps/invites/accept
 * Médico: email + aceptar (obligatorio; nada anónimo).
 */
router.post('/invites/accept', acceptRateLimit, async (req, res) => {
  const token = String(req.body.token || '').trim();
  const email = normalizeEmail(req.body.email);
  const inviteTypeOverride = req.body.inviteType
    ? parseInviteType(req.body.inviteType)
    : null;

  if (!token) {
    return res.status(400).json({ error: 'invalid_token' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }

  try {
    const result = await query(
      `SELECT i.*, rep.full_name AS rep_name, rep.email AS rep_email
       FROM invitations i
       JOIN representatives rep ON rep.id = i.representative_id
       WHERE i.token = $1`,
      [token],
    );
    const inv = result.rows[0];
    if (!inv) {
      return res.status(404).json({ error: 'invite_not_found' });
    }
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      await query(
        `UPDATE invitations SET status = 'expired' WHERE id = $1 AND status = 'open'`,
        [inv.id],
      );
      return res.status(410).json({ error: 'invite_expired' });
    }
    if (inv.status === 'accepted' || inv.status === 'registered') {
      return res.status(409).json({ error: 'already_accepted' });
    }
    if (inv.status !== 'open') {
      return res.status(409).json({ error: 'invite_unavailable' });
    }

    const inviteType = inviteTypeOverride || inv.invite_type;
    const researcher = await query(
      `SELECT id, email, full_name FROM researchers WHERE email = $1`,
      [email],
    );
    const existing = researcher.rows[0] || null;
    const nextStatus = existing ? 'registered' : 'accepted';
    const acceptedAt = new Date().toISOString();

    await query(
      `UPDATE invitations
       SET invitee_email = $1,
           invite_type = $2,
           status = $3,
           accepted_at = $4,
           researcher_id = $5
       WHERE id = $6`,
      [
        email,
        inviteType,
        nextStatus,
        acceptedAt,
        existing ? existing.id : null,
        inv.id,
      ],
    );

    if (existing) {
      await query(
        `UPDATE researchers
         SET invited_by_rep_id = COALESCE(invited_by_rep_id, $1),
             invitation_accepted_at = COALESCE(invitation_accepted_at, $2)
         WHERE id = $3`,
        [inv.representative_id, acceptedAt, existing.id],
      );
    }

    const registerUrl = registerUrlForEmail(email);
    const mail = await sendInviteEmail({
      inviteeEmail: email,
      repName: inv.rep_name || inv.rep_email,
      inviteType,
      registerUrl,
    });

    return res.json({
      ok: true,
      status: nextStatus,
      inviteeEmail: email,
      inviteType,
      medicoAcepto: true,
      invitedBy: inv.rep_name || inv.rep_email,
      alreadyRegistered: Boolean(existing),
      registerUrl,
      emailQueued: Boolean(mail?.queued),
    });
  } catch (err) {
    console.error('Invite accept error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
