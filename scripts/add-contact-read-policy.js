require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('Error: No se encontró POSTGRES_URL en .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function addPolicy() {
  try {
    await client.connect();
    console.log('Conectado a la BD.');

    // Política para permitir SELECT a usuarios autenticados que sean admin o superadmin
    // Asumiendo que existe una función o forma de verificar roles.
    // Las instrucciones dicen: "Database has get_user_role(uuid) and current_user_role()"
    // Vamos a intentar usar una política que verifique el rol en la tabla 'profiles' o usando la función helper si existe.
    // Una forma común en Supabase es:
    // auth.uid() IN (SELECT id FROM profiles WHERE role_id IN (SELECT id FROM roles WHERE name IN ('admin', 'superadmin')))
    
    // O si existe la función current_user_role():
    // current_user_role() IN ('admin', 'superadmin')

    const policySQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'contact_requests' AND policyname = 'Permitir lectura a admins'
        ) THEN
          CREATE POLICY "Permitir lectura a admins" ON public.contact_requests
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.profiles p
              JOIN public.roles r ON p.role_id = r.id
              WHERE p.id = auth.uid()
              AND r.name IN ('admin', 'superadmin')
            )
          );
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'contact_requests' AND policyname = 'Permitir update a admins'
        ) THEN
          CREATE POLICY "Permitir update a admins" ON public.contact_requests
          FOR UPDATE
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.profiles p
              JOIN public.roles r ON p.role_id = r.id
              WHERE p.id = auth.uid()
              AND r.name IN ('admin', 'superadmin')
            )
          );
        END IF;
      END
      $$;
    `;

    await client.query(policySQL);
    console.log('✅ Políticas de lectura/escritura para admins agregadas.');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

addPolicy();
