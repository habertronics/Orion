const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { authRequired } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const registerRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: 'rate_limited',
});

const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'rate_limited',
});

const MIN_REGISTER_MS = 4000;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeNickname(value) {
  const nick = String(value || '').trim();
  return nick.length ? nick.slice(0, 80) : null;
}

function normalizeFullName(value) {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  return name.length ? name.slice(0, 200) : null;
}

function normalizePhone(value) {
  const phone = String(value || '').trim();
  return phone.length ? phone.slice(0, 40) : null;
}

function parseAge(value) {
  const age = Number(value);
  if (!Number.isInteger(age)) return null;
  if (age < 1 || age > 120) return null;
  return age;
}

function isValidEmail(email) {
  return email.includes('@') && email.length >= 5;
}

function isValidPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

const SPECIALTY_SLUGS = new Set([
  'cornea',
  'refractive',
  'cataract',
  'glaucoma',
  'retina',
  'uvea',
  'pediatric',
  'oculoplastics',
  'neuro',
  'oncology',
  'lowVision',
  'pathology',
  'other',
]);

function normalizeOphthalmology(body) {
  const profile = String(body.ophthalmologyProfile || '').trim();
  if (profile !== 'general' && profile !== 'specialty') {
    return { error: 'missing_ophthalmology_profile' };
  }

  if (profile === 'general') {
    return {
      ophthalmologyProfile: 'general',
      specialtySlug: null,
      specialtyOther: null,
    };
  }

  const specialtySlug = String(body.specialtySlug || '').trim();
  if (!SPECIALTY_SLUGS.has(specialtySlug)) {
    return { error: 'missing_specialty' };
  }

  if (specialtySlug === 'other') {
    const specialtyOther = String(body.specialtyOther || '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 120);
    if (!specialtyOther) {
      return { error: 'missing_specialty_other' };
    }
    return {
      ophthalmologyProfile: 'specialty',
      specialtySlug,
      specialtyOther,
    };
  }

  return {
    ophthalmologyProfile: 'specialty',
    specialtySlug,
    specialtyOther: null,
  };
}

function normalizeLocation(body) {
  const declined = Boolean(body.locationDeclined);
  if (declined) {
    return { declined: true, location: null };
  }

  const location = body.location;
  if (!location || typeof location !== 'object') {
    return { declined: false, location: null, error: 'missing_location' };
  }

  if (location.source === 'device' || location.source === 'geocoded') {
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { declined: false, location: null, error: 'missing_location' };
    }
    return {
      declined: false,
      location: {
        source: location.source,
        lat: Number(lat.toFixed(3)),
        lng: Number(lng.toFixed(3)),
        accuracy: Number.isFinite(Number(location.accuracy))
          ? Math.round(Number(location.accuracy))
          : null,
        capturedAt: location.capturedAt || new Date().toISOString(),
        label: location.label ? String(location.label).slice(0, 200) : undefined,
        placeId: location.placeId ?? undefined,
      },
    };
  }

  return { declined: false, location: null, error: 'missing_location' };
}

function displayName(researcher) {
  return researcher.full_name || researcher.nickname || researcher.email;
}

function isBotSubmission(body) {
  const honeypot = String(body.website || body.companyUrl || '').trim();
  if (honeypot) return true;

  const startedAt = Number(body.formStartedAt);
  if (!Number.isFinite(startedAt)) return true;

  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_REGISTER_MS || elapsed > 24 * 60 * 60 * 1000) {
    return true;
  }

  return false;
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
    fullName: researcher.full_name || null,
    nickname: researcher.nickname || null,
    displayName: displayName(researcher),
    role: researcher.role || 'researcher',
  };
}

router.post('/register', registerRateLimit, async (req, res) => {
  if (isBotSubmission(req.body)) {
    return res.status(400).json({ error: 'registration_blocked' });
  }

  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const fullName = normalizeFullName(req.body.fullName);
  const age = parseAge(req.body.age);
  const phone = normalizePhone(req.body.phone);
  const useNickname = Boolean(req.body.useNickname);
  const nickname = useNickname ? normalizeNickname(req.body.nickname) : null;
  const locationInfo = normalizeLocation(req.body);
  const ophthalmology = normalizeOphthalmology(req.body);

  if (!fullName) {
    return res.status(400).json({ error: 'missing_full_name' });
  }
  if (age === null) {
    return res.status(400).json({ error: 'invalid_age' });
  }
  if (!phone || !isValidPhone(phone)) {
    return res.status(400).json({ error: 'invalid_phone' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  if (!password) {
    return res.status(400).json({ error: 'missing_password' });
  }
  if (useNickname && !nickname) {
    return res.status(400).json({ error: 'missing_nickname' });
  }
  if (ophthalmology.error) {
    return res.status(400).json({ error: ophthalmology.error });
  }
  if (locationInfo.error) {
    return res.status(400).json({ error: locationInfo.error });
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
      `INSERT INTO researchers
        (email, password_hash, full_name, age, phone, nickname,
         location_declined, location_json,
         ophthalmology_profile, specialty_slug, specialty_other)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
       RETURNING id, email, full_name, nickname, role, created_at`,
      [
        email,
        passwordHash,
        fullName,
        age,
        phone,
        nickname,
        locationInfo.declined,
        locationInfo.location ? JSON.stringify(locationInfo.location) : null,
        ophthalmology.ophthalmologyProfile,
        ophthalmology.specialtySlug,
        ophthalmology.specialtyOther,
      ],
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

router.post('/login', loginRateLimit, async (req, res) => {
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
      `SELECT id, email, full_name, nickname, role, password_hash, active
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
      `SELECT id, email, full_name, nickname, role, created_at
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
