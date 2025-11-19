require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('Error: No se encontró POSTGRES_URL en .env.local');
  console.error('Asegúrate de tener el archivo .env.local con la variable de conexión a la base de datos.');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigration() {
  try {
    console.log('Conectando a la base de datos...');
    await client.connect();

    const sqlPath = path.join(__dirname, 'create-job-ads-tables.sql');
    console.log(`Leyendo archivo SQL desde: ${sqlPath}`);
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('Ejecutando script SQL...');
    await client.query(sqlContent);
    
    console.log('✅ Tablas y políticas creadas correctamente.');

  } catch (err) {
    console.error('❌ Error ejecutando la migración:', err);
  } finally {
    await client.end();
  }
}

runMigration();
