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

const MARGIN_FINDINGS = [
  'thickenedMargin',
  'irregularMargin',
  'telangiectasia',
  'distichiasis',
  'madarosis',
  'malposition',
  'mucocutaneousJunction',
];
const ORIFICE_FINDINGS = [
  'pouting',
  'capping',
  'lossOfDefinition',
  'vascularInvasion',
  'orificeNarrowing',
  'posteriorToMarx',
];
const PLUS_CRITERIA = [
  'irreversibleDamage',
  'schirmerZero',
  'lagophthalmos',
  'symblepharon',
  'cornealAnesthesia',
  'keratinization',
];

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
  if (row.ophthalmology_profile === 'general') return 'Oftalmólogo general';
  if (row.specialty_slug === 'other') return 'Otra';
  if (row.specialty_slug) {
    return SPECIALTY_LABELS_ES[row.specialty_slug] || row.specialty_slug;
  }
  return null;
}

/** Texto libre solo si eligió «Otra». */
function specialtyOtherText(row) {
  if (row.ophthalmology_profile !== 'specialty') return null;
  if (row.specialty_slug !== 'other') return null;
  const text = String(row.specialty_other || '').trim();
  return text || null;
}

function cityFromLocation(locationJson) {
  if (!locationJson || typeof locationJson !== 'object') return null;
  const parts = [
    locationJson.locality,
    locationJson.state,
    locationJson.country,
  ].filter(Boolean);
  if (parts.length) return parts.join(', ');
  if (locationJson.label) return String(locationJson.label);
  if (locationJson.source === 'skipped' || locationJson.declined) {
    return null;
  }
  if (
    Number.isFinite(Number(locationJson.lat)) &&
    Number.isFinite(Number(locationJson.lng))
  ) {
    return `${Number(locationJson.lat).toFixed(5)}, ${Number(locationJson.lng).toFixed(5)}`;
  }
  return null;
}

function hasProvidedLocation(locationJson, declined = false) {
  if (declined) return false;
  if (!locationJson || typeof locationJson !== 'object') return false;
  if (locationJson.source === 'skipped' || locationJson.declined) return false;
  return locationJson.source === 'device' || locationJson.source === 'geocoded';
}

function jsonDump(value) {
  if (value == null) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function flattenLocation(prefix, locationJson, { declined = false } = {}) {
  const loc =
    locationJson && typeof locationJson === 'object' ? locationJson : {};
  const provided = hasProvidedLocation(loc, declined);
  if (!provided) {
    return {
      [`${prefix}Provided`]: false,
      [`${prefix}Source`]: null,
      [`${prefix}Country`]: null,
      [`${prefix}State`]: null,
      [`${prefix}Locality`]: null,
      [`${prefix}Label`]: null,
      [`${prefix}Lat`]: null,
      [`${prefix}Lng`]: null,
      [`${prefix}Accuracy`]: null,
      [`${prefix}PlaceId`]: null,
      [`${prefix}SameLocality`]: loc.sameLocality ?? null,
      [`${prefix}CapturedAt`]: null,
      [`${prefix}City`]: null,
      [`${prefix}Json`]: jsonDump(locationJson),
    };
  }
  return {
    [`${prefix}Provided`]: true,
    [`${prefix}Source`]: loc.source ?? null,
    [`${prefix}Country`]: loc.country ?? null,
    [`${prefix}State`]: loc.state ?? null,
    [`${prefix}Locality`]: loc.locality ?? null,
    [`${prefix}Label`]: loc.label ?? null,
    [`${prefix}Lat`]: loc.lat ?? null,
    [`${prefix}Lng`]: loc.lng ?? null,
    [`${prefix}Accuracy`]: loc.accuracy ?? null,
    [`${prefix}PlaceId`]: loc.placeId ?? null,
    [`${prefix}SameLocality`]: loc.sameLocality ?? null,
    [`${prefix}CapturedAt`]: loc.capturedAt ?? null,
    [`${prefix}City`]: cityFromLocation(loc),
    [`${prefix}Json`]: jsonDump(locationJson),
  };
}

function flattenEnvironment(environment) {
  const env = environment && typeof environment === 'object' ? environment : {};
  const weather = env.weather && typeof env.weather === 'object' ? env.weather : {};
  const air = env.air && typeof env.air === 'object' ? env.air : {};
  return {
    envSource: env.source ?? null,
    envCapturedAt: env.capturedAt ?? null,
    envLat: env.lat ?? null,
    envLng: env.lng ?? null,
    envTempC: weather.temperatureC ?? env.temperatureC ?? env.temperature_2m ?? null,
    envHumidityPct: weather.humidityPct ?? env.humidityPct ?? env.relative_humidity_2m ?? null,
    envPressureMsl: weather.pressureMslHpa ?? null,
    envSurfacePressure: weather.surfacePressureHpa ?? null,
    envUvIndex: weather.uvIndex ?? null,
    envWindKmh: weather.windSpeedKmh ?? null,
    envPm25: air.pm25 ?? null,
    envPm10: air.pm10 ?? null,
    envDust: air.dust ?? null,
    envOzone: air.ozone ?? null,
    envNo2: air.nitrogenDioxide ?? null,
    envAqiEu: air.europeanAqi ?? null,
    envAqiUs: air.usAqi ?? null,
    envJson: jsonDump(environment),
  };
}

function flattenAnswers(answers) {
  const a = answers && typeof answers === 'object' ? answers : {};
  const osdi = a.osdi6 && typeof a.osdi6 === 'object' ? a.osdi6 : {};
  const subscales = osdi.subscales && typeof osdi.subscales === 'object' ? osdi.subscales : {};
  const osdiAnswers = Array.isArray(osdi.answers) ? osdi.answers : [];
  // OSDI-6 es binocular (ambos ojos). "Hecho" = se completó el cuestionario.
  const osdi6Hecho =
    a.osdi6Done === true ||
    (osdi.total != null && osdiAnswers.length === 6);
  return {
    sujetoEdad: a.age ?? null,
    sujetoSexo: a.sex ?? null,
    ojoSecoDx: a.dryEyeDiagnosis ?? null,
    tratamientoNoLubricante: a.nonLubeTreatment ?? null,
    usaLubricante: a.usingLubricant ?? null,
    osdi6Hecho,
    osdi6Q1: osdiAnswers[0] ?? null,
    osdi6Q2: osdiAnswers[1] ?? null,
    osdi6Q3: osdiAnswers[2] ?? null,
    osdi6Q4: osdiAnswers[3] ?? null,
    osdi6Q5: osdiAnswers[4] ?? null,
    osdi6Q6: osdiAnswers[5] ?? null,
    osdi6Total: osdi.total ?? null,
    osdi6PosibleOjoSeco: osdi.possibleDryEye ?? null,
    osdi6Discomfort: subscales.discomfort ?? null,
    osdi6VisualFunction: subscales.visualFunction ?? null,
    osdi6Environmental: subscales.environmental ?? null,
    answersJson: jsonDump(answers),
  };
}

function flattenEyeStaining(prefix, eye) {
  const e = eye && typeof eye === 'object' ? eye : {};
  return {
    [`${prefix}ConjIzq`]: e.conjunctivaLeft ?? null,
    [`${prefix}Cornea`]: e.cornea ?? null,
    [`${prefix}ConjDer`]: e.conjunctivaRight ?? null,
    [`${prefix}Parches`]: e.confluentPatches ?? null,
    [`${prefix}Pupilar`]: e.pupillaryArea ?? null,
    [`${prefix}Filamentos`]: e.filaments ?? null,
  };
}

function eyeStainingTotal(eye) {
  const e = eye && typeof eye === 'object' ? eye : {};
  return (
    Number(e.conjunctivaLeft ?? 0) +
    Number(e.cornea ?? 0) +
    Number(e.conjunctivaRight ?? 0) +
    Number(Boolean(e.confluentPatches)) +
    Number(Boolean(e.pupillaryArea)) +
    Number(Boolean(e.filaments))
  );
}

/** Más bajo: 0 = OD, 1 = OS, 3 = iguales. */
function bilateralLowerPair(od, os) {
  const odN = Number(od);
  const osN = Number(os);
  if (!Number.isFinite(odN) || !Number.isFinite(osN)) {
    return { value: null, eye: null };
  }
  const value = Math.min(odN, osN);
  let eye = 3;
  if (odN < osN) eye = 0;
  else if (osN < odN) eye = 1;
  return { value, eye };
}

/** Más alto: 0 = OD, 1 = OS, 3 = iguales. */
function bilateralHigherPair(od, os) {
  const odN = Number(od);
  const osN = Number(os);
  if (!Number.isFinite(odN) || !Number.isFinite(osN)) {
    return { value: null, eye: null };
  }
  const value = Math.max(odN, osN);
  let eye = 3;
  if (odN > osN) eye = 0;
  else if (osN > odN) eye = 1;
  return { value, eye };
}

function flattenExam(exam) {
  const e = exam && typeof exam === 'object' ? exam : {};
  const tbut = e.tbut && typeof e.tbut === 'object' ? e.tbut : {};
  const schirmer = e.schirmer && typeof e.schirmer === 'object' ? e.schirmer : {};
  const staining = e.staining && typeof e.staining === 'object' ? e.staining : {};
  const meibFn =
    e.meibomianFunction && typeof e.meibomianFunction === 'object'
      ? e.meibomianFunction
      : {};
  const meibEx =
    e.meibomianExpressivity && typeof e.meibomianExpressivity === 'object'
      ? e.meibomianExpressivity
      : {};
  const findings =
    e.meibomianFindings && typeof e.meibomianFindings === 'object'
      ? e.meibomianFindings
      : {};
  const margin = findings.margin || {};
  const orifices = findings.orifices || {};
  const plus =
    e.otherCriteria && typeof e.otherCriteria === 'object' ? e.otherCriteria : {};

  const findingCols = {};
  for (const id of MARGIN_FINDINGS) {
    findingCols[`hallazgo_${id}_od`] = margin[id]?.od ?? null;
    findingCols[`hallazgo_${id}_os`] = margin[id]?.os ?? null;
  }
  for (const id of ORIFICE_FINDINGS) {
    findingCols[`orificio_${id}_od`] = orifices[id]?.od ?? null;
    findingCols[`orificio_${id}_os`] = orifices[id]?.os ?? null;
  }
  const plusCols = {};
  for (const id of PLUS_CRITERIA) {
    plusCols[`plus_${id}`] = plus[id] ?? null;
  }

  const tbutOd = tbut.odSec ?? e.tbutOd ?? null;
  const tbutOs = tbut.osSec ?? e.tbutOs ?? null;
  const tbutLow = bilateralLowerPair(tbutOd, tbutOs);

  const schirmerOd = schirmer.odMm ?? e.schirmerOd ?? null;
  const schirmerOs = schirmer.osMm ?? e.schirmerOs ?? null;
  const schirmerLow = bilateralLowerPair(schirmerOd, schirmerOs);

  const tincionTotalOd = staining.od ? eyeStainingTotal(staining.od) : null;
  const tincionTotalOs = staining.os ? eyeStainingTotal(staining.os) : null;
  const tincionHigh = bilateralHigherPair(tincionTotalOd, tincionTotalOs);

  const meibomioFuncionOd = meibFn.od ?? null;
  const meibomioFuncionOs = meibFn.os ?? null;
  const meibFnLow = bilateralLowerPair(meibomioFuncionOd, meibomioFuncionOs);

  const meibomioExpOd = meibEx.od ?? null;
  const meibomioExpOs = meibEx.os ?? null;
  const meibExLow = bilateralLowerPair(meibomioExpOd, meibomioExpOs);

  return {
    tbutOd,
    tbutOs,
    tbutMasBajo: tbutLow.value,
    tbutMasBajoOjo: tbutLow.eye,
    schirmerOd,
    schirmerOs,
    schirmerMasBajo: schirmerLow.value,
    schirmerMasBajoOjo: schirmerLow.eye,
    tincionTotalOd,
    tincionTotalOs,
    tincionMayor: tincionHigh.value,
    tincionMayorOjo: tincionHigh.eye,
    ...flattenEyeStaining('tincionOd', staining.od),
    ...flattenEyeStaining('tincionOs', staining.os),
    meibomioFuncionOd,
    meibomioFuncionOs,
    meibomioFuncionMasBajo: meibFnLow.value,
    meibomioFuncionMasBajoOjo: meibFnLow.eye,
    meibomioExpOd,
    meibomioExpOs,
    meibomioExpMasBajo: meibExLow.value,
    meibomioExpMasBajoOjo: meibExLow.eye,
    ...findingCols,
    ...plusCols,
    examJson: jsonDump(exam),
  };
}

function flattenMeter(meter) {
  const m = meter && typeof meter === 'object' ? meter : {};
  const durationMs = Number(m.durationMs);
  return {
    parpadeos: m.blinkCount ?? m.blinks ?? null,
    incompletos: m.incompleteBlinkCount ?? m.incomplete ?? null,
    bpm: m.bpm ?? null,
    mediaIntervalo: m.meanIntervalSec ?? null,
    medianaIntervalo: m.medianIntervalSec ?? null,
    modaIntervalo: m.modeIntervalSec ?? null,
    arritmiaCv: m.arrhythmiaCvPct ?? null,
    duracionSec: Number.isFinite(durationMs)
      ? Math.round(durationMs / 1000)
      : null,
    umbral: m.apertureThreshold ?? null,
    meterFinishedAt: m.finishedAt ?? null,
    meterJson: jsonDump(meter),
  };
}

function mapProtocolPayload(row) {
  if (!row) {
    return {
      done: false,
      sessionId: null,
      protocol: null,
      createdAt: null,
      completedAt: null,
      status: null,
    };
  }
  return {
    done: true,
    sessionId: row.id,
    protocol: row.project_slug || 'parpadeo',
    createdAt: row.created_at,
    completedAt: row.completed_at,
    status: row.completed_at ? 'completa' : 'parcial',
    ...flattenAnswers(row.answers_json),
    ...flattenLocation('sesionLoc', row.location_json),
    ...flattenEnvironment(row.environment_json),
    ...flattenExam(row.exam_json),
    ...flattenMeter(row.meter_json),
  };
}

function mapResearcherCore(row, counts = {}) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || null,
    nickname: row.nickname || null,
    displayName: row.full_name || row.nickname || row.email,
    age: row.age,
    sex: row.sex || null,
    phone: row.phone,
    registeredAt: row.created_at,
    ophthalmologyProfile: row.ophthalmology_profile,
    specialtySlug: row.specialty_slug,
    specialtyOther: specialtyOtherText(row),
    specialtyLabel: specialtyLabel(row),
    locationDeclined: Boolean(row.location_declined),
    active: Boolean(row.active),
    role: row.role,
    ...flattenLocation('medicoLoc', row.location_json, {
      declined: Boolean(row.location_declined),
    }),
    medicoLocationJson: jsonDump(row.location_json),
    counts: {
      parpadeo: Number(counts.parpadeo || 0),
      parpadeoCompleted: Number(counts.parpadeo_completed || 0),
      interferometria: Number(counts.interferometria || 0),
      completed: Number(counts.completed || 0),
      total: Number(counts.total || 0),
    },
    soloRegistrado: Number(counts.total || 0) === 0,
  };
}

function mapIntervention(row) {
  const core = {
    sessionId: row.id,
    protocol: row.project_slug || 'parpadeo',
    createdAt: row.created_at,
    completedAt: row.completed_at,
    status: row.completed_at ? 'completa' : 'parcial',
    researcherId: row.researcher_id,
    researcherName: row.full_name || row.nickname || row.email,
    researcherEmail: row.email,
    researcherPhone: row.phone,
    researcherAge: row.age,
    researcherSex: row.sex || null,
    researcherNickname: row.nickname,
    researcherSpecialty: specialtyLabel(row),
    researcherProfile: row.ophthalmology_profile,
    researcherSpecialtySlug: row.specialty_slug,
    researcherSpecialtyOther: specialtyOtherText(row),
    researcherRegisteredAt: row.researcher_created_at,
    researcherActive: row.active,
    researcherRole: row.role,
    researcherLocationDeclined: row.location_declined,
    ...flattenLocation('medicoLoc', row.researcher_location_json, {
      declined: Boolean(row.location_declined),
    }),
  };
  return {
    ...core,
    ...flattenAnswers(row.answers_json),
    ...flattenLocation('sesionLoc', row.location_json),
    ...flattenEnvironment(row.environment_json),
    ...flattenExam(row.exam_json),
    ...flattenMeter(row.meter_json),
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

function prefixObject(prefix, obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj || {})) {
    if (key === 'done' || key === 'counts') {
      out[key === 'done' ? `${prefix}Done` : key] = value;
      continue;
    }
    out[`${prefix}${key[0].toUpperCase()}${key.slice(1)}`] = value;
  }
  return out;
}

router.use(adminLimit, adminPinRequired);

router.get('/workbook', async (_req, res) => {
  try {
    // Consistencia: no mostrar ni contar sesiones a medias (abortadas).
    await query(`DELETE FROM parpadeo_sessions WHERE completed_at IS NULL`);

    const researchersResult = await query(
      `SELECT id, email, full_name, age, sex, phone, nickname, location_declined,
              location_json, ophthalmology_profile, specialty_slug, specialty_other,
              role, active, created_at
       FROM researchers
       ORDER BY created_at DESC`,
    );

    const countsResult = await query(
      `SELECT researcher_id,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::int AS completed,
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
              r.email, r.full_name, r.age, r.sex, r.phone, r.nickname, r.created_at AS researcher_created_at,
              r.ophthalmology_profile, r.specialty_slug, r.specialty_other, r.active, r.role,
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
      const parpadeo = mapProtocolPayload(pickLatestSession(sessions, 'parpadeo'));
      const interferometria = mapProtocolPayload(
        pickLatestSession(sessions, 'interferometria'),
      );
      const core = mapResearcherCore(row, countMap.get(row.id) || {});
      return {
        ...core,
        parpadeo,
        interferometria,
        // Fila plana única: médico + últimos protocolos
        flat: {
          ...core,
          ...prefixObject('parpadeo', parpadeo),
          ...prefixObject('interf', interferometria),
        },
      };
    });

    const interventions = sessionsResult.rows.map((row) => {
      const mapped = mapIntervention(row);
      return { ...mapped, flat: mapped };
    });

    const byResearcher = researchers.map((doc) => ({
      researcher: doc,
      interventions: interventions.filter((i) => i.researcherId === doc.id),
    }));

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
      grouped: byResearcher,
    });
  } catch (err) {
    console.error('Admin workbook error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

/** Dispara backup Neon → Drive/S3 (para cron externo o prueba manual). */
router.post('/backup', async (_req, res) => {
  try {
    const { runBackup } = require('../../scripts/backup-db');
    const result = await runBackup();
    res.json({
      ok: true,
      driveId: result.drive?.id || null,
      driveLink: result.drive?.webViewLink || null,
      folderId: result.drive?.folderId || null,
      s3: result.s3,
      bytes: result.bytes,
    });
  } catch (err) {
    console.error('Admin backup error:', err);
    res.status(500).json({ error: 'backup_failed', message: err.message || 'error' });
  }
});

/** Estado de backups en Google Drive (cantidad + último). */
router.get('/backups', async (_req, res) => {
  try {
    const { listDriveBackups } = require('../../scripts/backup-db');
    const info = await listDriveBackups();
    res.json({
      ...info,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Admin backups list error:', err);
    res.status(500).json({
      ok: false,
      configured: true,
      exists: false,
      count: 0,
      folderId: null,
      latest: null,
      error: err.message || 'list_failed',
      checkedAt: new Date().toISOString(),
    });
  }
});

module.exports = router;
