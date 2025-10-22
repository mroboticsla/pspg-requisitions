-- Script para agregar el módulo "access" a los permisos de roles
-- Esto permite que el nuevo menú "Acceso" sea visible para superadmins

-- Actualizar el rol superadmin para incluir el módulo "access"
UPDATE roles
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'::jsonb),
  '{modules,access}',
  'true'::jsonb,
  true
)
WHERE name = 'superadmin';

-- Verificar el resultado
SELECT 
  id,
  name,
  permissions
FROM roles
WHERE name = 'superadmin';
