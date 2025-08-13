# PSPG Requisitions - Frontend Setup

## 🚀 Estado Actual del Proyecto

El frontend de la aplicación PSPG Requisitions ha sido creado exitosamente con NextJS y está listo para desarrollo.

### ✅ Componentes Implementados

- **Estructura NextJS 14** con App Router
- **Tailwind CSS** para estilos
- **TypeScript** para tipado estático
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

- Colores corporativos con tonos teal/verde azulado
- Diseño responsive
- Interfaz limpia y profesional
- Formulario organizado por secciones como en la imagen original
