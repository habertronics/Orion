require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

async function init() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Falta DATABASE_URL en backend/.env');
  }

  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Creando tablas en Neon (proyecto Orión)...');
  await pool.query(sql);
  console.log('Esquema aplicado correctamente.');
  await pool.end();
}

init().catch((err) => {
  console.error('Error al inicializar la base de datos:', err.message);
  process.exit(1);
});
