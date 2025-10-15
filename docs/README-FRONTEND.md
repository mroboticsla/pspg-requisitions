# PSP Group Jobs - Frontend Setup

## 🚀 Estado Actual del Proyecto

El frontend de la aplicación PSP Group Jobs ha sido creado exitosamente con NextJS y está listo para desarrollo.

### ✅ Componentes Implementados

- **Estructura NextJS 14** con App Router
- **Tailwind CSS** para estilos
- **TypeScript** para tipado estático
- **Pantalla de Inicio de Sesión** con formulario de correo electrónico y contraseña
- **Formulario de Requisición Completo** basado en la imagen proporcionada

### 📋 Formulario Implementado

El formulario incluye todas las secciones mostradas en la imagen:

1. **Datos Generales**
   - Nombre de la empresa
   - Departamento
   - Puesto requerido
   - Número de vacantes

2. **Información sobre el Puesto**
   - Checkboxes para tipo de puesto (nueva creación, reemplazo, etc.)
   - Motivo del puesto
   - Nombre del empleado a reemplazar

3. **Funciones Principales del Puesto**
   - 5 campos de texto para describir funciones

4. **Perfil del Puesto**
   - Formación académica requerida
   - Otros estudios

5. **Habilidad Informática Requerida**
   - Sistema operativo
   - Niveles de habilidad (básico, intermedio, avanzado)
   - Herramientas específicas

6. **Habilidad y Conocimientos Técnicos**
   - Áreas de conocimiento
   - Responsabilidades
   - Tipo de supervisión

## 🛠️ Próximos Pasos

Para ejecutar el proyecto:

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🔗 Integración Backend

El formulario está preparado para conectarse con un backend futuro:
- Estado del formulario manejado con React hooks
- Función `handleSubmit` lista para enviar datos
- Estructura de datos organizada para API calls

## 🎨 Diseño

- **Colores de Marca**: #00253F (azul oscuro) y #FF1556 (rosa/rojo)
- Diseño responsive
- Interfaz limpia y profesional
- Formulario organizado por secciones como en la imagen original

## 🧭 Navegación y roles

- Sidebar vertical colapsable integrado en `app/layout.tsx` mediante `app/components/navigation/Sidebar.tsx`.
- Configuración del menú y filtrado por rol en `app/components/navigation/menuConfig.ts`.
- Rol actual obtenido con `lib/getCurrentUserRole.ts` que usa la RPC `public.current_user_role()` o el perfil cargado.
- Para proteger páginas o secciones usa el wrapper cliente `app/components/RequireRole.tsx`:

```tsx
<RequireRoleClient allow={["admin", "superadmin"]}>
   <AdminContent />
</RequireRoleClient>
```

Notas
- Ocultar elementos del menú no sustituye la autorización en backend (RLS y APIs deben validar permisos).
- El estado colapsado del sidebar se persiste en localStorage (`sidebar-collapsed`).
