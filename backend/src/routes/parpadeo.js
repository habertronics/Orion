const express = require('express');
const { query } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/interrogatorio', authRequired, async (req, res) => {
  const answers = req.body.answers || {};
  const location = req.body.location || null;
  const environment = req.body.environment || null;

  try {
    const inserted = await query(
      `INSERT INTO parpadeo_sessions
        (researcher_id, project_slug, answers_json, location_json, environment_json)
       VALUES ($1, 'parpadeo', $2::jsonb, $3::jsonb, $4::jsonb)
       RETURNING id, created_at`,
      [
        req.user.id,
        JSON.stringify(answers),
        location ? JSON.stringify(location) : null,
        environment ? JSON.stringify(environment) : null,
      ],
    );

    res.status(201).json({
      id: inserted.rows[0].id,
      createdAt: inserted.rows[0].created_at,
    });
  } catch (err) {
    console.error('Save interrogatorio error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

router.get('/sessions/latest', authRequired, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, answers_json, location_json, environment_json, created_at
       FROM parpadeo_sessions
       WHERE researcher_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [req.user.id],
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
