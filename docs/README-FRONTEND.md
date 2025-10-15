# Frontend del aplicativo

Guía unificada del frontend: stack, navegación, notificaciones, avatares y auditoría de sesiones.

## Índice

- [Stack y estado](#stack-y-estado)
- [Estructura UI y navegación](#estructura-ui-y-navegación)
- [Sistema de notificaciones (Toast + ConfirmModal)](#sistema-de-notificaciones-toast--confirmmodal)
- [Avatares de usuario](#avatares-de-usuario)
- [Auditoría de sesiones (Frontend)](#auditoría-de-sesiones-frontend)
- [Formulario de Requisición (UI)](#formulario-de-requisición-ui)
- [Desarrollo local](#desarrollo-local)
- [Buenas prácticas](#buenas-prácticas)

## Stack y estado

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase JS (auth/db/storage)

Para ejecutar localmente:

```bash
npm install
npm run dev
```

App: http://localhost:3000

## Estructura UI y navegación

- Sidebar colapsable: `app/components/navigation/Sidebar.tsx`
- Configuración de menú y filtrado por roles: `app/components/navigation/menuConfig.ts`
- Rol actual: `lib/getCurrentUserRole.ts` (usa `public.current_user_role()` y/o perfil)
- Protección de UI por rol: `app/components/RequireRole.tsx`

Ejemplo:

```tsx
<RequireRoleClient allow={["admin", "superadmin"]}>
  <AdminContent />
</RequireRoleClient>
```

Notas
- El ocultamiento en UI no sustituye autorización en backend (APIs y RLS deben validar permisos).
- Persistencia del estado del sidebar en localStorage (`sidebar-collapsed`).

## Sistema de notificaciones (Toast + ConfirmModal)

Componentes principales:
- `app/components/Toast.tsx` (toast individual)
- `app/components/ToastContainer.tsx` (contenedor global)
- `app/components/ConfirmModal.tsx` (confirmación acciones)
- Hook: `lib/useToast.tsx` (success, error, warning, info, showToast)

Uso rápido:

```tsx
"use client";
import { useToast } from "@/lib/useToast";

export default function Ejemplo() {
  const { success, error, warning, info } = useToast();
  return (
    <button onClick={() => success("¡Operación exitosa!")}>Guardar</button>
  );
}
```

Personalización
- Duración: `showToast('msg', 'info', 5000)`
- Posición: editar `ToastContainer.tsx` (clases fixed top/bottom left/right)
- Nuevos tipos: ampliar `Toast.tsx` (ToastType y estilos) y hook

Troubleshooting rápido
- Asegura `<ToastContainer />` en `app/layout.tsx`
- Usa componentes cliente (`'use client'`)
- Aumenta `z-index` si quedan detrás de otros elementos

Testing (resumen)
- Verifica: success/error/warning/info, cierre manual, auto-dismiss, stacking y responsive

## Avatares de usuario

Componentes
- `app/components/AvatarUpload.tsx`: subir/recortar/subir a Storage
- `app/components/ImageCropModal.tsx`: recorte 1:1
- `app/components/UserAvatar.tsx`: mostrar avatar o iniciales

Uso básico

```tsx
import AvatarUpload from "@/app/components/AvatarUpload";

<AvatarUpload
  user={user}
  currentAvatarUrl={avatarUrl}
  onAvatarUpdate={(url) => setAvatarUrl(url)}
/>
```

Procesamiento de imagen
- Salida WebP, 512x512, calidad ~0.85
- Validaciones: tipo, tamaño (<=5MB), aspecto 1:1
- Utilidades en `lib/imageUtils.ts` (resize/convert, crop, validate)

Troubleshooting rápido
- Si ves 400/403 en URLs públicas: el bucket `avatars` debe existir y ser público (ver README-SUPABASE)
- Revisa políticas RLS en `storage.objects` y script `scripts/setup-avatars.sql`

## Auditoría de sesiones (Frontend)

Objetivo: capturar IP, navegador/SO, país/ciudad, timestamps de login/última acción y mostrar historial.

Piezas clave
- `lib/sessionTracking.ts`: captura (ipapi.co → fallback ipify), guarda en `profiles.metadata`, actualiza última acción
- `app/providers/AuthProvider.tsx`: actualiza `lastActionAt` en navegación
- `app/components/SessionHistory.tsx`: UI con bandera, ubicación, navegador, IP y fechas

Banderas y países
- Imágenes desde flagcdn.com (SVG/PNG) con códigos ISO-2
- Mapeo nombre → código; fallback a globo si no hay match

Notas
- La geolocalización por IP puede no dar siempre ciudad exacta; país ~99% preciso
- En producción se recomienda obtener IP en servidor (headers X-Forwarded-For)

Troubleshooting rápido
- Verifica que `metadata` se selecciona en `lib/getFullUserData.ts` (incluye `metadata`)
- Si no hay país/ciudad, pudo fallar ipapi.co; el flujo continúa con IP

## Formulario de Requisición (UI)

Se implementó un formulario completo por secciones (datos generales, motivo/puesto, funciones, perfil, habilidades informáticas, habilidades técnicas) con diseño responsive y colores de marca (#00253F / #FF1556).

## Desarrollo local

```bash
npm install
npm run dev
```

Buenas prácticas
- Mantener componentes cliente (`'use client'`) donde se usen hooks o APIs del navegador
- Validar en cliente y servidor; UI ≠ seguridad
- Evitar toasts excesivos; mensajes breves y claros
