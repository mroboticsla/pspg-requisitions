# Solución al Error 400 del Bucket de Avatares

## 🔴 Problema

```
GET https://[proyecto].supabase.co/storage/v1/object/public/avatars/user-[id]/avatar.webp 400 (Bad Request)
```

Este error indica que el bucket de avatares no está correctamente configurado en Supabase.

## ✅ Solución Paso a Paso

### Paso 1: Verificar que el Bucket Existe

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **Storage**
4. Verifica si existe un bucket llamado `avatars`

**Si NO existe:**
- Continúa al Paso 2

**Si SÍ existe:**
- Continúa al Paso 3

### Paso 2: Crear el Bucket

1. En la página de Storage, haz clic en **"New bucket"** o **"Create a new bucket"**
2. Configura el bucket con los siguientes valores:
   ```
   Name: avatars
   Public bucket: ✅ ACTIVADO (MUY IMPORTANTE)
   File size limit: 50MB (o el valor por defecto)
   Allowed MIME types: image/* (o déjalo vacío para permitir todos)
   ```
3. Haz clic en **"Create bucket"**

### Paso 3: Verificar que el Bucket es Público

1. En la lista de buckets, busca `avatars`
2. Haz clic en el ícono de configuración (⚙️) o los tres puntos (...) junto al bucket
3. Selecciona **"Edit bucket"** o **"Bucket settings"**
4. **VERIFICA** que la opción **"Public bucket"** esté **ACTIVADA** ✅
5. Si no lo está, actívala y guarda los cambios

### Paso 4: Ejecutar el Script SQL

1. Ve a **SQL Editor** en el menú lateral de Supabase
2. Haz clic en **"New query"**
3. Copia y pega el contenido completo de `scripts/setup-avatars.sql`
4. Haz clic en **"Run"**
5. Verifica que no haya errores en la ejecución

### Paso 5: Verificar las Políticas RLS

Ejecuta esta query en el SQL Editor para verificar que las políticas existen:

```sql
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
```

Deberías ver 4 políticas:
- ✅ Public Avatar Access
- ✅ Users can upload their own avatar
- ✅ Users can update their own avatar
- ✅ Users can delete their own avatar

### Paso 6: Probar la Subida

1. Ve a la aplicación
2. Inicia sesión
3. Ve a **Mi Perfil**
4. Intenta subir una imagen
5. Si ves el mensaje "El bucket de avatares no está configurado", regresa al Paso 2
6. Si la imagen se sube correctamente, ¡listo! 🎉

## 🔍 Verificación Adicional

### Verificar Permisos del Bucket

1. Ve a Storage → avatars
2. Haz clic en "Policies" o "RLS Policies"
3. Asegúrate de que veas las 4 políticas listadas arriba
4. Verifica que estén **habilitadas** (toggle en verde)

### Verificar URL Pública

La URL de un avatar debe seguir este formato:

```
https://[proyecto].supabase.co/storage/v1/object/public/avatars/user-[uuid]/avatar.webp
```

Ejemplo:
```
https://rokqodsedwjkjltvsnol.supabase.co/storage/v1/object/public/avatars/user-3b078267-d611-4eaa-a6d9-840a1d0d3750/avatar.webp
```

### Probar URL Manualmente

1. Sube una imagen desde la aplicación
2. Copia la URL del avatar desde la consola del navegador o desde la base de datos
3. Pega la URL en una nueva pestaña del navegador
4. Si ves la imagen, ✅ todo funciona correctamente
5. Si ves un error 400, el bucket no es público o no existe

## 🐛 Problemas Comunes

### "Bucket not found"

**Causa**: El bucket no existe

**Solución**: Crea el bucket siguiendo el Paso 2

### "Object not found" (404)

**Causa**: El archivo no se subió correctamente

**Solución**: 
1. Verifica que las políticas RLS permiten la escritura
2. Revisa la consola del navegador para ver errores de subida

### "Access denied" o "Forbidden" (403)

**Causa**: El bucket no es público o las políticas RLS bloquean el acceso

**Solución**:
1. Verifica que "Public bucket" esté activado
2. Ejecuta el script SQL para crear las políticas
3. Verifica que las políticas están habilitadas

### Error 400 (Bad Request)

**Causa**: Configuración incorrecta del bucket

**Solución**:
1. Elimina el bucket `avatars` completamente
2. Créalo de nuevo siguiendo el Paso 2
3. Asegúrate de marcar "Public bucket"
4. Ejecuta el script SQL nuevamente

## 📝 Checklist de Configuración

Usa este checklist para verificar que todo está configurado:

- [ ] El bucket `avatars` existe en Storage
- [ ] El bucket está marcado como "Public bucket"
- [ ] La tabla `user_metadata` existe en la base de datos
- [ ] La columna `avatar_url` existe en `user_metadata`
- [ ] Las 4 políticas RLS existen en `storage.objects`
- [ ] Las políticas están habilitadas (activas)
- [ ] El script SQL se ejecutó sin errores
- [ ] Puedes acceder a una URL de prueba directamente en el navegador

## 🔧 Comandos SQL Útiles

### Ver todos los buckets
```sql
SELECT * FROM storage.buckets;
```

### Ver políticas de storage
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects';
```

### Ver avatares subidos
```sql
SELECT * FROM storage.objects 
WHERE bucket_id = 'avatars' 
ORDER BY created_at DESC;
```

### Ver usuarios con avatar
```sql
SELECT 
  um.user_id,
  um.avatar_url,
  um.created_at
FROM user_metadata um
WHERE um.avatar_url IS NOT NULL;
```

## 🆘 Si Nada Funciona

1. **Elimina el bucket completamente**:
   - Ve a Storage
   - Haz clic en los tres puntos (...) junto al bucket `avatars`
   - Selecciona "Delete bucket"
   - Confirma

2. **Recrea el bucket desde cero**:
   - Sigue el Paso 2 de esta guía
   - Asegúrate de marcar "Public bucket" ✅

3. **Re-ejecuta el script SQL**:
   - Abre `scripts/setup-avatars.sql`
   - Ejecuta en SQL Editor

4. **Prueba de nuevo**:
   - Limpia el caché del navegador (Ctrl + Shift + Delete)
   - Recarga la aplicación
   - Intenta subir una imagen

## 📞 Soporte

Si después de seguir todos estos pasos el problema persiste:

1. Verifica que tienes permisos de administrador en el proyecto de Supabase
2. Revisa los logs de Supabase en el Dashboard
3. Contacta al equipo de desarrollo con:
   - Screenshots del error
   - Logs de la consola del navegador
   - Resultado de las queries de verificación
