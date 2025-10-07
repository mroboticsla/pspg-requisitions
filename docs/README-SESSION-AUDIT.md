# Sistema de Auditoría de Sesiones

## Descripción General

El sistema de auditoría de sesiones registra automáticamente información importante sobre cada inicio de sesión y actividad del usuario para mejorar la seguridad y permitir la detección de accesos no autorizados.

## Información Capturada

Para cada sesión, el sistema registra:

### 1. **Información de Inicio de Sesión**
- **IP del Cliente**: Dirección IP desde la cual se inició sesión
- **País**: País detectado automáticamente desde la IP (ej: "Mexico", "United States")
- **Código de País**: Código ISO de 2 letras del país (ej: "MX", "US") - usado para mostrar banderas 🇲🇽
- **Ciudad**: Ciudad detectada desde la IP (ej: "Ciudad de México", "Guadalajara")
- **Navegador**: Tipo de navegador utilizado (Chrome, Firefox, Safari, Edge, etc.)
- **Sistema Operativo**: SO del dispositivo (Windows, macOS, Linux, iOS, Android)
- **User Agent Completo**: Cadena completa del user agent para análisis detallado
- **Fecha y Hora de Login**: Timestamp ISO 8601 del momento exacto del inicio de sesión

### 2. **Actividad del Usuario**
- **Última Acción**: Timestamp que se actualiza automáticamente cada vez que el usuario navega a una nueva página dentro de la aplicación

## Almacenamiento

Toda la información se almacena en el campo `metadata` de la tabla `profiles` con la siguiente estructura:

```json
{
  "currentSession": {
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
    "browser": "Chrome",
    "os": "Windows",
    "country": "Mexico",
    "countryCode": "MX",
    "city": "Ciudad de México",
    "loginAt": "2025-10-06T10:30:00.000Z",
    "lastActionAt": "2025-10-06T11:45:00.000Z"
  },
  "sessionHistory": [
    {
      "ip": "192.168.1.100",
      "browser": "Chrome",
      "os": "Windows",
      "country": "Mexico",
      "countryCode": "MX",
      "city": "Ciudad de México",
      "loginAt": "2025-10-06T10:30:00.000Z",
      "lastActionAt": "2025-10-06T11:45:00.000Z"
    },
    // ... hasta 10 sesiones anteriores
  ]
}
```

## Características

### Geolocalización Automática
- **Servicio Utilizado**: ipapi.co (1000 requests gratuitos por día)
- **Información Obtenida**: IP, país, código de país y ciudad en una sola llamada
- **Fallback**: Si falla la geolocalización, obtiene solo la IP desde ipify.org
- **Visualización de Banderas**: Imágenes SVG desde flagcdn.com (más de 250 países)
  - Soporte para conversión de nombres de países a códigos ISO
  - Fallback automático a icono de globo si falla la carga de imagen
  - Visualización consistente en todos los navegadores
- **Timeout**: 5 segundos para geolocalización, 3 segundos para fallback

### Historial de Sesiones
- Se mantiene un historial de las **últimas 10 sesiones**
- Cada nueva sesión se agrega al inicio del array
- Las sesiones más antiguas se eliminan automáticamente

### Actualización de Última Acción
- Se actualiza automáticamente en cada cambio de ruta
- Utiliza un sistema de throttling para evitar actualizaciones excesivas
- Solo se actualiza si ha pasado más de 5 minutos desde la última verificación

## Implementación Técnica

### Archivos Principales

1. **`lib/sessionTracking.ts`**
   - Funciones de captura y almacenamiento de información de sesión
   - `captureSessionInfo()`: Captura la información actual
   - `saveSessionToProfile()`: Guarda la sesión en la base de datos
   - `updateLastAction()`: Actualiza el timestamp de última actividad

2. **`app/auth/page.tsx`**
   - Integración con el proceso de login
   - Llama a `captureSessionInfo()` y `saveSessionToProfile()` después de un login exitoso

3. **`app/providers/AuthProvider.tsx`**
   - Tracking automático de actividad del usuario
   - Actualiza `lastActionAt` en cada navegación

4. **`app/components/SessionHistory.tsx`**
   - Componente UI para mostrar el historial de sesiones
   - Visualización de sesión actual y sesiones previas

5. **`app/profile/page.tsx`**
   - Página de perfil que muestra el historial de sesiones
   - Permite al usuario revisar su actividad

## Uso del Componente SessionHistory

```tsx
import SessionHistory from "../components/SessionHistory";
import { SessionMetadata } from "../../lib/sessionTracking";

// En tu componente
const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata | null>(null);

// Cargar desde el perfil
useEffect(() => {
  if (profile) {
    setSessionMetadata(profile.metadata || null);
  }
}, [profile]);

// Renderizar
<SessionHistory 
  sessionHistory={sessionMetadata?.sessionHistory} 
  currentSession={sessionMetadata?.currentSession}
/>
```

## Seguridad y Privacidad

### Obtención de IP y Geolocalización
- **Servicio Principal**: ipapi.co - Proporciona IP + geolocalización en una sola llamada
  - Límite gratuito: 1000 requests/día
  - Timeout: 5 segundos
  - Proporciona: IP, país, código de país, ciudad
- **Servicio Fallback**: api.ipify.org - Solo IP si falla la geolocalización
  - Timeout: 3 segundos
- **Comportamiento**: Si ambos servicios fallan, el sistema continúa sin bloquear el login
- **Producción**: Se recomienda obtener la IP desde el servidor usando headers como `X-Forwarded-For` o `X-Real-IP`
- **Precisión**: La geolocalización basada en IP puede tener variaciones de precisión:
  - País: ~99% de precisión
  - Ciudad: ~55-80% de precisión (varía según región y proveedor)

### Datos Sensibles
- El user agent completo se almacena pero puede contener información del sistema
- Los datos están protegidos por RLS (Row Level Security) de Supabase
- Solo el usuario propietario puede ver sus propias sesiones

### Recomendaciones
1. **Revisar sesiones regularmente**: Los usuarios deben revisar su historial de sesiones periódicamente
2. **Detectar actividad sospechosa**: Sesiones desde ubicaciones (países/ciudades) o navegadores no reconocidos
3. **Verificar ubicaciones**: Si ves una sesión desde un país donde nunca has estado, es señal de alerta
4. **Acción inmediata**: Si se detecta actividad sospechosa, cambiar la contraseña inmediatamente

## Mejoras Futuras

### Backend (Recomendado para Producción)
- Mover la captura de IP al servidor para mayor precisión
- Usar servicios de geolocalización más robustos (MaxMind GeoIP2, IP2Location)
- Implementar cache de geolocalizaciones para reducir llamadas a APIs
- Agregar detección de dispositivos duplicados
- Sistema de alertas por actividad sospechosa (ej: login desde otro país)
- Detección de VPN/Proxy para seguridad adicional

### Frontend
- Filtrado y búsqueda en el historial de sesiones (ej: filtrar por país)
- Exportación de historial de auditoría (PDF/CSV)
- Gráficos de actividad del usuario (mapa de ubicaciones)
- Notificaciones push de nuevos inicios de sesión
- Opción para cerrar sesiones remotas
- Vista de mapa interactivo mostrando ubicaciones de sesiones

### Base de Datos
- Tabla separada para sesiones (mejor rendimiento)
- Índices optimizados para búsquedas
- Retención configurable del historial
- Logs de auditoría completos

## Servicios de Geolocalización

### Servicio Actual: ipapi.co

**Ventajas:**
- ✅ Gratuito hasta 1000 requests/día
- ✅ Una sola llamada para IP + geolocalización completa
- ✅ No requiere API key
- ✅ Datos precisos de país (~99% precisión)
- ✅ Incluye ciudad, región, coordenadas
- ✅ HTTPS incluido

**Limitaciones:**
- ⚠️ 1000 requests/día en plan gratuito
- ⚠️ Precisión de ciudad variable (55-80%)
- ⚠️ Sin soporte técnico en plan gratuito

**API Response Example:**
```json
{
  "ip": "8.8.8.8",
  "city": "Mountain View",
  "region": "California",
  "country": "US",
  "country_name": "United States",
  "country_code": "US",
  "latitude": 37.4056,
  "longitude": -122.0775
}
```

### Alternativas de Servicios

#### ipify.org (Fallback Actual)
- Solo IP, sin geolocalización
- Ilimitado y gratuito
- Muy confiable
- Usado como fallback si ipapi.co falla

#### MaxMind GeoIP2 (Recomendado para Producción)
- Alta precisión (país: 99.8%, ciudad: 80-90%)
- Base de datos local (sin llamadas API)
- Actualizaciones semanales
- Costo: ~$50/mes
- Mejor para alto tráfico

#### IP2Location
- Similar a MaxMind
- Opciones de API y base de datos
- Plan gratuito limitado
- Costo: desde $49/mes

#### ipgeolocation.io
- 1000 requests/día gratis
- 50,000 requests/mes: $15
- Incluye timezone, moneda, idioma
- API key requerida

### Recomendaciones por Escenario

**Desarrollo/Testing:**
- ✅ ipapi.co (actual) - Perfecto para desarrollo

**Producción Baja Escala (<1000 logins/día):**
- ✅ ipapi.co - Suficiente y gratuito

**Producción Media Escala (1000-10,000 logins/día):**
- ✅ ipgeolocation.io plan básico ($15/mes)
- ✅ ipapi.co plan Pro ($10/mes - 30,000 requests)

**Producción Alta Escala (>10,000 logins/día):**
- ✅ MaxMind GeoIP2 - Base de datos local
- ✅ IP2Location - Base de datos local

### Migración a Otro Servicio

Si necesitas cambiar de servicio, solo modifica la función `getClientIPAndLocation()` en `lib/sessionTracking.ts`:

```typescript
async function getClientIPAndLocation() {
  // Ejemplo con ipgeolocation.io
  const API_KEY = process.env.NEXT_PUBLIC_IPGEO_API_KEY;
  const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${API_KEY}`);
  const data = await response.json();
  
  return {
    ip: data.ip,
    country: data.country_name,
    countryCode: data.country_code2,
    city: data.city
  };
}
```

## Configuración de Base de Datos

El campo `metadata` ya existe en la tabla `profiles` como tipo `jsonb`. No se requiere ninguna migración adicional.

Para verificar:

```sql
SELECT metadata FROM profiles WHERE id = '<user_id>';
```

## Testing

### Probar Captura de Sesión
1. Cierra sesión completamente
2. Inicia sesión nuevamente
3. Ve a tu perfil (`/profile`)
4. Verifica que aparezca tu sesión actual con:
   - IP correcta
   - País y ciudad (con bandera del país 🇲🇽)
   - Navegador correcto
   - Fecha/hora del login

### Probar Última Acción
1. Con sesión iniciada, navega entre diferentes páginas
2. Espera unos segundos
3. Recarga la página de perfil
4. La "Última actividad" debe actualizarse

## Monitoreo

Para auditorías administrativas, puedes consultar las sesiones de todos los usuarios:

```sql
SELECT 
  id,
  email,
  metadata->'currentSession'->>'ip' as current_ip,
  metadata->'currentSession'->>'country' as country,
  metadata->'currentSession'->>'city' as city,
  metadata->'currentSession'->>'browser' as browser,
  metadata->'currentSession'->>'loginAt' as login_at,
  metadata->'currentSession'->>'lastActionAt' as last_action
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.metadata IS NOT NULL;
```

## Soporte

Para preguntas o problemas con el sistema de auditoría:
1. Revisa los logs del navegador (Console)
2. Verifica que el campo `metadata` en `profiles` tenga permisos de lectura/escritura
3. Confirma que las políticas RLS permitan la actualización del campo `metadata`

## Changelog

### Versión 1.2.0 (6 de octubre de 2025)
- ✅ **MEJORA**: Cambio de emojis a imágenes SVG de banderas (flagcdn.com)
- ✅ **NUEVO**: Soporte para más de 70 países con mapeo automático de nombres
- ✅ **NUEVO**: Fallback inteligente de banderas (nombre → código → globo)
- ✅ **MEJORA**: Visualización consistente en todos los navegadores
- ✅ **NUEVO**: Panel de debug en modo desarrollo

### Versión 1.1.0 (6 de octubre de 2025)
- ✅ **NUEVO**: Geolocalización automática de IPs
- ✅ **NUEVO**: Visualización de país con banderas (emojis)
- ✅ **NUEVO**: Detección de ciudad
- ✅ **MEJORA**: Servicio principal ipapi.co + fallback a ipify.org
- ✅ **MEJORA**: UI mejorada con banderas y ubicaciones prominentes
- ✅ **MEJORA**: Mejor visualización de información geográfica

### Versión 1.0.0 (6 de octubre de 2025)
- ✅ Captura de IP, navegador y SO
- ✅ Almacenamiento en metadata de profiles
- ✅ Historial de últimas 10 sesiones
- ✅ Tracking de última acción
- ✅ Componente UI para visualización
- ✅ Integración con página de perfil
