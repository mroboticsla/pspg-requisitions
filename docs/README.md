# PSPG Requisitions — Documentación

Este directorio centraliza la documentación del proyecto en cinco guías principales:

- **`README.md`** (este): visión general del sistema y navegación
- **`README-FRONTEND.md`**: UI, componentes, navegación, toasts, avatares y sistema de estilos administrativos
- **`README-BACKEND.md`**: endpoints API, seguridad, roles y utilidades del lado servidor
- **`README-SUPABASE.md`**: configuración de base de datos, RLS, funciones y storage
- **`README-PUBLIC-PORTAL.md`**: portal público, estructura, componentes y personalización

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

### Backend y API
- Tests de integración para endpoints `/api/admin/*`
- Endpoints adicionales para gestión de requisiciones
- Monitoreo y límites de tasa en endpoints admin
- Sistema de notificaciones push

### Portal Público
- Integrar formulario de contacto con servicio de email (SendGrid, Resend)
- Conectar portal de empleos con base de datos real
- Implementar reCAPTCHA en formularios
- Agregar páginas legales (política de privacidad, términos y condiciones)
- Implementar Analytics (Google Analytics)
- Optimización SEO (meta tags, sitemap, schema.org)

### Sistema de Requisiciones
- Implementar workflow de aprobación multinivel
- Sistema de notificaciones por email
- Exportación de reportes de requisiciones
- Dashboard específico para partners
- Historial de cambios en requisiciones

### Mejoras de UX/UI
- Sistema de notificaciones en tiempo real (WebSockets)
- Chat integrado para soporte
- Tutorial interactivo para nuevos usuarios
- Modo oscuro (dark mode)

---

## Guía de Documentación

### Para Desarrolladores Frontend

**Consultar**: `README-FRONTEND.md`
- Estructura de componentes UI
- Sistema de navegación y sidebar
- Toast notifications y modales
- Sistema de avatares con upload y crop
- Auditoría de sesiones
- Sistema de estilos administrativos (AdminLayout, AdminButton)
- Patrón de diseño para pantallas de gestión
- Formularios dinámicos de requisiciones

### Para Desarrolladores Backend

**Consultar**: `README-BACKEND.md`
- Endpoints API disponibles
- Sistema de autenticación y autorización
- Operaciones administrativas protegidas
- Validación de roles y permisos
- Utilidades del lado servidor
- Seguridad y mejores prácticas

### Para Administradores de Base de Datos

**Consultar**: `README-SUPABASE.md`
- Esquema de base de datos completo
- Configuración de tablas y relaciones
- Políticas RLS (Row Level Security)
- Funciones y RPCs
- Configuración de Storage (avatares)
- Scripts de migración y setup

### Para Marketing/Contenido

**Consultar**: `README-PUBLIC-PORTAL.md`
- Estructura del portal público
- Guía de personalización de contenido
- Actualización de información de contacto
- Gestión de empleos publicados
- Integración con Google Maps
- SEO y mejores prácticas

---

## Stack Tecnológico Completo

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **Gráficos**: Recharts
- **Fechas**: date-fns
- **Validación**: React Hook Form (planificado)

### Backend
- **API**: Next.js Route Handlers (`app/api/*`)
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth (PKCE flow)
- **Storage**: Supabase Storage
- **Seguridad**: RLS (Row Level Security)

### DevOps
- **Hosting**: Vercel (recomendado)
- **Control de versiones**: Git/GitHub
- **CI/CD**: Vercel automático
- **Monitoreo**: Por implementar

### Herramientas de Desarrollo
- **Editor**: VS Code
- **Linter**: ESLint
- **Formatter**: Prettier (configurar)
- **Type Checking**: TypeScript strict mode

---

## Navegación del Sistema

### Portal Público (sin autenticación requerida)

- **`/`**: Landing page del portal público con secciones de hero, servicios, estadísticas y contacto
- **`/about`**: Acerca de nosotros (misión, visión, valores, timeline, equipo)
- **`/jobs`**: Portal de empleos con búsqueda y filtros
- **`/contact`**: Página de contacto con formulario y mapa

Ver documentación completa en `README-PUBLIC-PORTAL.md`.

### Sistema Administrativo (requiere autenticación)

#### Rutas Principales

- **`/dashboard`**: Dashboard administrativo con KPIs, gráficos y herramientas de gestión
- **`/admin/users`**: Gestión de usuarios del sistema
- **`/admin/roles`**: Gestión de roles y permisos (solo superadmin)
- **`/admin/companies`**: Gestión de empresas/clientes
- **`/admin/templates`**: Plantillas de formularios dinámicos
- **`/requisitions`**: Gestión de requisiciones de personal
- **`/profile`**: Perfil del usuario actual
- **`/settings`**: Configuración de la cuenta

#### Menú de Navegación Lateral

El menú se configura en `app/components/navigation/menuConfig.ts` y se filtra automáticamente según el rol del usuario:

- **Dashboard**: Panel administrativo - Solo admin/superadmin
- **Requisiciones**: Gestión de requisiciones - Según rol y permisos
- **Reportes**: Generación de reportes - Solo admin/superadmin
- **Administración**: Gestión de usuarios, roles, empresas y plantillas - Solo admin/superadmin
- **Mi perfil**: Perfil personal - Todos los usuarios autenticados

**Permisos por módulos**: Si un rol tiene definido `permissions.modules` (ej: `{"dashboard": true, "reports": false}`), el sidebar mostrará solo los módulos habilitados.

### Flujo de Navegación

1. **Usuario no autenticado accede a `/`**: Ve el portal público
2. **Usuario autenticado accede a `/`**: Redirigido a `/dashboard`
3. **Inicio de sesión exitoso**: Redirección automática a `/dashboard`
4. **Click en logo** (usuario autenticado): Va a `/dashboard`
5. **Acceso a ruta protegida sin auth**: Redirigido a `/auth`
6. **Botón "Consola de Administración"** (en portal público): Va a `/dashboard`

---

## Dashboard Administrativo

El sistema cuenta con un dashboard administrativo completo en `/dashboard` diseñado para admin y superadmin.

### Características Principales

- **KPIs en tiempo real**: Total usuarios, usuarios activos/inactivos, roles configurados
- **Gráficos interactivos**: Tendencia de registros (línea) y distribución de roles (pastel)
- **Filtros por fecha**: 7 días, 30 días o histórico completo
- **Exportación de datos**: CSV, Excel y JSON
- **Accesos rápidos**: Navegación directa a gestión de usuarios y roles
- **Alertas inteligentes**: Notificaciones contextuales según el estado del sistema

### Paleta de Colores Institucionales

El sistema utiliza los colores de marca PSP Group definidos en `tailwind.config.js`:

**Colores principales:**
- `brand-dark` (#00253F): Azul oscuro principal
- `brand-accent` (#FF1556): Rosa/Magenta para acentos y CTAs
- `brand-accentDark` (#E8134E): Variante oscura del acento

**Sistema administrativo:**
- `admin-primary`, `admin-secondary`: Colores de acción
- `admin-success`, `admin-danger`: Estados y acciones
- `admin-bg-page`, `admin-bg-card`: Fondos consistentes
- `admin-text-primary`, `admin-text-secondary`: Jerarquía de texto

Ver detalles completos en `README-FRONTEND.md` (sección "Sistema de estilos para administración").

### Acceso y Tecnologías

- **Ruta**: `/dashboard`
- **Permisos**: Admin y Superadmin
- **Librerías**: Recharts (gráficos), date-fns (fechas), lucide-react (iconos)
- **Exportación**: Implementada en `lib/exportUtils.ts`
