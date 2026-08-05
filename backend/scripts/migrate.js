require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

async function run() {
  const file = process.argv[2] || 'migration-002-projects.sql';
  const sqlPath = path.join(__dirname, '..', 'sql', file);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log(`Aplicando ${file}...`);
  await pool.query(sql);
  console.log('Migración aplicada.');
  await pool.end();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
