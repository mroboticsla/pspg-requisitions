# PSPG Requisitions — Documentación

Este directorio centraliza la documentación del proyecto en cuatro guías:

- `README.md` (este): visión general
- `README-FRONTEND.md`: UI, navegación, toasts, avatares y auditoría de sesión (lado cliente)
- `README-BACKEND.md`: endpoints, seguridad y utilidades (lado servidor)
- `README-SUPABASE.md`: configuración de base de datos, RLS y storage en Supabase

## Índice

- [Visión general del stack](#visión-general-del-stack)
- [Estructura relevante](#estructura-relevante)
- [Flujo de roles y acceso](#flujo-de-roles-y-acceso)
- [Desarrollo local](#desarrollo-local)
- [Convenciones](#convenciones)
- [Próximos pasos sugeridos](#próximos-pasos-sugeridos)

## Visión general del stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Auth, PostgREST/DB, Storage)
- Ruta de APIs en `app/api/*`

## Estructura relevante

- `app/` → páginas, layouts y componentes UI
  - `components/` → UI compartida (toasts, modales, navegación, avatar, etc.)
  - `api/` → endpoints del backend (admin, register)
  - `providers/` → `AuthProvider` y wiring global
- `lib/` → utilidades y hooks
  - `supabaseClient.ts` → cliente Supabase (anon)
  - `getFullUserData.ts` → combina auth + perfil + rol
  - `getCurrentUserRole.ts` → rol actual (RPC/Perfil)
  - `sessionTracking.ts` → auditoría de sesiones
  - `imageUtils.ts` → procesamiento de imágenes (avatar)
  - `useToast.tsx` → sistema de notificaciones
- `scripts/` → SQL/utilidades para infraestructura (avatars)

## Flujo de roles y acceso

- Roles base: `superadmin`, `admin`, `partner`, `candidate`
- `profiles.role_id` referencia a `roles.id`
- RLS en `profiles` y `roles` con funciones `get_user_role` y `current_user_role`
- Frontend oculta secciones por rol; backend valida en endpoints

## Desarrollo local

1) Configurar variables de entorno (archivo `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo servidor)
- `ADMIN_SECRET` (solo servidor)

2) Instalar y correr:

```bash
npm install
npm run dev
```

## Convenciones

- Componentes que usan hooks del navegador: `'use client'`
- Validar acciones críticas en servidor además de la UI
- Mantener documentación en estos cuatro archivos; evitar duplicados

## Próximos pasos sugeridos

- Tests de integración ligeros para endpoints `/api/admin/*`
- Endpoints adicionales para requisiciones del negocio
- Monitoreo y límites de tasa en endpoints admin
