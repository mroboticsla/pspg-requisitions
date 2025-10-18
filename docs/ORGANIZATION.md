# Organización de la Documentación

**Fecha de reorganización**: 17 de octubre de 2025

## 📚 Estructura Actual

La documentación del proyecto PSPG Requisitions está organizada en **5 archivos principales**:

```
docs/
├── README.md                    → Índice principal y visión general del sistema
├── README-FRONTEND.md           → Documentación completa del frontend
├── README-BACKEND.md            → Documentación completa del backend
├── README-SUPABASE.md           → Configuración de base de datos y storage
└── README-PUBLIC-PORTAL.md      → Portal público y personalización
```

---

## 📖 Guía de Uso por Rol

### 👨‍💻 Desarrollador Frontend
**Archivo principal**: `README-FRONTEND.md`

**Encontrarás**:
- Stack y estado global (AuthProvider)
- Estructura de navegación y sidebar
- Sistema de notificaciones (Toast + ConfirmModal)
- Sistema de avatares con upload y crop
- Auditoría de sesiones
- Sistema de estilos administrativos
- Patrón de diseño para pantallas de gestión
- Componentes reutilizables (AdminLayout, AdminButton)

**También consultar**: 
- `README.md` para entender la navegación general
- `README-PUBLIC-PORTAL.md` si trabajas en el portal público

---

### 👨‍💻 Desarrollador Backend
**Archivo principal**: `README-BACKEND.md`

**Encontrarás**:
- Endpoints API disponibles
- Sistema de autenticación y autorización
- Operaciones administrativas protegidas
- Validación de roles y permisos
- Librerías y utilidades del lado servidor
- Seguridad y RLS
- Pruebas rápidas

**También consultar**: 
- `README-SUPABASE.md` para entender las políticas RLS
- `README.md` para variables de entorno

---

### 🗄️ Administrador de Base de Datos
**Archivo principal**: `README-SUPABASE.md`

**Encontrarás**:
- Tablas principales (roles, profiles, companies, etc.)
- Configuración SQL completa
- Políticas RLS detalladas
- Storage para avatares
- Funciones RPC utilizadas
- Scripts de setup y verificación
- Tips de debugging

**También consultar**: 
- `README-BACKEND.md` para entender cómo se usan las funciones desde las APIs

---

### 🎨 Marketing / Gestión de Contenido
**Archivo principal**: `README-PUBLIC-PORTAL.md`

**Encontrarás**:
- Descripción general del portal público
- Estructura de páginas (Home, About, Jobs, Contact)
- Componentes del portal
- Guía completa de personalización:
  - Información de contacto
  - Hero slider
  - Servicios
  - Estadísticas
  - Empleos
  - Formulario de contacto
- Inicio rápido y testing

**También consultar**: 
- `README.md` para entender la estructura de rutas

---

### 🧑‍💼 Project Manager / Tech Lead
**Archivo principal**: `README.md`

**Encontrarás**:
- Visión general del stack
- Estructura del proyecto
- Flujo de roles y acceso (RBAC)
- Navegación del sistema completo
- Dashboard administrativo
- Próximos pasos sugeridos
- Índice de toda la documentación
- Stack tecnológico completo

**También consultar**: 
- Todos los demás README según la necesidad específica

---

## 🗑️ Archivos Eliminados (Transitorios)

Los siguientes archivos fueron eliminados por contener información transitoria o ya no relevante:

- ❌ `FINAL-SUMMARY.md` - Resumen de implementación pasada
- ❌ `FIXES-APPLIED.md` - Correcciones ya aplicadas
- ❌ `IMPLEMENTATION-COMPLETE.md` - Estado de implementación transitorio
- ❌ `MIGRATION-ROOT-HOME.md` - Migración ya completada
- ❌ `CUSTOMIZATION-GUIDE.md` - Integrado en README-PUBLIC-PORTAL.md
- ❌ `QUICKSTART-PUBLIC-PORTAL.md` - Integrado en README-PUBLIC-PORTAL.md
- ❌ `README-STRUCTURE.md` - Información redundante, integrada en otros README

**Razón**: Estos archivos documentaban procesos de implementación, migraciones y configuraciones que ya fueron completadas. Su información útil fue integrada en los README principales.

---

## ✅ Beneficios de la Reorganización

### 1. **Reducción de Redundancia**
- De 12 archivos a 5 archivos principales
- Información consolidada y sin duplicados
- Fácil de mantener actualizada

### 2. **Navegación Clara**
- Cada archivo tiene un propósito específico
- Guía por rol para encontrar información rápidamente
- README principal como índice maestro

### 3. **Información Actualizada**
- Solo contenido relevante y actual
- Sin referencias a implementaciones transitorias
- Guías completas y funcionales

### 4. **Mejor Onboarding**
- Nuevos desarrolladores encuentran info rápidamente
- Estructura lógica y predecible
- Ejemplos prácticos en cada sección

---

## 🔄 Mantenimiento de la Documentación

### Reglas Generales

1. **No crear archivos transitorios** en `/docs/`
   - Usar issues/PRs para tracking de implementaciones
   - CHANGELOG.md para cambios históricos

2. **Actualizar archivos existentes** cuando:
   - Se agregan nuevas features
   - Se cambian flujos importantes
   - Se actualizan dependencias mayores

3. **Mantener consistencia**:
   - Formato Markdown estándar
   - Secciones numeradas donde sea útil
   - Code blocks con sintaxis resaltada
   - Ejemplos prácticos cuando sea posible

4. **Enlaces internos**:
   - Referenciar otros README cuando sea necesario
   - Evitar duplicar información entre archivos
   - Mantener un solo "source of truth" por tema

---

## 📝 Checklist de Actualización

Cuando hagas cambios mayores al sistema, actualiza:

### Feature nuevo en Frontend
- [ ] `README-FRONTEND.md` - Documentar el componente/feature
- [ ] `README.md` - Si afecta la navegación o estructura general
- [ ] `CHANGELOG.md` - Registrar el cambio

### Nuevo Endpoint API
- [ ] `README-BACKEND.md` - Documentar el endpoint
- [ ] `README.md` - Si es un módulo importante
- [ ] `CHANGELOG.md` - Registrar el cambio

### Cambio en Base de Datos
- [ ] `README-SUPABASE.md` - Documentar tablas/políticas/funciones
- [ ] `README-BACKEND.md` - Si afecta endpoints
- [ ] `CHANGELOG.md` - Registrar el cambio
- [ ] Crear script en `/scripts/` si es migración

### Cambio en Portal Público
- [ ] `README-PUBLIC-PORTAL.md` - Documentar el cambio
- [ ] `README.md` - Si afecta rutas principales
- [ ] `CHANGELOG.md` - Registrar el cambio

---

## 🎯 Contacto y Contribuciones

Para sugerencias sobre la documentación o reportar información faltante/incorrecta, crear un issue en el repositorio con la etiqueta `documentation`.

**Mantenedor de documentación**: Tech Lead / Project Owner

---

Última actualización: 17 de octubre de 2025
