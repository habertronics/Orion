/**
 * Sube a Render las variables de backup desde backend/.env
 *
 * 1) En https://dashboard.render.com/u/settings#api-keys crea una API Key
 * 2) Añade a backend/.env:  RENDER_API_KEY=rnd_...
 * 3) npm run db:backup:sync-render
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API = 'https://api.render.com/v1';

function need(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Falta ${key} en backend/.env`);
  return v;
}

async function render(pathname, options = {}) {
  const res = await fetch(`${API}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${need('RENDER_API_KEY')}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`Render ${res.status} ${pathname}: ${text.slice(0, 400)}`);
  }
  return json;
}

async function listServices() {
  const rows = await render('/services?limit=50');
  return (rows || []).map((row) => row.service || row).filter(Boolean);
}

async function putEnvVars(serviceId, vars) {
  // Replace env vars list (merge with existing keys we care about via full put of these keys)
  const body = Object.entries(vars).map(([key, value]) => ({ key, value }));
  return render(`/services/${serviceId}/env-vars`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function getEnvVars(serviceId) {
  const rows = await render(`/services/${serviceId}/env-vars`);
  const map = {};
  for (const row of rows || []) {
    const item = row.envVar || row;
    if (item?.key) map[item.key] = item.value;
  }
  return map;
}

async function mergeEnvVars(serviceId, patch) {
  const current = await getEnvVars(serviceId);
  const next = { ...current, ...patch };
  // Render PUT replaces the whole set — keep all existing keys
  await putEnvVars(serviceId, next);
}

async function main() {
  const backupVars = {
    BACKUP_TO_DRIVE: '1',
    BACKUP_TO_S3: process.env.BACKUP_TO_S3 || '0',
    GOOGLE_DRIVE_CLIENT_ID: need('GOOGLE_DRIVE_CLIENT_ID'),
    GOOGLE_DRIVE_CLIENT_SECRET: need('GOOGLE_DRIVE_CLIENT_SECRET'),
    GOOGLE_DRIVE_REFRESH_TOKEN: need('GOOGLE_DRIVE_REFRESH_TOKEN'),
  };
  if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
    backupVars.GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
  }
  if (process.env.DATABASE_URL) {
    backupVars.DATABASE_URL = process.env.DATABASE_URL;
  }

  console.log('Listando servicios Render…');
  const services = await listServices();
  const names = services.map((s) => s.name);
  console.log('  ', names.join(', ') || '(ninguno)');

  const targets = services.filter(
    (s) =>
      s.name === 'Orion' ||
      s.name === 'habertronic-orion-api' ||
      s.name === 'habertronic-orion-backup' ||
      s.type === 'cron_job' ||
      (s.name || '').includes('orion-backup'),
  );

  if (!targets.length) {
    throw new Error(
      'No encontré Orion ni habertronic-orion-backup. Revisa el dashboard de Render.',
    );
  }

  for (const svc of targets) {
    console.log(`Actualizando env en ${svc.name} (${svc.id})…`);
    await mergeEnvVars(svc.id, backupVars);
    console.log('  OK');
  }

  console.log('Listo. En el cron/API de Render ya quedaron las claves de Drive.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
