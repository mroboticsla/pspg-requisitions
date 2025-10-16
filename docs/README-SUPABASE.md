# Supabase: configuración de base de datos y storage

Este documento centraliza la configuración necesaria en Supabase: tablas, RLS, funciones y storage para avatares. Los scripts de apoyo viven en `scripts/`.

## Índice

- [Tablas principales](#tablas-principales)
- [Configuración SQL](#configuración-sql)
- [Políticas RLS](#políticas-rls)
- [Storage: Avatares](#storage-avatares)
- [Funciones RPC utilizadas por el frontend](#funciones-rpc-utilizadas-por-el-frontend)
- [Tips y checks útiles](#tips-y-checks-útiles)
- [Seguridad](#seguridad)

## Tablas principales

- `public.roles` → catálogo de roles con `permissions jsonb` opcional
- `public.profiles` → perfil público ligado a `auth.users` (FK `id`), incluye `role_id`, `metadata jsonb`, `updated_at`

Inicialización recomendada (roles base): `superadmin`, `admin`, `partner`, `candidate`.

Puedes crear estas tablas y datos con tu migración o ejecutando fragmentos en el SQL Editor. Mantén índices según necesidad.

### Configuración SQL

````sql
# Configuración de base de datos con Supabase

## Roles y Usuarios

```
-- 1. Tabla de Roles
-- Almacena los diferentes roles y sus permisos asociados.
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  permissions jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.roles IS 'Almacena los roles de usuario y sus permisos en formato JSON.';
COMMENT ON COLUMN public.roles.permissions IS 'Reglas de acceso (ej: {"modules": {"articles": ["create", "read"]}}).';

-- 2. Tabla de Perfiles
-- Extiende la tabla auth.users para añadir información pública y de la aplicación.
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  role_id uuid REFERENCES public.roles ON DELETE SET NULL,
  metadata jsonb,
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Almacena la información del perfil público de un usuario, vinculada a auth.users.';
COMMENT ON COLUMN public.profiles.role_id IS 'FK a la tabla de roles para definir los permisos del usuario.';

-- 3. (OPCIONAL PERO RECOMENDADO) Insertar roles iniciales
-- Es una buena práctica tener roles base al iniciar el proyecto.
INSERT INTO public.roles (name, permissions)
VALUES
  ('superadmin',  '{"description": "Acceso total a nivel de sistema. Puede gestionar admins."}'),
  ('admin',       '{"description": "Acceso administrativo a la plataforma. Gestiona partners y candidatos."}'),
  ('partner',     '{"description": "Acceso para socios. Puede ver candidatos y gestionar sus propias ofertas."}'),
  ('candidate',   '{"description": "Acceso para candidatos. Puede ver ofertas y gestionar su perfil."}');
```

## Políticas RLS

Habilitar RLS y crear funciones/políticas:

1) Habilitar RLS en tablas
- `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`
- `ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;`

2) Función auxiliar para conocer el rol
- `public.get_user_role(user_id uuid) RETURNS text SECURITY DEFINER` → lee `profiles`↔`roles`
- `public.current_user_role()` → wrapper sobre `auth.uid()` que retorna el nombre del rol

3) Políticas sugeridas
- profiles SELECT: admins ven todos; otros solo su propio registro
- profiles UPDATE: el usuario actualiza su propio registro; admins pueden actualizar cualquiera
- profiles DELETE: solo `superadmin`
- roles SELECT: `TO authenticated USING (true)`

Consulta ejemplos completos en este repositorio (historial previo) o reusa tus migraciones. Si necesitas copiar/pegar, crea un script SQL con estas piezas para tu entorno.

## Storage: Avatares

Bucket requerido: `avatars` (público).

Ruta por usuario: `avatars/user-{userId}/avatar.webp`.

Políticas en `storage.objects` sugeridas:
- Lectura pública de `avatars/*`
- Insert/Update/Delete: solo el usuario autenticado sobre su propio prefijo `user-{auth.uid()}/...`

Scripts de apoyo:
- `scripts/setup-avatars.sql` → crea bucket/policies/campo `avatar_url` y políticas necesarias
- `scripts/verify-avatars.sql` → queries de verificación

Troubleshooting rápido:
- Error 400/403 al acceder a imagen pública → verifica que el bucket exista y sea público; vuelve a ejecutar `setup-avatars.sql`
- Políticas faltantes → ver `pg_policies` para `storage.objects`

## Funciones RPC utilizadas por el frontend

- `public.current_user_role()` → usada por `lib/getCurrentUserRole.ts`

Otorga `GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;` y revoca de `PUBLIC`.

## Tips y checks útiles

- Ver roles existentes: `SELECT id, name FROM public.roles;`
- Ver perfil con metadata: `SELECT id, role_id, metadata FROM public.profiles LIMIT 10;`
- Ver políticas: `SELECT * FROM pg_policies WHERE tablename IN ('profiles','roles');`
- Objetos en storage: `SELECT * FROM storage.objects WHERE bucket_id = 'avatars' ORDER BY created_at DESC;`

## Seguridad

- Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` al cliente
- Endpoints server-side validan rol y/o `ADMIN_SECRET`
- RLS debe ser tu última línea de defensa; valida también en backend
````

## Creación de tablas para manejo de empresas

```
-- =====================================================
-- 1. Tabla de Empresas (Companies)
-- =====================================================
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  tax_id text UNIQUE, -- RFC o NIT
  industry text,
  website text,
  logo_url text,
  address jsonb, -- {"street": "", "city": "", "state": "", "zip": "", "country": ""}
  contact_info jsonb, -- {"email": "", "phone": "", "mobile": ""}
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb, -- Información adicional flexible
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.companies IS 'Catálogo de empresas/clientes que pueden crear requisiciones.';
COMMENT ON COLUMN public.companies.tax_id IS 'RFC (México) o NIT/Tax ID único de la empresa.';
COMMENT ON COLUMN public.companies.address IS 'Dirección en formato JSON para flexibilidad.';
COMMENT ON COLUMN public.companies.metadata IS 'Datos adicionales: tamaño empresa, sector específico, etc.';

-- Índices recomendados
CREATE INDEX idx_companies_name ON public.companies(name);
CREATE INDEX idx_companies_is_active ON public.companies(is_active);

-- =====================================================
-- 2. Tabla de Usuarios por Empresa (Company Users)
-- =====================================================
CREATE TABLE public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  role_in_company text DEFAULT 'member', -- 'admin', 'member', 'viewer', etc.
  permissions jsonb, -- Permisos específicos dentro de la empresa
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users, -- Quién lo asignó
  is_active boolean NOT NULL DEFAULT true,
  
  UNIQUE(company_id, user_id)
);

COMMENT ON TABLE public.company_users IS 'Relación muchos-a-muchos: qué usuarios (partners) tienen acceso a qué empresas.';
COMMENT ON COLUMN public.company_users.role_in_company IS 'Rol del usuario dentro de esta empresa: admin (gestiona usuarios), member (crea requisiciones), viewer (solo lectura).';
COMMENT ON COLUMN public.company_users.permissions IS 'Permisos adicionales granulares si es necesario.';

-- Índices recomendados
CREATE INDEX idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX idx_company_users_active ON public.company_users(is_active) WHERE is_active = true;

-- =====================================================
-- 3. Trigger para updated_at en companies
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4. Habilitar RLS
-- =====================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. Políticas RLS para companies
-- =====================================================

-- Lectura: admins ven todas; partners solo las asignadas
CREATE POLICY "Admins can view all companies"
ON public.companies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Partners can view their assigned companies"
ON public.companies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = companies.id
    AND cu.user_id = auth.uid()
    AND cu.is_active = true
  )
);

-- Inserción: solo admins
CREATE POLICY "Only admins can create companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

-- Actualización: solo admins
CREATE POLICY "Only admins can update companies"
ON public.companies FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

-- Eliminación: solo superadmin
CREATE POLICY "Only superadmins can delete companies"
ON public.companies FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name = 'superadmin'
  )
);

-- =====================================================
-- 6. Políticas RLS para company_users
-- =====================================================

-- Lectura: admins ven todo; partners solo sus asignaciones
CREATE POLICY "Admins can view all company assignments"
ON public.company_users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Users can view their own company assignments"
ON public.company_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Inserción y actualización: solo admins
CREATE POLICY "Only admins can assign users to companies"
ON public.company_users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Only admins can update company assignments"
ON public.company_users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

-- Eliminación: solo admins
CREATE POLICY "Only admins can remove company assignments"
ON public.company_users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

-- =====================================================
-- 7. Función RPC útil: obtener empresas del usuario actual
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_companies()
RETURNS TABLE (
  company_id uuid,
  company_name text,
  role_in_company text,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    cu.role_in_company,
    cu.is_active
  FROM public.company_users cu
  JOIN public.companies c ON cu.company_id = c.id
  WHERE cu.user_id = auth.uid()
  AND cu.is_active = true
  AND c.is_active = true
  ORDER BY c.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_companies() TO authenticated;

COMMENT ON FUNCTION public.get_user_companies IS 'Retorna las empresas asignadas al usuario actual (autenticado).';
```

Script de Inserción de Datos de Ejemplo

```
INSERT INTO public.companies (name, legal_name, tax_id)
VALUES ('Acme Corp', 'Acme Corporation S.A. de C.V.', 'ACM123456ABC');
```

```
INSERT INTO public.company_users (company_id, user_id, role_in_company)
VALUES ('<company_uuid>', '<partner_profile_uuid>', 'admin');
```

