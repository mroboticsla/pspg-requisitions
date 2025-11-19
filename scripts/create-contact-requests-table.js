require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('Error: No se encontró POSTGRES_URL en .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString,
  // Supabase requiere SSL para conexiones externas, pero a veces 'rejectUnauthorized: false' es necesario en desarrollo local
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createContactRequestsTable() {
  try {
    console.log('Conectando a la base de datos...');
    await client.connect();

    console.log('Creando tabla "contact_requests"...');
    
    // 1. Crear la tabla
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.contact_requests (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;
    await client.query(createTableQuery);
    console.log('✅ Tabla creada correctamente.');

    // 2. Habilitar RLS (Row Level Security)
    await client.query(`ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;`);
    console.log('✅ RLS habilitado.');

    // 3. Crear políticas de seguridad
    
    // Política: Permitir inserción pública (anon) y autenticada
    // Usamos DO $$ ... $$ para evitar errores si la política ya existe
    const insertPolicy = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'contact_requests' AND policyname = 'Permitir insertar a todos'
        ) THEN
          CREATE POLICY "Permitir insertar a todos" ON public.contact_requests
          FOR INSERT
          TO public
          WITH CHECK (true);
        END IF;
      END
      $$;
    `;
    await client.query(insertPolicy);
    console.log('✅ Política de inserción creada (pública).');

    // Política: Permitir lectura solo a roles de servicio (por defecto RLS deniega todo lo demás)
    // Si quisieras que los admins lean, necesitarías una política específica.
    // Por ahora, dejaremos que solo el "service_role" (backend) pueda leer, lo cual es seguro por defecto al no haber política de SELECT para 'anon'/'authenticated'.

    console.log('\n¡Todo listo! La tabla "contact_requests" está preparada para recibir datos.');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

createContactRequestsTable();
