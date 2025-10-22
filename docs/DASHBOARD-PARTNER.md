# Dashboard para Partners

## Resumen

Se ha implementado un Dashboard independiente y específico para usuarios con rol **Partner**, permitiéndoles tener visibilidad completa y control sobre sus requisiciones de personal.

## Cambios Realizados

### 1. Nuevo Dashboard para Partners (`/app/dashboard/partner/page.tsx`)

Se creó un componente completamente nuevo con las siguientes características:

#### **KPIs Principales**
- **Total de Requisiciones**: Muestra el total de requisiciones creadas en el período seleccionado
- **En Proceso**: Suma de requisiciones enviadas y en revisión
- **Aprobadas**: Contador de requisiciones aprobadas con porcentaje del total
- **Borradores**: Requisiciones pendientes de completar y enviar

#### **Filtros Temporales**
- 7 días
- 30 días
- Todo (historial completo)

Los filtros se aplican dinámicamente a todos los KPIs y gráficos.

#### **Visualizaciones**

1. **Gráfico de Pastel - Distribución por Estado**
   - Muestra la distribución de requisiciones según su estado
   - Colores diferenciados por estado:
     - Borrador: Gris
     - Enviada: Azul
     - En Revisión: Amarillo
     - Aprobada: Verde
     - Rechazada: Rojo
     - Cancelada: Gris oscuro
     - Cubierta: Púrpura

2. **Gráfico de Barras - Tendencia de Creación**
   - Muestra cuántas requisiciones se crearon por día
   - Adaptable al período seleccionado (7, 30 o 90 días)

3. **Resumen de Estados**
   - Grid con 7 tarjetas mostrando el contador de cada estado
   - Iconos distintivos para cada estado
   - Colores corporativos

#### **Requisiciones Recientes**
- Lista las últimas 5 requisiciones creadas
- Muestra: puesto, departamento, número de vacantes, fecha de creación y estado
- Botón de acción rápida para ver detalles
- Link para ver todas las requisiciones

#### **Acciones Rápidas**
- **Banner destacado** para crear nueva requisición
- Acceso directo a todas las funcionalidades principales

#### **Alertas Inteligentes**
- Notificación visible cuando hay borradores pendientes
- Sugerencias para completar acciones pendientes

### 2. Redirección Automática por Rol (`/app/dashboard/page.tsx`)

Se modificó el dashboard principal para redirigir automáticamente a los partners:

```typescript
// Redirigir a partners si el usuario es partner
useEffect(() => {
  if (loading || !profile) return
  const roleName = (profile as any)?.roles?.name
  if (roleName === 'partner') {
    router.replace('/dashboard/partner')
  }
}, [loading, profile, router])
```

**Comportamiento:**
- **Partners** → Redirigidos automáticamente a `/dashboard/partner`
- **Admins y SuperAdmins** → Ven el dashboard administrativo con métricas de usuarios, roles, etc.

### 3. Actualización del Menú (`/app/components/navigation/menuConfig.ts`)

Se actualizó la configuración del menú para que el Dashboard sea visible para partners:

```typescript
{ 
  id: 'dashboard', 
  label: 'Dashboard', 
  path: '/dashboard', 
  roles: ['superadmin', 'admin', 'partner'], // Se agregó 'partner'
  icon: LayoutDashboard 
}
```

## Estructura de Archivos

```
app/
  dashboard/
    page.tsx              # Dashboard para Admin/SuperAdmin (con redirección)
    layout.tsx            # Layout compartido
    partner/
      page.tsx            # ✨ NUEVO: Dashboard específico para Partners
```

## Seguridad y Permisos

### Protección a Nivel de Componente
```typescript
<RequireRoleClient 
  allow={['partner', 'admin', 'superadmin']} 
  fallback={<div>Acceso restringido...</div>}
>
  {content}
</RequireRoleClient>
```

### Validación de Sesión
- Timeout de 25 segundos para verificación de sesión
- Redirección automática al login si no hay usuario autenticado
- Manejo de estados de carga apropiado

## Funcionalidades Destacadas

### 📊 Análisis Visual
- Gráficos interactivos con tooltips informativos
- Responsive design para móviles y escritorio
- Colores consistentes con la marca PSP Group

### 🔄 Actualización en Tiempo Real
- Los datos se actualizan al cambiar el período
- Cálculos automáticos de porcentajes y estadísticas
- Manejo de estados vacíos con mensajes apropiados

### 🎨 Diseño Consistente
- Uso de paleta de colores corporativos (Tailwind custom classes)
- Iconos de Lucide React consistentes en toda la aplicación
- Animaciones sutiles y transiciones suaves

### 📱 Responsivo
- Grid adaptable a diferentes tamaños de pantalla
- Layout optimizado para móviles (tarjetas apiladas)
- Menús y controles táctiles en dispositivos móviles

## Métricas Mostradas

1. **Estado de Requisiciones**
   - Borradores
   - Enviadas
   - En Revisión
   - Aprobadas
   - Rechazadas
   - Canceladas
   - Cubiertas

2. **Análisis Temporal**
   - Requisiciones creadas por día
   - Tendencias históricas
   - Comparación de períodos

3. **Rendimiento**
   - Tasa de aprobación (% de aprobadas vs total)
   - Requisiciones en proceso
   - Completitud (borradores vs enviadas)

## Tecnologías Utilizadas

- **Next.js 14** (App Router)
- **TypeScript**
- **Recharts** (visualizaciones)
- **Tailwind CSS** (estilos)
- **date-fns** (manejo de fechas)
- **Lucide React** (iconos)
- **Supabase** (backend/autenticación)

## Acceso y Pruebas

### Usuarios con Rol Partner
1. Iniciar sesión con credenciales de partner
2. Click en "Dashboard" en el menú lateral
3. Automáticamente se muestra el dashboard de partner con sus métricas

### Usuarios Admin/SuperAdmin
1. Iniciar sesión con credenciales de admin
2. Click en "Dashboard" en el menú lateral
3. Se muestra el dashboard administrativo (usuarios, roles, etc.)
4. Para ver el dashboard de partner, navegar manualmente a `/dashboard/partner`

## Mejoras Futuras (Sugerencias)

1. **Exportación de Datos**
   - Agregar botones para exportar métricas en CSV/Excel/JSON
   - Similar a la funcionalidad del dashboard de administradores

2. **Notificaciones Push**
   - Alertas cuando una requisición cambia de estado
   - Recordatorios para completar borradores

3. **Comparación de Períodos**
   - Vista comparativa entre períodos (mes actual vs mes anterior)
   - Indicadores de tendencia (↑ ↓)

4. **Filtros Avanzados**
   - Filtrar por departamento
   - Filtrar por tipo de puesto
   - Filtrar por número de vacantes

5. **Gráficos Adicionales**
   - Tiempo promedio de aprobación
   - Vacantes por departamento
   - Histórico de cubiertas vs nuevas

## Notas Técnicas

- El componente utiliza `listRequisitions` de `@/lib/requisitions` con filtro por `created_by`
- Los datos se filtran en el cliente después de ser cargados (puede optimizarse con filtros en el servidor)
- Los gráficos se renderizan solo cuando hay datos disponibles
- Se manejan estados de carga y error apropiadamente

## Soporte

Para reportar problemas o sugerir mejoras, contactar al equipo de desarrollo.

---

**Última actualización**: 22 de octubre de 2025  
**Versión**: 1.0.0  
**Autor**: GitHub Copilot
