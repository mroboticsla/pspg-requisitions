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

### Sidebar y permissions.modules

Además de filtrar por los roles permitidos definidos en `menuConfig.ts`, el Sidebar respeta `permissions.modules` del rol actual:

- Si `permissions.modules` existe (por ejemplo `{ "dashboard": true, "reports": true }`), sólo se muestran los módulos de primer nivel cuyo id esté activado.
- Si no existe `permissions.modules`, se usa únicamente el filtrado por roles del `menuConfig` (comportamiento previo).

La nueva UI de Roles permite activar/desactivar estos módulos fácilmente.

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

## Sistema de estilos para administración

### Paleta de colores
Configurada en `tailwind.config.js` con prefijo `admin-*`:

**Colores de acción:**
- `admin-success` (#059669) / `admin-successHover` (#047857) - Acciones positivas (crear, guardar)
- `admin-danger` (#dc2626) / `admin-dangerHover` (#b91c1c) - Acciones destructivas (eliminar)
- `admin-accent` (#FF1556) / `admin-accentHover` (#E8134E) - Acciones importantes
- `admin-primary` (#00253F) - Azul oscuro principal
- `admin-secondary` (#0369a1) - Azul secundario

**Backgrounds:**
- `bg-admin-bg-page` (#f8fafc) - Fondo de página
- `bg-admin-bg-card` (#ffffff) - Tarjetas
- `bg-admin-bg-hover` (#f1f5f9) - Hover
- `bg-admin-bg-disabled` (#f1f5f9) - Deshabilitado

**Texto:**
- `text-admin-text-primary` (#0f172a) - Texto principal
- `text-admin-text-secondary` (#475569) - Texto secundario
- `text-admin-text-muted` (#94a3b8) - Texto apagado

### Componentes reutilizables

**AdminLayout** (`app/components/AdminLayout.tsx`)
Layout consistente con subcomponentes para páginas de administración:

```tsx
import AdminLayout from '@/app/components/AdminLayout'

<AdminLayout>
  <AdminLayout.Header title="Mi Página" action={<button>Acción</button>} />
  <AdminLayout.Card>Contenido</AdminLayout.Card>
</AdminLayout>
```

Subcomponentes: Header, Card, Search, List, ListItem, FormActions, Grid, EmptyState

**AdminButton** (`app/components/AdminButton.tsx`)
Botones con estilos consistentes:

```tsx
import AdminButton from '@/app/components/AdminButton'
import { Plus, Save, Trash2 } from 'lucide-react'

<AdminButton.Primary icon={Plus}>Crear</AdminButton.Primary>
<AdminButton.Secondary icon={Save}>Guardar</AdminButton.Secondary>
<AdminButton.Danger icon={Trash2}>Eliminar</AdminButton.Danger>
<AdminButton.Outline>Ver</AdminButton.Outline>
<AdminButton.Ghost>Cancelar</AdminButton.Ghost>
```

### Diseño responsive
Las páginas de administración usan un diseño compacto y eficiente:
- **Desktop:** Layout optimizado con información densa pero legible
- **Tablet:** Grid adaptativo que colapsa apropiadamente
- **Móvil:** Stack vertical con botones full-width

Ejemplo de referencia: `app/admin/roles/page.tsx`

### Patrón de diseño: Gestión de Empresas

La página de Gestión de Empresas (`app/admin/companies/page.tsx`) implementa el **patrón de diseño estándar** para todas las pantallas de administración del sistema. Este patrón garantiza consistencia, usabilidad y experiencia de usuario optimizada tanto en desktop como en mobile.

#### Estructura general

**1. Header con título y acción principal**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <div>
    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de [Módulo]</h1>
    <p className="text-gray-600 mt-1">Descripción breve del módulo</p>
  </div>
  <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-accent text-white hover:bg-brand-accentDark disabled:opacity-50 transition-colors w-full sm:w-auto shadow-sm text-sm font-medium">
    <Plus className="w-4 h-4" />
    <span>Nueva [Entidad]</span>
  </button>
</div>
```

**2. Tarjetas de estadísticas (KPIs)**

**Desktop:** Grid de 3 columnas con tarjetas completas
```tsx
<div className="hidden sm:grid sm:grid-cols-3 gap-4">
  <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-6 text-white">
    {/* Contenido completo */}
  </div>
</div>
```

**Mobile:** Carrusel horizontal con scroll
```tsx
<div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
  <div className="flex gap-3 pb-2">
    <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-5 text-white flex-shrink-0 w-[280px]">
      {/* Tarjeta con ancho fijo para scroll horizontal */}
    </div>
  </div>
</div>
```

**CSS requerido para carrusel:** En `app/globals.css`:
```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

**3. Búsqueda/Filtros**
```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
  <input
    value={search}
    onChange={e => setSearch(e.target.value)}
    placeholder="Buscar por [criterios]..."
    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
  />
</div>
```

**4. Listado con efecto striped**

**Header de tabla (solo desktop):**
```tsx
<div className="hidden lg:block bg-gradient-to-r from-brand-dark to-[#003d66] text-white px-4 py-2.5 border-b border-gray-300">
  <div className="flex items-center gap-4">
    <div className="w-20 flex-shrink-0">
      <span className="text-xs font-semibold uppercase tracking-wide">Columna 1</span>
    </div>
    {/* Más columnas... */}
  </div>
</div>
```

**Efecto striped en filas:**
```tsx
{filteredItems.map((item, index) => {
  const isEven = index % 2 === 0
  const bgColor = isEven ? 'bg-white' : 'bg-gray-100'
  const hoverColor = isEven ? 'hover:bg-gray-50' : 'hover:bg-gray-200'
  
  return (
    <div
      key={item.id}
      className={`p-3 sm:p-4 ${bgColor} ${hoverColor} transition-colors border-b border-gray-200 last:border-b-0`}
    >
      {/* Contenido... */}
    </div>
  )
})}
```

**5. Layout responsive para cada item**

**Mobile (vertical stack):**
```tsx
<div className="flex flex-col gap-2 lg:hidden">
  {/* Header con nombre y badge */}
  <div className="flex items-start justify-between gap-2">
    <div className="flex items-start gap-2 flex-1 min-w-0">
      <Icon className="w-4 h-4 text-brand-dark flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-sm text-gray-900 leading-tight">{item.name}</h3>
        <p className="text-xs text-gray-600 leading-tight mt-0.5">{item.subtitle}</p>
      </div>
    </div>
    <span className="badge">Estado</span>
  </div>
  
  {/* Info condensada */}
  <div className="flex items-center gap-3 text-xs text-gray-600 ml-6">
    <span><strong>Campo:</strong> {item.field1}</span>
    <span>• {item.field2}</span>
  </div>

  {/* Botones en grid adaptativo */}
  <div className={`grid gap-2 mt-1 ${hasDeletePermission ? 'grid-cols-3' : 'grid-cols-2'}`}>
    <button className="btn-primary-sm">Editar</button>
    <button className="btn-secondary-sm">Acción 2</button>
    {hasDeletePermission && <button className="btn-danger-sm">Eliminar</button>}
  </div>
</div>
```

**Desktop (horizontal table-like):**
```tsx
<div className="hidden lg:flex lg:items-center lg:gap-4">
  {/* Columnas con anchos definidos */}
  <div className="w-20 flex-shrink-0">
    <span className="badge">Estado</span>
  </div>
  
  <div className="flex-1 min-w-[200px]">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-brand-dark flex-shrink-0" />
      <div className="min-w-0">
        <h3 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h3>
        <p className="text-xs text-gray-600 truncate">{item.subtitle}</p>
      </div>
    </div>
  </div>

  <div className="w-36 flex-shrink-0">
    <p className="text-xs text-gray-600 truncate">{item.field1}</p>
  </div>

  {/* Acciones: solo iconos con tooltips */}
  <div className="flex items-center gap-1.5 flex-shrink-0">
    <button className="p-1.5 rounded bg-blue-600 text-white hover:bg-blue-700" title="Editar">
      <Edit className="w-4 h-4" />
    </button>
    <button className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700" title="Acción">
      <Icon className="w-4 h-4" />
    </button>
    {hasDeletePermission && (
      <button className="p-1.5 rounded bg-brand-accent text-white hover:bg-brand-accentDark" title="Eliminar">
        <Trash2 className="w-4 h-4" />
      </button>
    )}
  </div>
</div>
```

#### Principios de diseño aplicados

**✅ Simplicidad funcional**
- **NO** incluir pantallas redundantes (ej: "Ver detalles" cuando "Editar" ya muestra todo)
- Consolidar funciones en una sola pantalla con permisos granulares

**✅ Contraste visual**
- Efecto striped con `bg-white` / `bg-gray-100` para distinguir filas
- Bordes sutiles `border-gray-200` entre elementos
- Estados hover diferenciados

**✅ Responsive by design**
- Mobile: Layout vertical, carrusel de KPIs, botones full-width
- Desktop: Layout horizontal tipo tabla, grid de KPIs, iconos compactos
- Breakpoints: `sm:` (640px), `lg:` (1024px)

**✅ Feedback visual**
- Transiciones suaves: `transition-colors`
- Estados disabled: `disabled:opacity-50`
- Loading states con spinners centrados

**✅ Accesibilidad**
- Tooltips descriptivos en botones de solo icono
- Contrastes de color WCAG AA
- Textos con `truncate` en lugar de overflow

#### Cómo referenciar este patrón

Cuando necesites crear o modificar una pantalla de administración:

1. **Copia la estructura base** de `app/admin/companies/page.tsx`
2. **Adapta los siguientes elementos:**
   - Título del módulo y descripción
   - Campos de las columnas (mantén la estructura de anchos)
   - Acciones específicas (mantén los colores semánticos)
   - Estados/badges según tu entidad
3. **Mantén la filosofía:**
   - Carrusel en mobile para KPIs
   - Efecto striped en listados
   - Sin redundancia de pantallas
   - Layout responsive nativo

**Referencia visual completa:** Ver `app/admin/companies/page.tsx` líneas 1-490

**Componentes reutilizables:**
- Header: líneas 170-184
- KPIs Desktop: líneas 245-283
- KPIs Mobile (carrusel): líneas 189-243
- Búsqueda: líneas 286-293
- Header tabla: líneas 307-327
- Items con striped: líneas 336-470

**Clases CSS clave:**
- Carrusel: `overflow-x-auto scrollbar-hide -mx-4 px-4`
- Striped: `bg-white` / `bg-gray-100` alternados
- Responsive grid botones: `grid grid-cols-2` o `grid-cols-3`
- Header tabla: `bg-gradient-to-r from-brand-dark to-[#003d66]`

#### Ejemplo de aplicación

Para crear "Gestión de Partners":
1. Copiar `app/admin/companies/page.tsx` → `app/admin/partners/page.tsx`
2. Reemplazar:
   - `Company` → `Partner`
   - `companies` → `partners`
   - Campos: adaptar columnas a modelo Partner
   - KPIs: Total Partners, Activos, Inactivos
3. Mantener intacto:
   - Estructura del carrusel mobile
   - Efecto striped
   - Layout responsive
   - Sistema de botones con permisos

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
