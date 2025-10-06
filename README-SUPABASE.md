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

## Actualización de Políticas RLS

```
/******************************************************************
* SCRIPT COMPLETO DE SEGURIDAD RLS PARA SUPABASE        *
* *
* Tablas involucradas: public.profiles, public.roles            *
* Roles de la App: superadmin, admin, partner, candidate        *
* *
******************************************************************/

-- 1. HABILITACIÓN DE RLS EN LAS TABLAS
-- Este es el primer paso, asegura que ninguna tabla sea accesible sin una política.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;


-- 2. FUNCIÓN AUXILIAR PARA OBTENER EL ROL DEL USUARIO
-- Esta función es crucial para que las políticas puedan verificar el rol de un usuario.
-- La creamos con SECURITY DEFINER para que pueda leer la tabla de roles sin ser bloqueada por RLS.
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS TEXT AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT r.name INTO role_name
  FROM public.profiles p
  JOIN public.roles r ON p.role_id = r.id
  WHERE p.id = user_id;
  RETURN role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


/******************************************************************
* POLÍTICAS PARA LA TABLA "profiles"                    *
******************************************************************/

-- Primero, eliminamos las políticas existentes en "profiles" para evitar duplicados.
DROP POLICY IF EXISTS "Admins can view all profiles, users can view their own." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile." ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can delete profiles." ON public.profiles;
-- (También borramos las políticas antiguas por si aún existen)
DROP POLICY IF EXISTS "Users can view profiles based on role." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;


-- POLÍTICA DE LECTURA (SELECT)
-- Permite a 'superadmin' y 'admin' ver todos los perfiles.
-- Permite a los demás usuarios (partner, candidate) ver únicamente su propio perfil.
CREATE POLICY "Admins can view all profiles, users can view their own."
ON public.profiles FOR SELECT
USING (
  (get_user_role(auth.uid()) IN ('superadmin', 'admin'))
  OR
  (auth.uid() = id)
);

-- POLÍTICA DE ACTUALIZACIÓN (UPDATE)
-- Permite a los usuarios actualizar su propio perfil.
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- POLÍTICA DE ACTUALIZACIÓN ADICIONAL PARA ADMINS
-- Permite a 'superadmin' y 'admin' actualizar el perfil de CUALQUIER usuario.
CREATE POLICY "Admins can update any profile."
ON public.profiles FOR UPDATE
USING (get_user_role(auth.uid()) IN ('superadmin', 'admin'));


-- POLÍTICA DE BORRADO (DELETE)
-- EXTREMADAMENTE RESTRICTIVA: Solo un 'superadmin' puede borrar un perfil.
-- Nota: La eliminación de un usuario desde el panel de Supabase Auth también eliminará su perfil
-- gracias a la relación "ON DELETE CASCADE" que definimos en la tabla.
CREATE POLICY "Superadmins can delete profiles."
ON public.profiles FOR DELETE
USING (get_user_role(auth.uid()) = 'superadmin');

-- NOTA SOBRE INSERTAR (INSERT):
-- No se necesita una política de INSERT para la tabla `profiles`. Supabase crea automáticamente
-- el perfil de un usuario cuando este se registra, a través de un "trigger" en la tabla `auth.users`.
-- Esto es más seguro y eficiente.


/******************************************************************
* POLÍTICAS PARA LA TABLA "roles"                       *
******************************************************************/

-- Primero, eliminamos las políticas existentes en "roles".
DROP POLICY IF EXISTS "Authenticated users can view roles." ON public.roles;


-- POLÍTICA DE LECTURA (SELECT)
-- Permite a CUALQUIER usuario autenticado leer la lista de roles.
-- Esto es útil si necesitas mostrar los roles en algún formulario del frontend.
CREATE POLICY "Authenticated users can view roles."
ON public.roles FOR SELECT
TO authenticated
USING (true);

-- NOTA SOBRE INSERT, UPDATE, DELETE en "roles":
-- A propósito NO creamos políticas para estas acciones. Esto significa que la única
-- forma de crear, modificar o eliminar roles es desde el panel de Supabase o usando
-- la clave de administrador (service_role_key) en un entorno seguro (backend).
-- Esta es la práctica recomendada para proteger la estructura de roles.
```
