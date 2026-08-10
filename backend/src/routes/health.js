const express = require('express');
const { query } = require('../db');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const healthDeepLimit = createRateLimiter({
  windowMs: 60_000,
  max: 30,
  message: 'health_rate_limited',
});

async function checkNeon() {
  const started = Date.now();
  await query('SELECT 1 AS ok');
  return { ok: true, ms: Date.now() - started };
}

async function checkClimate() {
  const started = Date.now();
  // Ciudad de México — ping mínimo a Open-Meteo (público).
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=19.43&longitude=-99.13&current=temperature_2m';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`open-meteo HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data?.current?.temperature_2m == null) {
    throw new Error('open-meteo sin temperatura');
  }
  return {
    ok: true,
    ms: Date.now() - started,
    sampleC: data.current.temperature_2m,
  };
}

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'habertronic-orion-api',
    checkedAt: new Date().toISOString(),
  });
});

router.get('/deep', healthDeepLimit, async (_req, res) => {
  const started = Date.now();
  const checks = {
    api: { ok: true, ms: 0 },
    neon: { ok: false, ms: null, error: null },
    climate: { ok: false, ms: null, error: null },
  };

  try {
    checks.neon = await checkNeon();
  } catch (err) {
    checks.neon = {
      ok: false,
      ms: null,
      error: err?.message || 'neon_unavailable',
    };
  }

  try {
    checks.climate = await checkClimate();
  } catch (err) {
    checks.climate = {
      ok: false,
      ms: null,
      error: err?.message || 'climate_unavailable',
    };
  }

  const allOk = checks.api.ok && checks.neon.ok && checks.climate.ok;
  const degraded = checks.api.ok && (!checks.neon.ok || !checks.climate.ok);

  res.status(allOk ? 200 : checks.neon.ok ? 200 : 503).json({
    status: allOk ? 'ok' : degraded ? 'degraded' : 'down',
    service: 'habertronic-orion-api',
    totalMs: Date.now() - started,
    checkedAt: new Date().toISOString(),
    checks,
  });
});

module.exports = router;
