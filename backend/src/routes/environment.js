const express = require('express');
const { authRequired } = require('../middleware/auth');
const { fetchEnvironmentSnapshot } = require('../services/openMeteo');
const { searchPlaces } = require('../services/geocoding');

const router = express.Router();

router.get('/places', authRequired, async (req, res) => {
  const q = String(req.query.q || '');
  const language = String(req.query.lang || 'es');

  try {
    const places = await searchPlaces(q, language);
    res.json({ places });
  } catch (err) {
    console.error('Geocoding error:', err.message);
    res.status(502).json({ error: 'geocoding_unavailable' });
  }
});

router.post('/snapshot', authRequired, async (req, res) => {
  const lat = Number(req.body.lat);
  const lng = Number(req.body.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'invalid_coordinates' });
  }

  const safeLat = Number(lat.toFixed(3));
  const safeLng = Number(lng.toFixed(3));

  try {
    const snapshot = await fetchEnvironmentSnapshot(safeLat, safeLng);
    res.json({ snapshot });
  } catch (err) {
    console.error('Environment snapshot error:', err.message);
    res.status(502).json({ error: 'environment_unavailable' });
  }
});

module.exports = router;
