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

---

## Navegación del Sistema

### Estructura de Rutas

- **`/` (Home)**: Redirección automática según estado de autenticación
  - Usuario autenticado → `/dashboard`
  - Sin autenticación → `/auth`
- **`/dashboard`**: Dashboard administrativo completo con estadísticas, gráficos y herramientas de gestión (admin/superadmin)
- **`/admin`**: Redirección automática a `/dashboard`
- **`/admin/users`**: Gestión de usuarios del sistema
- **`/admin/roles`**: Gestión de roles y permisos (solo superadmin)
- **`/auth`**: Página de autenticación (login/register)
- **`/profile`**: Perfil del usuario actual

### Menú de Navegación Lateral

El menú se configura en `app/components/navigation/menuConfig.ts` y se filtra automáticamente según el rol del usuario:

- **Dashboard**: Acceso al panel administrativo (`/dashboard`) - Solo admin/superadmin
- **Requisiciones**: Gestión de requisiciones (nuevas, aprobar, mis requisiciones) - Según rol
- **Reportes**: Generación de reportes - Solo admin/superadmin
- **Administración**: Gestión de usuarios y roles - Solo admin/superadmin
  - Usuarios: `/admin/users`
  - Roles: `/admin/roles` (solo superadmin)
- **Mi perfil**: Perfil del usuario actual - Todos los usuarios

### Flujo de Navegación

1. **Inicio de sesión exitoso**: Usuario es redirigido automáticamente a `/dashboard`
2. **Click en logo**: Usuario autenticado es redirigido a `/dashboard`
3. **Acceso directo a `/`**: Redirección inteligente según estado de autenticación
4. **Sin autenticación**: Cualquier ruta protegida redirige a `/auth`

---

## Dashboard Administrativo

El sistema cuenta con un dashboard administrativo completo en `/dashboard` con las siguientes características:

### Características Principales

- **KPIs en tiempo real**: Total usuarios, usuarios activos/inactivos, roles configurados
- **Gráficos interactivos**: Tendencia de registros (línea) y distribución de roles (pastel)
- **Filtros por fecha**: 7 días, 30 días o histórico completo
- **Exportación de datos**: CSV, Excel y JSON
- **Accesos rápidos**: Navegación directa a gestión de usuarios y roles
- **Alertas inteligentes**: Notificaciones contextuales según el estado del sistema

### Exportación de Datos

El dashboard permite exportar información en tres formatos:

- **CSV**: Compatible con Excel, Google Sheets (UTF-8 con BOM)
- **Excel**: Formato nativo .xls
- **JSON**: Para integraciones y backups

Datos exportados incluyen: ID, nombre, teléfono, rol, estado y fecha de creación.

### Paleta de Colores

El dashboard utiliza los colores de marca PSP Group:
- Navy/Azul Oscuro (#00253F): Elementos principales
- Rosa/Magenta (#FF1556): Elementos activos y destacados
- Grises neutrales: Elementos secundarios y fondos

### Acceso

- **Ruta**: `/dashboard`
- **Permisos**: Admin y Superadmin
- **Tecnologías**: Recharts (gráficos), date-fns (fechas)
