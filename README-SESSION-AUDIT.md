# Sistema de Auditoría de Sesiones

## Descripción General

El sistema de auditoría de sesiones registra automáticamente información importante sobre cada inicio de sesión y actividad del usuario para mejorar la seguridad y permitir la detección de accesos no autorizados.

## Información Capturada

Para cada sesión, el sistema registra:

### 1. **Información de Inicio de Sesión**
- **IP del Cliente**: Dirección IP desde la cual se inició sesión
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
    "loginAt": "2025-10-06T10:30:00.000Z",
    "lastActionAt": "2025-10-06T11:45:00.000Z"
  },
  "sessionHistory": [
    {
      "ip": "192.168.1.100",
      "browser": "Chrome",
      "os": "Windows",
      "loginAt": "2025-10-06T10:30:00.000Z",
      "lastActionAt": "2025-10-06T11:45:00.000Z"
    },
    // ... hasta 10 sesiones anteriores
  ]
}
```

## Características

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

### Obtención de IP
- Se utiliza un servicio externo (api.ipify.org) con timeout de 3 segundos
- Si falla la obtención de IP, el sistema continúa sin bloquear el login
- En producción, se recomienda obtener la IP desde el servidor usando headers como `X-Forwarded-For`

### Datos Sensibles
- El user agent completo se almacena pero puede contener información del sistema
- Los datos están protegidos por RLS (Row Level Security) de Supabase
- Solo el usuario propietario puede ver sus propias sesiones

### Recomendaciones
1. **Revisar sesiones regularmente**: Los usuarios deben revisar su historial de sesiones periódicamente
2. **Detectar actividad sospechosa**: Sesiones desde ubicaciones o navegadores no reconocidos
3. **Acción inmediata**: Si se detecta actividad sospechosa, cambiar la contraseña inmediatamente

## Mejoras Futuras

### Backend (Recomendado para Producción)
- Mover la captura de IP al servidor para mayor precisión
- Implementar geolocalización de IPs
- Agregar detección de dispositivos duplicados
- Sistema de alertas por actividad sospechosa

### Frontend
- Filtrado y búsqueda en el historial de sesiones
- Exportación de historial de auditoría
- Gráficos de actividad del usuario
- Notificaciones de nuevos inicios de sesión

### Base de Datos
- Tabla separada para sesiones (mejor rendimiento)
- Índices optimizados para búsquedas
- Retención configurable del historial
- Logs de auditoría completos

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

### Versión 1.0.0 (6 de octubre de 2025)
- ✅ Captura de IP, navegador y SO
- ✅ Almacenamiento en metadata de profiles
- ✅ Historial de últimas 10 sesiones
- ✅ Tracking de última acción
- ✅ Componente UI para visualización
- ✅ Integración con página de perfil
