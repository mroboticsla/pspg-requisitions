# Guía de Prueba - Sistema de Notificaciones Toast

## 🧪 Casos de Prueba

### 1. Toast de Éxito (Success)
**Acción**: Subir una foto de perfil válida
- Navega a `/profile`
- Haz hover sobre el avatar
- Click en el ícono de cámara
- Selecciona una imagen válida (JPG, PNG, WebP)
- **Resultado esperado**: Toast verde con "¡Foto de perfil actualizada con éxito!"

### 2. Toast de Error
**Acción**: Intentar subir un archivo inválido
- Navega a `/profile`
- Intenta subir un archivo no válido (ej: PDF, documento)
- **Resultado esperado**: Toast rojo con mensaje de error

**Acción alternativa**: Subir imagen muy grande (>5MB)
- **Resultado esperado**: Toast rojo indicando límite de tamaño

### 3. Modal de Confirmación (Danger)
**Acción**: Eliminar foto de perfil
- Navega a `/profile` (debe tener un avatar)
- Haz hover sobre el avatar
- Click en el botón rojo X (esquina superior derecha)
- **Resultado esperado**: 
  - Modal aparece con fondo oscuro
  - Título: "Eliminar foto de perfil"
  - Mensaje de confirmación
  - Botón rojo "Eliminar"
  - Botón gris "Cancelar"

**Subpruebas**:
- Click en "Cancelar" → Modal se cierra, no pasa nada
- Click fuera del modal → Modal se cierra
- Click en "Eliminar" → Avatar se elimina + toast verde de éxito

### 4. Toast de Error en Recorte
**Acción**: Forzar error en modal de recorte
- Subir imagen no cuadrada
- En el modal de recorte, hacer crop muy pequeño
- Click en "Recortar y Subir"
- **Resultado esperado**: Toast rojo si hay error

### 5. Múltiples Toasts Simultáneos
**Acción**: Disparar varias notificaciones rápidamente
- Abrir consola del navegador
- Ejecutar:
```javascript
// Asumiendo que useToast está disponible globalmente
const { success, error, warning, info } = useToast();
success('Primer mensaje');
setTimeout(() => error('Segundo mensaje'), 200);
setTimeout(() => warning('Tercer mensaje'), 400);
setTimeout(() => info('Cuarto mensaje'), 600);
```
- **Resultado esperado**: 
  - Todos los toasts aparecen apilados verticalmente
  - Cada uno con su color e ícono apropiado
  - Se van desapareciendo después de 3s cada uno

### 6. Auto-Dismissal
**Acción**: Verificar que los toasts desaparecen automáticamente
- Subir un avatar exitosamente
- NO hacer click en el botón X
- Esperar 3 segundos
- **Resultado esperado**: Toast desaparece automáticamente con animación slide-out

### 7. Cierre Manual
**Acción**: Cerrar toast manualmente
- Subir un avatar exitosamente
- Click en el botón X del toast
- **Resultado esperado**: Toast se cierra inmediatamente

### 8. Responsive Mobile
**Acción**: Verificar en viewport móvil
- Abrir DevTools (F12)
- Cambiar a modo responsive (Ctrl+Shift+M)
- Seleccionar iPhone/Android
- Realizar cualquier acción que genere toast
- **Resultado esperado**: 
  - Toast se adapta al ancho de pantalla
  - No se sale de los bordes
  - Texto legible
  - Botones fáciles de presionar

### 9. Modal en Mobile
**Acción**: Verificar modal en móvil
- En modo responsive móvil
- Intentar eliminar avatar
- **Resultado esperado**:
  - Modal se adapta a pantalla pequeña
  - Botones apilados verticalmente
  - Texto legible
  - Overlay cubre toda la pantalla

### 10. Accesibilidad
**Acción**: Navegación por teclado
- Abrir modal de confirmación
- Presionar Tab para navegar
- **Resultado esperado**: Foco visible en botones
- Presionar Escape
- **Resultado esperado**: Modal se cierra (si implementado)

## ✅ Checklist de Validación

### Visual
- [ ] Toasts aparecen en esquina superior derecha
- [ ] Animación de entrada es suave (slide-in)
- [ ] Animación de salida es suave (slide-out)
- [ ] Colores correctos por tipo:
  - [ ] Success: Verde
  - [ ] Error: Rojo
  - [ ] Warning: Amarillo
  - [ ] Info: Azul
- [ ] Iconos apropiados por tipo
- [ ] Botón X visible y funcional
- [ ] Texto legible en todos los tamaños

### Funcional
- [ ] Toast de éxito al subir avatar
- [ ] Toast de error con archivo inválido
- [ ] Modal de confirmación al eliminar
- [ ] Eliminación exitosa con toast
- [ ] Auto-dismissal después de 3s
- [ ] Cierre manual con botón X
- [ ] Múltiples toasts apilados correctamente
- [ ] No hay errores en consola
- [ ] Estado se actualiza correctamente

### Responsive
- [ ] Desktop (>1024px): Esquina superior derecha
- [ ] Tablet (768px-1024px): Se ve correctamente
- [ ] Mobile (<768px): Se adapta al ancho
- [ ] Modal responsive en todas las resoluciones

### Performance
- [ ] Sin lag en animaciones
- [ ] Sin re-renders innecesarios
- [ ] Memoria se libera al cerrar toasts

## 🐛 Problemas Comunes y Soluciones

### Toast no aparece
**Síntomas**: No se ve ninguna notificación
**Soluciones**:
1. Verificar que ToastContainer está en layout.tsx
2. Abrir DevTools → Inspeccionar → Buscar ToastContainer en DOM
3. Verificar z-index (debe ser z-50 o superior)
4. Verificar que el componente es cliente ('use client')

### Toast aparece detrás de otros elementos
**Síntomas**: Toast visible pero parcialmente oculto
**Solución**: Aumentar z-index en ToastContainer

### Animación entrecortada
**Síntomas**: Animación no es suave
**Solución**: Verificar que CSS tiene las animaciones definidas

### Modal no bloquea fondo
**Síntomas**: Se puede hacer click en elementos detrás del modal
**Solución**: Verificar que overlay tiene pointer-events: auto

### Múltiples toasts no se apilan
**Síntomas**: Toasts se sobreponen
**Solución**: Verificar space-y-2 en ToastContainer

## 📊 Resultados Esperados

### Éxito Total ✅
- Todos los toasts funcionan correctamente
- Modal de confirmación funcional
- Animaciones suaves
- Responsive en todos los dispositivos
- Sin errores en consola
- Avatar se actualiza correctamente

### Problemas Parciales ⚠️
- Algunos toasts funcionan, otros no
- Animaciones presentes pero con lag
- Responsive con problemas menores

### Fallo Crítico ❌
- Ningún toast aparece
- Errores en consola
- Modal no se abre
- Aplicación crashea

## 🔍 Debugging

### Consola del Navegador
```javascript
// Verificar que useToast está disponible
console.log(typeof useToast); // should be 'function'

// Verificar toasts en estado
// (Requiere React DevTools)
```

### React DevTools
1. Instalar extensión React DevTools
2. Abrir DevTools → React
3. Buscar ToastContainer component
4. Verificar estado: toasts array

### Network Tab
- No debería haber llamadas de red relacionadas con toasts
- Solo llamadas de API de Supabase para avatar

## 📝 Reporte de Pruebas

### Template

```
FECHA: [fecha de prueba]
NAVEGADOR: [Chrome/Firefox/Safari]
RESOLUCIÓN: [1920x1080/375x667/etc]

CASOS EXITOSOS:
- [x] Toast Success
- [x] Toast Error
- [ ] Modal Confirmación
...

PROBLEMAS ENCONTRADOS:
1. [Descripción del problema]
   - Navegador: [Chrome 120]
   - Pasos para reproducir: [...]
   - Resultado esperado: [...]
   - Resultado actual: [...]

OBSERVACIONES:
- [Cualquier nota adicional]
```

---

**Última actualización**: Enero 2025  
**Tiempo estimado de prueba**: 15-20 minutos
