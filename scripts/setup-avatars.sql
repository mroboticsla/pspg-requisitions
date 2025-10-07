-- =====================================================
-- CONFIGURACIÓN DE AVATARES DE USUARIO
-- =====================================================
-- Este script configura todo lo necesario para el sistema
-- de avatares de usuario en Supabase
-- =====================================================

-- 1. Crear tabla user_metadata si no existe
-- =====================================================
CREATE TABLE IF NOT EXISTS user_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

COMMENT ON TABLE user_metadata IS 
'Tabla para almacenar metadatos adicionales de usuarios (avatar, preferencias, etc.)';

COMMENT ON COLUMN user_metadata.user_id IS 
'Referencia al usuario en auth.users';

COMMENT ON COLUMN user_metadata.avatar_url IS 
'URL pública del avatar del usuario almacenado en Supabase Storage (bucket: avatars)';

-- 2. Agregar columna avatar_url si la tabla ya existía pero no tenía esta columna
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metadata' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_metadata ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 3. Crear índice para búsquedas rápidas por user_id
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_metadata_user_id 
ON user_metadata(user_id);

-- 4. Crear índice para búsquedas rápidas por avatar_url
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_metadata_avatar_url 
ON user_metadata(avatar_url) 
WHERE avatar_url IS NOT NULL;

-- 5. Habilitar RLS en la tabla
-- =====================================================
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para user_metadata
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own metadata" ON user_metadata;
DROP POLICY IF EXISTS "Users can insert their own metadata" ON user_metadata;
DROP POLICY IF EXISTS "Users can update their own metadata" ON user_metadata;

-- Los usuarios pueden ver su propia metadata
CREATE POLICY "Users can view their own metadata"
ON user_metadata FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Los usuarios pueden insertar su propia metadata
CREATE POLICY "Users can insert their own metadata"
ON user_metadata FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar su propia metadata
CREATE POLICY "Users can update their own metadata"
ON user_metadata FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. Función para actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para actualizar updated_at
-- =====================================================
DROP TRIGGER IF EXISTS trigger_user_metadata_updated_at ON user_metadata;

CREATE TRIGGER trigger_user_metadata_updated_at
BEFORE UPDATE ON user_metadata
FOR EACH ROW
EXECUTE FUNCTION update_user_metadata_updated_at();

-- =====================================================
-- POLÍTICAS DE STORAGE (RLS)
-- =====================================================
-- NOTA: Estas políticas deben ejecutarse en el bucket 'avatars'
-- que debe ser creado manualmente en la UI de Supabase
-- con la opción "Public bucket" activada
-- =====================================================

-- Primero eliminar políticas existentes si las hay (para re-ejecución)
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Política de Lectura Pública
-- Permite que cualquiera pueda ver los avatares
-- =====================================================
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Política de Inserción (Upload)
-- Solo usuarios autenticados pueden subir su propio avatar
-- =====================================================
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = concat('user-', auth.uid()::text)
);

-- Política de Actualización
-- Solo usuarios autenticados pueden actualizar su propio avatar
-- =====================================================
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = concat('user-', auth.uid()::text)
);

-- Política de Eliminación
-- Solo usuarios autenticados pueden eliminar su propio avatar
-- =====================================================
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = concat('user-', auth.uid()::text)
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ejecuta estas queries para verificar que todo está OK
-- =====================================================

-- Ver la columna avatar_url en user_metadata
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_metadata' 
-- AND column_name = 'avatar_url';

-- Ver políticas del bucket avatars
-- SELECT * FROM pg_policies 
-- WHERE tablename = 'objects' 
-- AND policyname LIKE '%avatar%';

-- =====================================================
-- FUNCIÓN AUXILIAR (OPCIONAL)
-- =====================================================
-- Función para obtener la URL del avatar de un usuario
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_avatar_url(user_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avatar_url_result TEXT;
BEGIN
  SELECT avatar_url INTO avatar_url_result
  FROM user_metadata
  WHERE user_id = user_id_param;
  
  RETURN avatar_url_result;
END;
$$;

COMMENT ON FUNCTION get_user_avatar_url(UUID) IS 
'Obtiene la URL del avatar de un usuario dado su ID';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 
-- 1. Asegúrate de crear el bucket 'avatars' ANTES de ejecutar este script:
--    - Ve a Storage en Supabase
--    - Crea un nuevo bucket llamado 'avatars'
--    - Marca la opción "Public bucket"
--
-- 2. Estructura de carpetas esperada:
--    avatars/
--      └── user-{userId}/
--          └── avatar.webp
--
-- 3. Las imágenes se procesan en el cliente a:
--    - Formato: WebP
--    - Tamaño: 512x512px
--    - Relación de aspecto: 1:1
--
-- 4. Para eliminar todas las políticas (solo para debugging):
--    DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
--    DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
--    DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
--    DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
--
-- =====================================================
