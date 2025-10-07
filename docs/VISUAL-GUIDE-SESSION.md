# Guía Visual: Historial de Sesiones con Geolocalización

## Vista de Sesión Actual

La sesión actual se muestra con un indicador visual verde pulsante y toda la información geográfica destacada:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🟢 Sesión Actual                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 🌍 Ubicación                    💻 Navegador                    │
│ 🇲🇽 Guadalajara, Mexico          Chrome · Windows               │
│                                                                  │
│ 📍 Dirección IP                 📅 Inicio de sesión             │
│ 187.XXX.XXX.XXX                 6 oct 2025, 14:30               │
│                                                                  │
│ ⏰ Última actividad                                              │
│ Hace 5 min                                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Vista de Historial de Sesiones

```
┌─────────────────────────────────────────────────────────────────┐
│ Últimas 3 sesiones                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 🇲🇽  💻 Chrome · Windows                          Hace 2 días   │
│     🌍 Ciudad de México, Mexico                                  │
│     📍 201.XXX.XXX.XXX    📅 4 oct 2025, 09:15                  │
│     ⏰ Última actividad: 4 oct 2025, 18:45                      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 🇺🇸  💻 Safari · macOS                           Hace 5 días   │
│     🌍 San Francisco, United States                              │
│     📍 172.XXX.XXX.XXX    📅 1 oct 2025, 11:20                  │
│     ⏰ Última actividad: 1 oct 2025, 12:30                      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 🇲🇽  💻 Firefox · Android                        Hace 1 semana  │
│     🌍 Monterrey, Mexico                                         │
│     📍 189.XXX.XXX.XXX    📅 28 sep 2025, 16:45                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Alerta de Seguridad

```
┌─────────────────────────────────────────────────────────────────┐
│ ℹ️ Nota de seguridad                                            │
│                                                                  │
│ Si detectas actividad sospechosa o sesiones que no reconoces,   │
│ cambia tu contraseña inmediatamente y contacta al administrador.│
└─────────────────────────────────────────────────────────────────┘
```

## Casos de Uso de Seguridad

### ✅ Sesión Normal
```
🇲🇽 Chrome · Windows
🌍 Guadalajara, Mexico (tu ubicación habitual)
```
Usuario ve su ubicación normal → Todo bien ✓

### ⚠️ Sesión Sospechosa
```
🇨🇳 Chrome · Windows
🌍 Beijing, China
```
Usuario nunca ha estado en China → **ALERTA DE SEGURIDAD** ⚠️

### 🔍 Viaje de Trabajo
```
🇺🇸 Safari · iPhone
🌍 New York, United States
```
Usuario recuerda que inició sesión durante viaje → Todo bien ✓

### 🚨 Múltiples Países Simultáneos
```
Hace 5 min:  🇲🇽 Guadalajara, Mexico
Hace 10 min: 🇷🇺 Moscow, Russia
```
Físicamente imposible → **HACKEO PROBABLE** 🚨

## Indicadores Visuales

### Banderas de Países
Las banderas se muestran usando emojis basados en códigos ISO:
- 🇲🇽 Mexico (MX)
- 🇺🇸 United States (US)
- 🇨🇦 Canada (CA)
- 🇪🇸 Spain (ES)
- 🇧🇷 Brazil (BR)
- 🇦🇷 Argentina (AR)
- 🇨🇴 Colombia (CO)
- 🌍 Desconocido (si no hay código)

### Estados de Sesión
- 🟢 (Verde pulsante) = Sesión actual activa
- ⚫ (Sin color) = Sesión histórica

### Iconos
- 🌍 = Ubicación geográfica
- 💻 = Navegador/Dispositivo
- 📍 = Dirección IP
- 📅 = Fecha de inicio
- ⏰ = Última actividad

## Beneficios de Geolocalización

### Para el Usuario
1. **Identificación rápida**: Ver el país con bandera es más intuitivo que ver solo IP
2. **Detección fácil**: "¿He estado en ese país?" es más fácil que analizar IPs
3. **Memoria visual**: Las banderas ayudan a recordar viajes/ubicaciones
4. **Tranquilidad**: Ver ubicaciones conocidas da confianza

### Para Seguridad
1. **Alertas geográficas**: Logins desde países inesperados
2. **Patrones de viaje**: Detectar logins físicamente imposibles
3. **VPN Detection**: Cambios frecuentes de país pueden indicar VPN
4. **Fraude**: Múltiples cuentas desde misma IP/ciudad

## Ejemplo de Detección de Amenazas

### Escenario 1: Cuenta Comprometida
```
Usuario normal en: 🇲🇽 Mexico

Historial muestra:
- Hoy 14:00:  🇲🇽 Guadalajara, Mexico     ✓ Normal
- Hoy 14:30:  🇷🇺 Moscow, Russia          ⚠️ ALERTA
- Hoy 14:35:  🇨🇳 Beijing, China          🚨 CRÍTICO
```
**Acción**: Forzar cambio de contraseña inmediato

### Escenario 2: Usuario Viajero
```
Usuario freelancer internacional:

- Lun:  🇲🇽 Mexico City, Mexico
- Mar:  🇺🇸 Miami, United States
- Mié:  🇨🇦 Toronto, Canada
- Jue:  🇺🇸 New York, United States
```
**Acción**: Normal para este usuario (patrón conocido)

### Escenario 3: VPN/Proxy
```
Usuario en 1 hora:

- 10:00: 🇳🇱 Amsterdam, Netherlands
- 10:15: 🇸🇬 Singapore
- 10:30: 🇺🇸 New York, United States
- 10:45: 🇯🇵 Tokyo, Japan
```
**Acción**: Posible VPN, verificar si es comportamiento esperado

## Configuración Regional

El componente muestra fechas en formato regional español:
- Formato: `6 oct 2025, 14:30`
- Locale: `es-MX` (Español de México)
- Timezone: Del navegador del usuario

## Notas Técnicas

### Precisión de Geolocalización
- **País**: ~99% preciso
- **Ciudad**: 55-80% preciso (varía por región)
- **IP Móvil**: Menos precisa que IP fija
- **VPN/Proxy**: Muestra ubicación del servidor VPN

### Privacidad
- Datos almacenados solo para el usuario propietario
- Protegido por RLS de Supabase
- No se comparte con terceros
- Usuario puede ver solo sus propias sesiones

### Performance
- Carga asíncrona de geolocalización
- No bloquea el login si falla
- Cache en metadata (no re-consulta en cada carga)
- Timeout de 5 segundos para evitar esperas largas
