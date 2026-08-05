const express = require('express');
const { query } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/mine', authRequired, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.id, p.slug, p.name_es, p.name_en, p.name_pt, pm.status
       FROM project_members pm
       JOIN projects p ON p.id = pm.project_id
       WHERE pm.researcher_id = $1
         AND pm.status = 'approved'
         AND p.active = TRUE
       ORDER BY p.name_es`,
      [req.user.id],
    );
    res.json({ projects: result.rows });
  } catch (err) {
    console.error('Projects mine error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
