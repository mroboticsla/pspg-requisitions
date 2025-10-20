-- Script para verificar roles necesarios para el nuevo flujo de autenticación
-- Ejecutar en Supabase SQL Editor antes de implementar el nuevo flujo

-- 1. Verificar que los roles necesarios existen
SELECT id, name, permissions 
FROM public.roles 
WHERE name IN ('partner', 'candidate', 'admin', 'superadmin')
ORDER BY name;

-- Resultado esperado: 4 filas con estos roles
-- Si falta alguno, ejecutar los INSERT correspondientes

-- 2. Verificar políticas RLS en profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public'
ORDER BY policyname;

-- 3. Verificar políticas RLS en company_users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'company_users' 
AND schemaname = 'public'
ORDER BY policyname;

-- 4. Si es necesario, agregar política para que usuarios vean su propio perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());
    
    RAISE NOTICE 'Política "Users can view own profile" creada exitosamente';
  ELSE
    RAISE NOTICE 'Política "Users can view own profile" ya existe';
  END IF;
END $$;

-- 5. Si es necesario, agregar política para que usuarios actualicen su propio perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
    
    RAISE NOTICE 'Política "Users can update own profile" creada exitosamente';
  ELSE
    RAISE NOTICE 'Política "Users can update own profile" ya existe';
  END IF;
END $$;

-- 6. Verificar que RLS está habilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'roles', 'company_users', 'companies')
AND schemaname = 'public';

-- Todos deben tener rowsecurity = true
