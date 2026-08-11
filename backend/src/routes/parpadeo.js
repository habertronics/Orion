const express = require('express');
const { query } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function isValidMeter(meter) {
  if (!meter || typeof meter !== 'object') return false;
  return (
    Number(meter.durationMs) > 0 &&
    typeof meter.finishedAt === 'string' &&
    meter.finishedAt.length > 0
  );
}

function isValidExam(exam) {
  if (!exam || typeof exam !== 'object') return false;
  return Boolean(
    exam.tbut &&
      exam.schirmer &&
      exam.staining &&
      exam.meibomianFunction &&
      exam.meibomianExpressivity &&
      exam.meibomianFindings &&
      exam.otherCriteria,
  );
}

/** Ya no se guardan sesiones parciales: solo el complete con parpadeómetro. */
router.post('/interrogatorio', authRequired, async (_req, res) => {
  res.status(410).json({
    error: 'partial_upload_disabled',
    message:
      'El protocolo solo se guarda al completar interrogatorio, exploración y parpadeómetro.',
  });
});

router.post('/complete', authRequired, async (req, res) => {
  const answers = req.body.answers || {};
  const location = req.body.location || null;
  const environment = req.body.environment || null;
  const exam = req.body.exam || null;
  const meter = req.body.meter || null;

  if (!isValidExam(exam) || !isValidMeter(meter)) {
    return res.status(400).json({
      error: 'incomplete_protocol',
      message:
        'Se requieren exploración completa y parpadeómetro terminado para guardar.',
    });
  }

  try {
    // Abortar borradores / parciales del investigador: no quedan restos a medias.
    await query(
      `DELETE FROM parpadeo_sessions
       WHERE researcher_id = $1 AND completed_at IS NULL`,
      [req.user.id],
    );

    const inserted = await query(
      `INSERT INTO parpadeo_sessions
        (researcher_id, project_slug, answers_json, location_json, environment_json,
         exam_json, meter_json, completed_at)
       VALUES ($1, 'parpadeo', $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, NOW())
       RETURNING id, created_at, completed_at`,
      [
        req.user.id,
        JSON.stringify(answers),
        location ? JSON.stringify(location) : null,
        environment ? JSON.stringify(environment) : null,
        JSON.stringify(exam),
        JSON.stringify(meter),
      ],
    );

    res.status(201).json({
      id: inserted.rows[0].id,
      createdAt: inserted.rows[0].created_at,
      completedAt: inserted.rows[0].completed_at,
    });
  } catch (err) {
    console.error('Save complete session error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

router.get('/sessions/latest', authRequired, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, answers_json, location_json, environment_json, exam_json, meter_json,
              created_at, completed_at
       FROM parpadeo_sessions
       WHERE researcher_id = $1 AND completed_at IS NOT NULL
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
