/**
 * Autorización única para subir backups a TU Google Drive.
 *
 * 1) Google Cloud Console → APIs → activar "Google Drive API"
 * 2) Credenciales → "ID de cliente OAuth" tipo "Aplicación de escritorio"
 *    (añade redirect URI: http://127.0.0.1:53682/oauth2callback)
 * 3) En backend/.env:
 *      GOOGLE_DRIVE_CLIENT_ID=...
 *      GOOGLE_DRIVE_CLIENT_SECRET=...
 * 4) npm run db:backup:drive-auth
 * 5) Se abre el navegador; al terminar verás GOOGLE_DRIVE_REFRESH_TOKEN
 * 6) (Opcional) Carpeta en Drive → ID en URL → GOOGLE_DRIVE_FOLDER_ID=...
 */
const http = require('http');
const path = require('path');
const { URL } = require('url');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const REDIRECT = 'http://127.0.0.1:53682/oauth2callback';
const PORT = 53682;

async function main() {
  let google;
  try {
    google = require('googleapis').google;
  } catch {
    console.error('Instala primero: npm install googleapis');
    process.exit(1);
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error(
      'Pon GOOGLE_DRIVE_CLIENT_ID y GOOGLE_DRIVE_CLIENT_SECRET en backend/.env',
    );
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT);
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive.file'],
  });

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const u = new URL(req.url, REDIRECT);
        if (u.pathname !== '/oauth2callback') {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const err = u.searchParams.get('error');
        if (err) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h1>Error: ${err}</h1>`);
          reject(new Error(err));
          server.close();
          return;
        }
        const c = u.searchParams.get('code');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          '<h1>Listo</h1><p>Ya puedes cerrar esta ventana y volver a la terminal.</p>',
        );
        resolve(c);
        server.close();
      } catch (e) {
        reject(e);
        server.close();
      }
    });
    server.listen(PORT, '127.0.0.1', () => {
      console.log('\nAbre esta URL (o cópiala al navegador):\n');
      console.log(authUrl);
      console.log('\nEsperando autorización en', REDIRECT, '…\n');
      // Windows
      const { exec } = require('child_process');
      exec(`start "" "${authUrl}"`, () => {});
    });
  });

  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      'No vino refresh_token. En Google Account → Apps con acceso, quita esta app y reintenta.',
    );
    process.exit(1);
  }

  console.log('\nAñade esto a backend/.env:\n');
  console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log('\nLuego activa BACKUP_TO_DRIVE=1 y corre: npm run db:backup\n');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
