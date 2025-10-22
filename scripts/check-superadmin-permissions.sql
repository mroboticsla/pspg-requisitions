-- Verificar los permisos del rol superadmin
SELECT 
  id,
  name,
  permissions
FROM roles
WHERE name = 'superadmin';
