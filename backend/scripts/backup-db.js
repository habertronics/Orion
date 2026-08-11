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

async function ensureDriveFolder(drive, folderName) {
  const safeName = String(folderName || 'Orion-Backups').replace(/'/g, "\\'");
  const listed = await drive.files.list({
    q: `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
    pageSize: 5,
  });
  if (listed.data.files?.length) {
    return listed.data.files[0].id;
  }
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

async function uploadDrive(filePath, fileName) {
  let google;
  try {
    google = require('googleapis').google;
  } catch {
    throw new Error('Instala googleapis: cd backend && npm install googleapis');
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Faltan GOOGLE_DRIVE_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN. Corre: npm run db:backup:drive-auth',
    );
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  const drive = google.drive({ version: 'v3', auth: oauth2 });

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

async function main() {
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

    if (process.env.BACKUP_TO_S3 === '1') {
      console.log('3) Subiendo a AWS S3…');
      const uri = await uploadS3(local.gzPath, key);
      console.log(`   OK ${uri}`);
    } else {
      console.log('3) S3 omitido (BACKUP_TO_S3!=1)');
    }

    if (process.env.BACKUP_TO_DRIVE === '1') {
      console.log('4) Subiendo a Google Drive…');
      const info = await uploadDrive(local.gzPath, fileName);
      console.log(`   Carpeta: Orion-Backups (${info.folderId || '—'})`);
      console.log(`   OK id=${info.id} ${info.webViewLink || ''}`);
    } else {
      console.log('4) Drive omitido (BACKUP_TO_DRIVE!=1)');
    }

    console.log('Listo.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Backup falló:', err.message || err);
  process.exit(1);
});
