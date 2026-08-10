/**
 * Rate limiter en memoria (una instancia Render).
 * Suficiente para frenar altas/logins masivos sin dependencias extra.
 */

function createRateLimiter({ windowMs, max, message = 'rate_limited' }) {
  /** @type {Map<string, number[]>} */
  const hits = new Map();

  function clientKey(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  function prune(timestamps, now) {
    return timestamps.filter((t) => now - t < windowMs);
  }

  return function rateLimit(req, res, next) {
    const key = clientKey(req);
    const now = Date.now();
    const nextHits = prune(hits.get(key) || [], now);

    if (nextHits.length >= max) {
      hits.set(key, nextHits);
      return res.status(429).json({ error: message });
    }

    nextHits.push(now);
    hits.set(key, nextHits);
    next();
  };
}

module.exports = { createRateLimiter };
