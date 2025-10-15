# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [No Publicado]

### Agregado
- **Sistema de estilos para pantallas de administración**:
  - Paleta de colores `admin-*` en `tailwind.config.js`:
    - Colores de acción (success, danger, accent)
    - Backgrounds (page, card, hover, disabled)
    - Borders y texto con variantes
  - Componentes reutilizables:
    - `AdminLayout`: Layout con subcomponentes (Header, Card, Search, List, etc.)
    - `AdminButton`: Familia de botones (Primary, Secondary, Danger, Outline, Ghost, Icon)
  - Documentación en `docs/README-FRONTEND.md` sección "Sistema de estilos para administración"
- Sistema de notificaciones toast para mejorar la experiencia del usuario:
  - Componente `Toast` con 4 variantes (success, error, warning, info)
  - Componente `ToastContainer` para gestión centralizada de notificaciones
  - Hook `useToast` para fácil integración en cualquier componente
  - Animaciones suaves (slide-in/slide-out) para entrada/salida de toasts
  - Auto-dismissal configurable (por defecto 3 segundos)
  - Botón de cierre manual en cada notificación
  - Integrado en `layout.tsx` a nivel global
- Componente `ConfirmModal` para reemplazar `window.confirm()`:
  - Modal de confirmación con 3 tipos (danger, warning, info)
  - Diseño consistente con el sistema de diseño de la aplicación
  - Animaciones de entrada/salida
  - Iconos contextuales según el tipo de acción
- Sistema completo de avatares de usuario con las siguientes características:
  - Componente `AvatarUpload` para subir y gestionar fotos de perfil
  - Componente `ImageCropModal` para recortar imágenes con relación de aspecto 1:1
  - Componente `UserAvatar` reutilizable para mostrar avatares en toda la aplicación
  - Utilidades en `imageUtils.ts` para procesar imágenes (validación, redimensionamiento, conversión a WebP)
  - Integración con Supabase Storage (bucket 'avatars')
  - Políticas RLS para seguridad de archivos
  - Script SQL para configuración inicial (`scripts/setup-avatars.sql`)
  - Procesamiento inteligente:
    - Redimensionamiento automático a 512x512px
    - Conversión a formato WebP para optimización
    - Compresión a ~500KB manteniendo calidad
    - Recorte interactivo para imágenes no cuadradas
  - Nuevas dependencias: `react-image-crop`, `browser-image-compression`

### Modificado
- **Página de administración de roles (`app/admin/roles/page.tsx`)**:
  - Diseño completamente responsive y optimizado:
    - **Desktop:** Layout compacto con información densa pero legible
    - **Tablet:** Grid adaptativo de 2 columnas
    - **Móvil:** Stack vertical con botones full-width
  - Lista de roles:
    - Badges de módulos y permisos inline para ahorrar espacio
    - Limitación a 5 módulos visibles con contador "+X más"
    - Botones compactos alineados correctamente
  - Formulario de creación/edición:
    - Grid 4 columnas (3+1) en desktop, stack en móvil
    - Sidebar sticky compacto con módulos
    - Inputs y controles con tamaños optimizados
    - Espaciado reducido para mayor densidad
  - Uso de colores del sistema `admin-*`
  - Mejor jerarquía visual y legibilidad
- Reemplazados todos los `alert()` de JavaScript con notificaciones toast modernas:
  - `AvatarUpload`: Éxito en subida, errores de procesamiento, confirmación de eliminación
  - `ImageCropModal`: Errores de procesamiento
- Página de perfil (`app/profile/page.tsx`) ahora incluye sección de avatar
- Componente `UserMenu` actualizado para mostrar avatar real del usuario
- Componente `Header` ahora muestra avatar en lugar de solo iniciales
- README principal actualizado con nueva característica
- Tabla `user_metadata` ahora incluye campo `avatar_url`
- Configuración de Tailwind (`tailwind.config.js`) extendida con paleta completa de administración
- `docs/README-FRONTEND.md` actualizado con sección de sistema de estilos

### Mejorado
- Experiencia de usuario con notificaciones no intrusivas
- Confirmaciones de acciones destructivas con modales contextuales
- Feedback visual inmediato en todas las operaciones de avatar

### Documentación
- Agregado `docs/README-AVATARS.md` con guía completa de configuración y uso
- Agregado `docs/AVATAR-IMPLEMENTATION-SUMMARY.md` con resumen de implementación
- Actualizado README principal con referencias al nuevo sistema

## [1.0.0] - 2025-10-06

### Agregado
- Sistema de auditoría de sesiones con geolocalización
- Historial de sesiones en página de perfil
- Seguimiento de dispositivos y navegadores
- Metadatos de sesión (IP, ciudad, país, etc.)
- Documentación de sistema de sesiones

### Modificado
- AuthProvider mejorado con tracking de sesiones
- Página de perfil con nuevo diseño
- Sistema de validación de contraseñas

## [0.9.0] - 2025-10-05

### Agregado
- Sistema de autenticación completo con Supabase
- Página de inicio de sesión
- Página de registro
- Página de recuperación de contraseña
- Página de cambio de contraseña
- Protección de rutas privadas

### Modificado
- Migración de Prisma a Supabase
- Actualización de configuración de base de datos
- Mejoras en diseño responsive

## [0.8.0] - 2025-10-04

### Agregado
- Componente PhoneInput con validación por país
- Soporte para 16 países latinoamericanos
- Formato automático de números telefónicos
- Validación de longitud por código de país

### Modificado
- Formulario de perfil con nuevo campo de teléfono
- Mejoras en UX del formulario de registro

## [0.7.0] - 2025-10-03

### Agregado
- Sistema de roles y permisos
- Panel de administración básico
- Gestión de usuarios desde admin

### Modificado
- Header con menú de usuario mejorado
- Sistema de navegación actualizado

---

## Tipos de Cambios

- `Agregado` para nuevas características
- `Modificado` para cambios en funcionalidad existente
- `Obsoleto` para características que serán removidas
- `Removido` para características removidas
- `Corregido` para corrección de bugs
- `Seguridad` para vulnerabilidades corregidas
