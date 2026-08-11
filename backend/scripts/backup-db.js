/**
 * Dump lógico de Neon → archivo local (+ opcional S3 y Google Drive).
 *
 * Uso:
 *   npm run db:backup
 *
 * Requiere DATABASE_URL en backend/.env
 * Opcional:
 *   BACKUP_TO_S3=1 + AWS_* + BACKUP_S3_BUCKET
 *   BACKUP_TO_DRIVE=1 + GOOGLE_DRIVE_* (ver google-drive-auth.js)
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const gzip = promisify(zlib.gzip);

const OUT_DIR = path.join(__dirname, '..', 'backups');

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function jsonSafe(value) {
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString('base64');
  return value;
}

async function dumpDatabase(pool) {
  const tablesResult = await pool.query(
    `SELECT tablename
     FROM pg_tables
     WHERE schemaname = 'public'
     ORDER BY tablename`,
  );
  const tables = tablesResult.rows.map((r) => r.tablename);
  const payload = {
    format: 'habertronic-orion-backup-v1',
    createdAt: new Date().toISOString(),
    source: 'neon',
    tables: {},
  };

  for (const table of tables) {
    const { rows } = await pool.query(`SELECT * FROM ${quoteIdent(table)}`);
    payload.tables[table] = rows.map((row) => {
      const out = {};
      for (const [key, value] of Object.entries(row)) {
        out[key] = jsonSafe(value);
      }
      return out;
    });
    console.log(`  · ${table}: ${rows.length} filas`);
  }

  return payload;
}

function quoteIdent(name) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Nombre de tabla inválido: ${name}`);
  }
  return `"${name}"`;
}

async function writeLocal(payload) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const base = `orion-backup-${stamp()}`;
  const jsonPath = path.join(OUT_DIR, `${base}.json`);
  const gzPath = path.join(OUT_DIR, `${base}.json.gz`);
  const raw = JSON.stringify(payload, null, 2);
  fs.writeFileSync(jsonPath, raw, 'utf8');
  const compressed = await gzip(Buffer.from(raw, 'utf8'));
  fs.writeFileSync(gzPath, compressed);
  return { jsonPath, gzPath, bytes: compressed.length, base };
}

async function uploadS3(filePath, key) {
  const bucket = process.env.BACKUP_S3_BUCKET;
  if (!bucket) throw new Error('Falta BACKUP_S3_BUCKET');

  let S3Client;
  let PutObjectCommand;
  try {
    ({ S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'));
  } catch {
    throw new Error(
      'Instala AWS SDK: cd backend && npm install @aws-sdk/client-s3',
    );
  }

  const client = new S3Client({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
  });
  const body = fs.readFileSync(filePath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'application/gzip',
      ServerSideEncryption: 'AES256',
    }),
  );
  return `s3://${bucket}/${key}`;
}

function driveCredentialsReady() {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
      process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
      process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  );
}

function createDriveClient() {
  let google;
  try {
    google = require('googleapis').google;
  } catch {
    throw new Error('Instala googleapis: cd backend && npm install googleapis');
  }
  if (!driveCredentialsReady()) {
    throw new Error(
      'Faltan GOOGLE_DRIVE_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN. Corre: npm run db:backup:drive-auth',
    );
  }
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
  return google.drive({ version: 'v3', auth: oauth2 });
}

async function findDriveFolderId(drive, folderName) {
  const safeName = String(folderName || 'Orion-Backups').replace(/'/g, "\\'");
  const listed = await drive.files.list({
    q: `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
    pageSize: 5,
  });
  return listed.data.files?.[0]?.id || null;
}

async function ensureDriveFolder(drive, folderName) {
  const existing = await findDriveFolderId(drive, folderName);
  if (existing) return existing;
  const created = await drive.files.create({
    requestBody: {
      name: folderName || 'Orion-Backups',
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id, name',
  });
  console.log(`   Carpeta Drive creada: ${created.data.name} (${created.data.id})`);
  return created.data.id;
}

/** Lista backups en Drive (sin crear carpeta). Para el tablero de estatus. */
async function listDriveBackups() {
  if (!driveCredentialsReady()) {
    return {
      ok: false,
      configured: false,
      exists: false,
      count: 0,
      folderId: null,
      latest: null,
      error: 'drive_not_configured',
    };
  }

  const drive = createDriveClient();
  let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
  if (!folderId) {
    folderId = await findDriveFolderId(drive, 'Orion-Backups');
  }
  if (!folderId) {
    return {
      ok: true,
      configured: true,
      exists: false,
      count: 0,
      folderId: null,
      latest: null,
      error: null,
    };
  }

  const files = [];
  let pageToken;
  do {
    const listed = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and name contains 'orion-backup'`,
      fields: 'nextPageToken, files(id, name, createdTime, modifiedTime, size, webViewLink)',
      orderBy: 'createdTime desc',
      pageSize: 100,
      spaces: 'drive',
      pageToken: pageToken || undefined,
    });
    files.push(...(listed.data.files || []));
    pageToken = listed.data.nextPageToken;
  } while (pageToken);

  const latestFile = files[0] || null;
  return {
    ok: true,
    configured: true,
    exists: files.length > 0,
    count: files.length,
    folderId,
    latest: latestFile
      ? {
          id: latestFile.id,
          name: latestFile.name,
          createdAt: latestFile.createdTime || null,
          modifiedAt: latestFile.modifiedTime || null,
          bytes: latestFile.size != null ? Number(latestFile.size) : null,
          webViewLink: latestFile.webViewLink || null,
        }
      : null,
    error: null,
  };
}

async function uploadDrive(filePath, fileName) {
  const drive = createDriveClient();
  let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

  if (!folderId) {
    folderId = await ensureDriveFolder(drive, 'Orion-Backups');
  }

  const media = {
    mimeType: 'application/gzip',
    body: fs.createReadStream(filePath),
  };
  const requestBody = {
    name: fileName,
    parents: [folderId],
  };

  const res = await drive.files.create({
    requestBody,
    media,
    fields: 'id, name, webViewLink, parents',
    supportsAllDrives: true,
  });
  return { ...res.data, folderId };
}

async function runBackup() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Falta DATABASE_URL en backend/.env');
  }

  console.log('1) Leyendo tablas de Neon…');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
  });

  try {
    const payload = await dumpDatabase(pool);
    console.log('2) Escribiendo copia local…');
    const local = await writeLocal(payload);
    console.log(`   JSON: ${local.jsonPath}`);
    console.log(`   GZ:   ${local.gzPath} (${local.bytes} bytes)`);

    const key = `orion-backups/${path.basename(local.gzPath)}`;
    const fileName = path.basename(local.gzPath);
    const result = {
      localGz: local.gzPath,
      bytes: local.bytes,
      s3: null,
      drive: null,
    };

    if (process.env.BACKUP_TO_S3 === '1') {
      console.log('3) Subiendo a AWS S3…');
      result.s3 = await uploadS3(local.gzPath, key);
      console.log(`   OK ${result.s3}`);
    } else {
      console.log('3) S3 omitido (BACKUP_TO_S3!=1)');
    }

    if (process.env.BACKUP_TO_DRIVE === '1') {
      console.log('4) Subiendo a Google Drive…');
      const info = await uploadDrive(local.gzPath, fileName);
      result.drive = info;
      console.log(`   Carpeta: Orion-Backups (${info.folderId || '—'})`);
      console.log(`   OK id=${info.id} ${info.webViewLink || ''}`);
    } else {
      console.log('4) Drive omitido (BACKUP_TO_DRIVE!=1)');
    }

    console.log('Listo.');
    return result;
  } finally {
    await pool.end();
  }
}

module.exports = { runBackup, listDriveBackups };

if (require.main === module) {
  runBackup().catch((err) => {
    console.error('Backup falló:', err.message || err);
    process.exit(1);
  });
}