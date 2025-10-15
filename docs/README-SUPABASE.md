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