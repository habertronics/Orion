const express = require('express');
const { query } = require('../db');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const adminLimit = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  message: 'admin_rate_limited',
});

const SPECIALTY_LABELS_ES = {
  cornea: 'Córnea y enfermedades externas',
  refractive: 'Cirugía refractiva',
  cataract: 'Catarata y segmento anterior',
  glaucoma: 'Glaucoma',
  retina: 'Retina y vítreo',
  uvea: 'Úvea e inflamación ocular',
  pediatric: 'Oftalmología pediátrica y estrabismo',
  oculoplastics: 'Órbita, párpados y vías lagrimales —oculoplástica—',
  neuro: 'Neurooftalmología',
  oncology: 'Oncología ocular',
  lowVision: 'Baja visión y rehabilitación visual',
  pathology: 'Patología y genética oftálmica',
  other: 'Otra',
};

function expectedAdminPin() {
  return String(process.env.ADMIN_DASHBOARD_PIN || '6666').trim();
}

function adminPinRequired(req, res, next) {
  const pin = String(
    req.headers['x-admin-pin'] || req.query.pin || '',
  ).trim();
  if (!pin || pin !== expectedAdminPin()) {
    return res.status(401).json({ error: 'admin_pin_required' });
  }
  return next();
}

function specialtyLabel(row) {
  if (row.ophthalmology_profile === 'general') {
    return 'Oftalmólogo general';
  }
  if (row.specialty_slug === 'other') {
    return row.specialty_other || 'Otra especialidad';
  }
  if (row.specialty_slug) {
    return SPECIALTY_LABELS_ES[row.specialty_slug] || row.specialty_slug;
  }
  return '—';
}

function cityFromLocation(locationJson) {
  if (!locationJson || typeof locationJson !== 'object') return '—';
  if (locationJson.label) return String(locationJson.label);
  if (locationJson.source === 'skipped' || locationJson.declined) {
    return 'Sin localización';
  }
  if (
    Number.isFinite(Number(locationJson.lat)) &&
    Number.isFinite(Number(locationJson.lng))
  ) {
    return `${Number(locationJson.lat).toFixed(3)}, ${Number(locationJson.lng).toFixed(3)}`;
  }
  return '—';
}

function envVal(environment, ...keys) {
  if (!environment || typeof environment !== 'object') return null;
  for (const key of keys) {
    if (environment[key] != null) return environment[key];
  }
  const weather = environment.weather;
  if (weather && typeof weather === 'object') {
    for (const key of keys) {
      if (weather[key] != null) return weather[key];
    }
  }
  return null;
}

function flattenAnswers(answers, locationJson) {
  const a = answers && typeof answers === 'object' ? answers : {};
  const osdi = a.osdi6 && typeof a.osdi6 === 'object' ? a.osdi6 : {};
  return {
    sujetoEdad: a.age ?? null,
    sujetoSexo: a.sex ?? null,
    ojoSecoDx: a.dryEyeDiagnosis ?? null,
    tratamientoNoLubricante: a.nonLubeTreatment ?? null,
    usaLubricante: a.usingLubricant ?? null,
    osdi6Hecho: a.osdi6Done ?? null,
    osdi6Total: osdi.total ?? null,
    osdi6PosibleOjoSeco: osdi.possibleDryEye ?? null,
    osdi6Discomfort: osdi.subscales?.discomfort ?? osdi.discomfort ?? null,
    osdi6Function: osdi.subscales?.visualFunction ?? osdi.function ?? null,
    osdi6Environment: osdi.subscales?.environment ?? null,
    localidadSesion: cityFromLocation(locationJson),
    mismaLocalidad: locationJson?.sameLocality ?? null,
  };
}

function flattenExam(exam) {
  const e = exam && typeof exam === 'object' ? exam : {};
  const tbut = e.tbut && typeof e.tbut === 'object' ? e.tbut : null;
  const schirmer = e.schirmer && typeof e.schirmer === 'object' ? e.schirmer : null;
  const meibFn =
    e.meibomianFunction && typeof e.meibomianFunction === 'object'
      ? e.meibomianFunction
      : null;
  const meibEx =
    e.meibomianExpressivity && typeof e.meibomianExpressivity === 'object'
      ? e.meibomianExpressivity
      : null;
  return {
    tbutOd: tbut?.odSec ?? e.tbutOd ?? null,
    tbutOs: tbut?.osSec ?? e.tbutOs ?? null,
    schirmerOd: schirmer?.odMm ?? e.schirmerOd ?? null,
    schirmerOs: schirmer?.osMm ?? e.schirmerOs ?? null,
    tincionHecha: e.staining != null,
    meibomioFuncionOd: meibFn?.od ?? null,
    meibomioFuncionOs: meibFn?.os ?? null,
    meibomioExpOd: meibEx?.od ?? null,
    meibomioExpOs: meibEx?.os ?? null,
    plusCriteria: e.otherCriteria != null,
  };
}

function flattenMeter(meter) {
  const m = meter && typeof meter === 'object' ? meter : {};
  return {
    parpadeos: m.blinkCount ?? m.blinks ?? null,
    incompletos: m.incompleteBlinkCount ?? m.incomplete ?? null,
    bpm: m.bpm ?? null,
    mediaIntervalo: m.meanIntervalSec ?? null,
    medianaIntervalo: m.medianIntervalSec ?? null,
    modaIntervalo: m.modeIntervalSec ?? null,
    arritmiaCv: m.arrhythmiaCvPct ?? null,
    duracionMs: m.durationMs ?? null,
    umbral: m.apertureThreshold ?? null,
  };
}

function mapProtocolPayload(row) {
  if (!row) return null;
  const answers = flattenAnswers(row.answers_json, row.location_json);
  const exam = flattenExam(row.exam_json);
  const meter = flattenMeter(row.meter_json);
  return {
    done: true,
    sessionId: row.id,
    protocol: row.project_slug || 'parpadeo',
    createdAt: row.created_at,
    completedAt: row.completed_at,
    status: row.completed_at ? 'completa' : 'parcial',
    ...answers,
    ...exam,
    ...meter,
    environmentTemp: envVal(
      row.environment_json,
      'temperatureC',
      'temperature_2m',
    ),
    environmentHumidity: envVal(
      row.environment_json,
      'humidityPct',
      'relative_humidity_2m',
    ),
  };
}

function mapResearcher(row, counts = {}, protocols = {}) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || row.nickname || '—',
    age: row.age,
    phone: row.phone,
    nickname: row.nickname,
    registeredAt: row.created_at,
    ophthalmologyProfile: row.ophthalmology_profile,
    specialtySlug: row.specialty_slug,
    specialtyOther: row.specialty_other,
    specialtyLabel: specialtyLabel(row),
    city: cityFromLocation(row.location_json),
    locationDeclined: Boolean(row.location_declined),
    active: Boolean(row.active),
    role: row.role,
    counts: {
      parpadeo: Number(counts.parpadeo || 0),
      parpadeoCompleted: Number(counts.parpadeo_completed || 0),
      interferometria: Number(counts.interferometria || 0),
      total: Number(counts.total || 0),
    },
    parpadeo: protocols.parpadeo || null,
    interferometria: protocols.interferometria || null,
  };
}

function mapIntervention(row) {
  const answers = flattenAnswers(row.answers_json, row.location_json);
  const exam = flattenExam(row.exam_json);
  const meter = flattenMeter(row.meter_json);
  return {
    sessionId: row.id,
    protocol: row.project_slug || 'parpadeo',
    createdAt: row.created_at,
    completedAt: row.completed_at,
    status: row.completed_at ? 'completa' : 'parcial',
    researcherId: row.researcher_id,
    researcherName: row.full_name || row.nickname || '—',
    researcherEmail: row.email,
    researcherPhone: row.phone,
    researcherAge: row.age,
    researcherSpecialty: specialtyLabel(row),
    researcherCity: cityFromLocation(
      row.researcher_location_json || row.location_json,
    ),
    researcherRegisteredAt: row.researcher_created_at,
    ...answers,
    ...exam,
    ...meter,
    environmentTemp: envVal(
      row.environment_json,
      'temperatureC',
      'temperature_2m',
    ),
    environmentHumidity: envVal(
      row.environment_json,
      'humidityPct',
      'relative_humidity_2m',
    ),
  };
}

function pickLatestSession(sessions, slug) {
  const list = sessions.filter((s) => (s.project_slug || 'parpadeo') === slug);
  if (!list.length) return null;
  const completed = list.filter((s) => s.completed_at);
  const pool = completed.length ? completed : list;
  pool.sort((a, b) => {
    const ta = new Date(a.completed_at || a.created_at).getTime();
    const tb = new Date(b.completed_at || b.created_at).getTime();
    return tb - ta;
  });
  return pool[0];
}

router.use(adminLimit, adminPinRequired);

router.get('/workbook', async (_req, res) => {
  try {
    const researchersResult = await query(
      `SELECT id, email, full_name, age, phone, nickname, location_declined,
              location_json, ophthalmology_profile, specialty_slug, specialty_other,
              role, active, created_at
       FROM researchers
       ORDER BY created_at DESC`,
    );

    const countsResult = await query(
      `SELECT researcher_id,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE project_slug = 'parpadeo')::int AS parpadeo,
              COUNT(*) FILTER (
                WHERE project_slug = 'parpadeo' AND completed_at IS NOT NULL
              )::int AS parpadeo_completed,
              COUNT(*) FILTER (WHERE project_slug = 'interferometria')::int AS interferometria
       FROM parpadeo_sessions
       GROUP BY researcher_id`,
    );

    const countMap = new Map();
    for (const row of countsResult.rows) {
      countMap.set(row.researcher_id, row);
    }

    const sessionsResult = await query(
      `SELECT s.id, s.researcher_id, s.project_slug, s.answers_json, s.location_json,
              s.environment_json, s.exam_json, s.meter_json, s.created_at, s.completed_at,
              r.email, r.full_name, r.age, r.phone, r.nickname, r.created_at AS researcher_created_at,
              r.ophthalmology_profile, r.specialty_slug, r.specialty_other,
              r.location_json AS researcher_location_json, r.location_declined
       FROM parpadeo_sessions s
       JOIN researchers r ON r.id = s.researcher_id
       ORDER BY s.created_at DESC`,
    );

    const sessionsByResearcher = new Map();
    for (const row of sessionsResult.rows) {
      const list = sessionsByResearcher.get(row.researcher_id) || [];
      list.push(row);
      sessionsByResearcher.set(row.researcher_id, list);
    }

    const researchers = researchersResult.rows.map((row) => {
      const sessions = sessionsByResearcher.get(row.id) || [];
      const protocols = {
        parpadeo: mapProtocolPayload(pickLatestSession(sessions, 'parpadeo')),
        interferometria: mapProtocolPayload(
          pickLatestSession(sessions, 'interferometria'),
        ),
      };
      return mapResearcher(row, countMap.get(row.id) || {}, protocols);
    });

    const interventions = sessionsResult.rows.map(mapIntervention);

    const byResearcher = new Map();
    for (const doc of researchers) {
      byResearcher.set(doc.id, {
        researcher: doc,
        interventions: [],
      });
    }
    for (const item of interventions) {
      const bucket = byResearcher.get(item.researcherId);
      if (bucket) bucket.interventions.push(item);
    }

    res.json({
      generatedAt: new Date().toISOString(),
      summary: {
        researchers: researchers.length,
        interventions: interventions.length,
        completed: interventions.filter((i) => i.status === 'completa').length,
        partial: interventions.filter((i) => i.status === 'parcial').length,
      },
      researchers,
      interventions,
      grouped: [...byResearcher.values()].map((group) => ({
        researcher: group.researcher,
        interventions: group.interventions,
      })),
    });
  } catch (err) {
    console.error('Admin workbook error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
