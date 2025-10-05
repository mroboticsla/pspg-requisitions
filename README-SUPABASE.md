# Configuración de base de datos con Supabase

## Roles y Usuarios

´´´
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
  ('superadmin', '{"description": "Acceso total a todas las funciones."}'),
  ('editor',     '{"modules": {"articles": ["create", "read", "update"], "media": ["upload"]}}'),
  ('viewer',     '{"modules": {"articles": ["read"]}}');
´´´