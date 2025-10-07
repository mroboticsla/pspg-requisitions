-- =====================================================
-- SCRIPT DE VERIFICACIÓN Y DIAGNÓSTICO
-- Sistema de Avatares
-- =====================================================

-- 1. Verificar que la tabla user_metadata existe
-- =====================================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'user_metadata';

-- 2. Verificar estructura de la tabla
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_metadata'
ORDER BY ordinal_position;

-- 3. Verificar políticas RLS en user_metadata
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_metadata';

-- 4. Verificar que RLS está habilitado
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'user_metadata';

-- 5. Ver registros actuales en user_metadata
-- =====================================================
SELECT 
  id,
  user_id,
  avatar_url,
  created_at,
  updated_at
FROM user_metadata
ORDER BY created_at DESC;

-- 6. Verificar bucket de avatares
-- =====================================================
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'avatars';

-- 7. Ver políticas del bucket avatars
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%avatar%';

-- 8. Ver archivos subidos al bucket
-- =====================================================
SELECT 
  id,
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC
LIMIT 10;

-- 9. Contar usuarios vs usuarios con avatar
-- =====================================================
SELECT 
  'Total usuarios en auth.users' as descripcion,
  COUNT(*) as cantidad
FROM auth.users

UNION ALL

SELECT 
  'Usuarios con registro en user_metadata' as descripcion,
  COUNT(*) as cantidad
FROM user_metadata

UNION ALL

SELECT 
  'Usuarios con avatar configurado' as descripcion,
  COUNT(*) as cantidad
FROM user_metadata
WHERE avatar_url IS NOT NULL;

-- 10. Ver usuarios sin registro en user_metadata
-- =====================================================
SELECT 
  u.id,
  u.email,
  u.created_at,
  CASE 
    WHEN um.user_id IS NULL THEN 'Sin metadata'
    WHEN um.avatar_url IS NULL THEN 'Sin avatar'
    ELSE 'Con avatar'
  END as estado
FROM auth.users u
LEFT JOIN user_metadata um ON u.id = um.user_id
ORDER BY u.created_at DESC;

-- =====================================================
-- COMANDOS DE REPARACIÓN (Usar solo si es necesario)
-- =====================================================

-- Crear registros faltantes en user_metadata para usuarios existentes
-- NOTA: Ejecutar solo si hay usuarios sin registro en user_metadata
/*
INSERT INTO user_metadata (user_id)
SELECT u.id
FROM auth.users u
LEFT JOIN user_metadata um ON u.id = um.user_id
WHERE um.user_id IS NULL;
*/

-- Verificar permisos de tu usuario actual
-- =====================================================
SELECT 
  auth.uid() as mi_user_id,
  auth.email() as mi_email,
  auth.role() as mi_rol;

-- Ver si puedes insertar en user_metadata (test)
-- NOTA: Esto intentará insertar un registro de prueba
-- Descomenta solo para probar permisos
/*
INSERT INTO user_metadata (user_id, avatar_url)
VALUES (auth.uid(), 'https://test.com/test.jpg')
ON CONFLICT (user_id) DO UPDATE
SET avatar_url = EXCLUDED.avatar_url
RETURNING *;
*/
