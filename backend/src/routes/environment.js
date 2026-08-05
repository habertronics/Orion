const express = require('express');
const { authRequired } = require('../middleware/auth');
const { fetchEnvironmentSnapshot } = require('../services/openMeteo');

const router = express.Router();

router.post('/snapshot', authRequired, async (req, res) => {
  const lat = Number(req.body.lat);
  const lng = Number(req.body.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'invalid_coordinates' });
  }

  // Redondeo extra por privacidad (~100–500 m)
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
