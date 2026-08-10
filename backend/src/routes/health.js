const express = require('express');
const { query } = require('../db');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const healthDeepLimit = createRateLimiter({
  windowMs: 60_000,
  max: 30,
  message: 'health_rate_limited',
});

/** Evita saturar Open-Meteo (HTTP 429) con el tablero de semáforos. */
const CLIMATE_CACHE_MS = 5 * 60_000;
let climateCache = null;

const CUSTOMER_WEATHER =
  process.env.OPEN_METEO_BASE_URL || 'https://customer-api.open-meteo.com';
const PUBLIC_WEATHER = 'https://api.open-meteo.com';

function openMeteoKey() {
  return String(process.env.OPEN_METEO_API_KEY || '').trim();
}

function withKey(url) {
  const key = openMeteoKey();
  if (!key) return url;
  const u = new URL(url);
  u.searchParams.set('apikey', key);
  return u.toString();
}

async function checkNeon() {
  const started = Date.now();
  await query('SELECT 1 AS ok');
  return { ok: true, ms: Date.now() - started };
}

async function fetchClimateOnce(baseUrl, label) {
  const path =
    '/v1/forecast?latitude=19.43&longitude=-99.13&current=temperature_2m';
  const url = withKey(`${baseUrl}${path}`);
  const started = Date.now();
  const res = await fetch(url);
  if (res.status === 429) {
    const err = new Error(`${label} HTTP 429`);
    err.code = 429;
    throw err;
  }
  if (!res.ok) {
    throw new Error(`${label} HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data?.current?.temperature_2m == null) {
    throw new Error(`${label} sin temperatura`);
  }
  return {
    ok: true,
    ms: Date.now() - started,
    sampleC: data.current.temperature_2m,
    source: label,
    cached: false,
    rateLimited: false,
  };
}

async function checkClimate() {
  const now = Date.now();
  if (climateCache && now - climateCache.storedAt < CLIMATE_CACHE_MS) {
    return {
      ...climateCache.result,
      cached: true,
      cacheAgeMs: now - climateCache.storedAt,
    };
  }

  const key = openMeteoKey();
  try {
    let result;
    if (key) {
      try {
        result = await fetchClimateOnce(CUSTOMER_WEATHER, 'open-meteo-customer');
      } catch (err) {
        if (err.code !== 429) {
          console.warn('Clima customer falló, probando público:', err.message);
          result = await fetchClimateOnce(PUBLIC_WEATHER, 'open-meteo-public');
        } else {
          throw err;
        }
      }
    } else {
      result = await fetchClimateOnce(PUBLIC_WEATHER, 'open-meteo-public');
    }
    climateCache = { storedAt: now, result };
    return result;
  } catch (err) {
    if (err.code === 429 && climateCache?.result?.ok) {
      return {
        ...climateCache.result,
        cached: true,
        rateLimited: true,
        cacheAgeMs: now - climateCache.storedAt,
        note: 'Open-Meteo limitó peticiones; se muestra la última lectura buena',
      };
    }
    if (err.code === 429) {
      return {
        ok: false,
        ms: null,
        rateLimited: true,
        error: 'open-meteo HTTP 429 (demasiadas peticiones; reintenta en unos minutos)',
      };
    }
    throw err;
  }
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
  const status = !checks.neon.ok
    ? 'down'
    : allOk
      ? 'ok'
      : 'degraded';

  res.status(checks.neon.ok ? 200 : 503).json({
    status,
    service: 'habertronic-orion-api',
    totalMs: Date.now() - started,
    checkedAt: new Date().toISOString(),
    checks,
  });
});

module.exports = router;
