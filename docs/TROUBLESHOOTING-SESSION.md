# Troubleshooting: Geolocalización de Sesiones

## Problema: País y ciudad no aparecen en la UI

Si ves solo "IP: 190.86.96.15" sin bandera de país ni ciudad, o si las banderas no se visualizan correctamente, sigue estos pasos:

### Visualización de Banderas

El sistema ahora usa imágenes SVG de alta calidad desde `flagcdn.com` en lugar de emojis de banderas, lo que garantiza:
- ✅ Visualización consistente en todos los navegadores y sistemas operativos
- ✅ Soporte para más de 250 países
- ✅ Imágenes de alta calidad y profesionales
- ✅ Fallback automático a icono de globo si falla la carga

### 1. Verificar Consola del Navegador (F12)

Abre la consola de desarrollador y busca estos logs:

#### Al iniciar sesión:
```
captureSessionInfo - Capturando información...
saveSessionToProfile - Guardando sesión: {ip: "...", country: "...", city: "..."}
✅ Información de sesión guardada exitosamente en la base de datos
```

#### Al cargar la página de perfil:
```
Profile page - metadata cargado: {currentSession: {...}, sessionHistory: [...]}
SessionHistory - currentSession: {ip: "...", country: "...", city: "..."}
```

#### En el componente SessionHistory:
```
Debug Info:
currentSession existe: Sí
country: Mexico
city: Guadalajara
countryCode: MX
ip: 190.86.96.15
```

### 2. Verificar Datos en la Base de Datos

#### Opción A: Desde Supabase Dashboard
1. Ve a tu proyecto en Supabase
2. Tabla Editor → `profiles`
3. Busca tu usuario
4. Verifica la columna `metadata`
5. Debe contener JSON con esta estructura:

```json
{
  "currentSession": {
    "ip": "190.86.96.15",
    "country": "Mexico",
    "countryCode": "MX",
    "city": "Guadalajara",
    "browser": "Chrome",
    "os": "Windows",
    "loginAt": "2025-10-06T...",
    "lastActionAt": "2025-10-06T..."
  },
  "sessionHistory": [...]
}
```

#### Opción B: Query SQL
```sql
SELECT 
  id, 
  email,
  metadata
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'tu@email.com';
```

### 3. Diagnóstico por Síntomas

#### Síntoma: metadata es NULL o {}
**Causa**: No se está guardando la sesión al hacer login

**Solución**:
1. Cierra sesión completamente
2. Abre la consola del navegador (F12)
3. Inicia sesión de nuevo
4. Verifica que aparezcan los logs de `captureSessionInfo` y `saveSessionToProfile`
5. Si ves errores, anótalos

#### Síntoma: metadata tiene datos pero no country/city
**Causa**: La API de geolocalización falló

**Verificación**:
En la consola del navegador durante el login, busca:
```
No se pudo obtener la geolocalización: ...
```

**Posibles causas**:
- Límite de 1000 requests/día de ipapi.co alcanzado
- Problema de red/firewall bloqueando ipapi.co
- Timeout de la API

**Solución temporal**:
La IP se guarda aunque falle la geolocalización. El sistema sigue funcionando.

**Solución permanente**:
Considerar servicio de pago o implementar geolocalización en el servidor.

#### Síntoma: metadata correcto en DB pero no se muestra en UI
**Causa**: El campo metadata no se está incluyendo en la consulta

**Verificación**:
En la consola busca:
```
Profile page - metadata cargado: null
```

**Solución**:
Verificar que `lib/getFullUserData.ts` incluya explícitamente `metadata` en el select:
```typescript
.select('id, first_name, last_name, phone, is_active, role_id, metadata, updated_at, roles(*)')
```

### 4. Forzar Recarga de Sesión

Si los datos están en la DB pero no se muestran:

1. **Cierra sesión completamente**
2. **Limpia el caché del navegador**:
   - Chrome: Ctrl+Shift+Delete → "Datos almacenados en caché"
   - O abre en modo incógnito
3. **Inicia sesión de nuevo**
4. **Ve directamente a /profile**
5. **Verifica la consola**

### 5. Verificar Permisos RLS

Asegúrate de que las políticas RLS permitan leer/escribir el campo metadata:

```sql
-- Verificar política de SELECT
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
  AND cmd = 'SELECT';

-- Verificar política de UPDATE
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
  AND cmd = 'UPDATE';
```

Las políticas deben permitir a los usuarios leer y actualizar su propio registro.

### 6. Prueba Manual de Geolocalización

Abre la consola del navegador y ejecuta:

```javascript
// Prueba ipapi.co
fetch('https://ipapi.co/json/')
  .then(r => r.json())
  .then(data => console.log('ipapi.co response:', data))
  .catch(e => console.error('ipapi.co error:', e));

// Prueba ipify.org (fallback)
fetch('https://api.ipify.org?format=json')
  .then(r => r.json())
  .then(data => console.log('ipify.org response:', data))
  .catch(e => console.error('ipify.org error:', e));
```

Si ambas fallan, hay un problema de red/firewall.

### 7. Modo Debug Activado

El componente SessionHistory ahora incluye un panel de debug en modo desarrollo.

**Cómo verlo**:
1. Ve a `/profile`
2. Baja hasta "Historial de Sesiones"
3. Verás un panel amarillo con información de debug
4. Debe mostrar los valores de country, city, countryCode, ip

**Si ves "undefined"**:
Los datos no están llegando al componente. Revisa los pasos anteriores.

### 8. Verificar Variables de Entorno

Asegúrate de que las credenciales de Supabase sean correctas:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Si están mal, el sistema no puede leer/escribir en la DB.

### 9. Network Tab (Pestaña Red)

1. Abre DevTools → Network (Red)
2. Inicia sesión
3. Busca requests a:
   - `ipapi.co/json` → Debe retornar 200 con datos de geolocalización
   - `from?profiles` → Debe incluir metadata en la respuesta

### 10. Crear Sesión de Prueba Manual

Puedes insertar manualmente datos de prueba en Supabase:

```sql
UPDATE profiles
SET metadata = '{
  "currentSession": {
    "ip": "190.86.96.15",
    "country": "Mexico",
    "countryCode": "MX",
    "city": "Guadalajara",
    "browser": "Chrome",
    "os": "Windows",
    "loginAt": "2025-10-06T11:26:00.000Z",
    "lastActionAt": "2025-10-06T11:26:00.000Z"
  },
  "sessionHistory": []
}'::jsonb
WHERE id = 'tu-user-id';
```

Luego recarga `/profile` y verifica si se muestra correctamente.

## Checklist de Verificación

- [ ] Console logs muestran datos de geolocalización al iniciar sesión
- [ ] Base de datos contiene metadata con country/city
- [ ] getFullUserData.ts incluye 'metadata' en el select
- [ ] Console en /profile muestra "metadata cargado: {...}"
- [ ] Panel de debug en SessionHistory muestra valores correctos
- [ ] APIs de geolocalización responden correctamente
- [ ] No hay errores de RLS/permisos en la consola
- [ ] Variables de entorno de Supabase son correctas

## Solución Rápida (Quick Fix)

Si todo lo demás falla:

1. **Cerrar sesión**
2. **Abrir navegador en modo incógnito**
3. **Abrir consola (F12)**
4. **Iniciar sesión de nuevo**
5. **Ir directamente a /profile**
6. **Tomar screenshot de los console logs**
7. **Revisar panel de debug en SessionHistory**

Con esta información, se puede diagnosticar exactamente dónde está el problema.

## Contacto

Si después de seguir todos estos pasos el problema persiste, proporciona:
- Screenshots de los console logs
- Screenshot del metadata en Supabase
- Screenshot del panel de debug
- Respuesta de las pruebas manuales de geolocalización
