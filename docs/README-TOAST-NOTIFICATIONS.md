# Sistema de Notificaciones Toast

Sistema de notificaciones modernas para mejorar la experiencia del usuario en la aplicación.

## 📋 Descripción General

Este sistema reemplaza los `alert()` y `confirm()` de JavaScript nativo con componentes React estilizados y animados que proporcionan:
- **Notificaciones toast**: Mensajes temporales no intrusivos
- **Modales de confirmación**: Diálogos elegantes para acciones destructivas
- **Animaciones fluidas**: Entrada y salida suaves
- **Auto-dismissal**: Desaparición automática configurable

## 🎨 Componentes

### Toast
Componente de notificación individual con soporte para 4 tipos:

```tsx
import { useToast } from '@/lib/useToast';

function MiComponente() {
  const { success, error, warning, info } = useToast();

  const handleGuardar = async () => {
    try {
      // ... lógica de guardado
      success('¡Datos guardados con éxito!');
    } catch (err) {
      error('Error al guardar los datos');
    }
  };
}
```

#### Tipos de Toast

| Tipo | Uso | Color | Icono |
|------|-----|-------|-------|
| `success` | Operaciones exitosas | Verde | ✓ |
| `error` | Errores y fallos | Rojo | ✕ |
| `warning` | Advertencias | Amarillo | ⚠ |
| `info` | Información general | Azul | ℹ |

#### Duración Personalizada

```tsx
// Duración por defecto: 3000ms (3 segundos)
success('Mensaje con duración por defecto');

// Duración personalizada
const { showToast } = useToast();
showToast('Este mensaje durará 5 segundos', 'info', 5000);
```

### ConfirmModal
Modal de confirmación para acciones importantes:

```tsx
import { useState } from 'react';
import ConfirmModal from '@/app/components/ConfirmModal';

function MiComponente() {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleEliminar = () => {
    // Lógica de eliminación
    setShowConfirm(false);
  };

  return (
    <>
      <button onClick={() => setShowConfirm(true)}>
        Eliminar
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        title="Confirmar eliminación"
        message="¿Estás seguro de que deseas eliminar este elemento?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleEliminar}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
```

#### Tipos de ConfirmModal

| Tipo | Uso | Color |
|------|-----|-------|
| `danger` | Acciones destructivas (eliminar, desactivar) | Rojo |
| `warning` | Acciones que requieren atención | Amarillo |
| `info` | Confirmaciones informativas | Azul |

## 🔧 Instalación y Configuración

### 1. ToastContainer ya está integrado

El `ToastContainer` ya está agregado en `app/layout.tsx`, por lo que las notificaciones funcionan globalmente en toda la aplicación.

```tsx
// app/layout.tsx
import ToastContainer from './components/ToastContainer';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {/* ... contenido ... */}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Usar el hook useToast

En cualquier componente cliente (`'use client'`):

```tsx
'use client';

import { useToast } from '@/lib/useToast';

export default function MiComponente() {
  const { success, error, warning, info } = useToast();

  // Usar donde necesites
  success('¡Operación exitosa!');
  error('Ocurrió un error');
  warning('Advertencia importante');
  info('Información útil');
}
```

## 🎯 Ejemplos de Uso

### Caso 1: Formulario con Validación

```tsx
'use client';

import { useState } from 'react';
import { useToast } from '@/lib/useToast';

export default function Formulario() {
  const { success, error, warning } = useToast();
  const [nombre, setNombre] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      warning('Por favor ingresa tu nombre');
      return;
    }

    try {
      await api.guardar({ nombre });
      success('¡Perfil actualizado con éxito!');
      setNombre('');
    } catch (err) {
      error('Error al guardar. Intenta de nuevo.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre"
      />
      <button type="submit">Guardar</button>
    </form>
  );
}
```

### Caso 2: Eliminación con Confirmación

```tsx
'use client';

import { useState } from 'react';
import { useToast } from '@/lib/useToast';
import ConfirmModal from '@/app/components/ConfirmModal';

export default function ListaItems() {
  const { success, error } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState<string | null>(null);

  const confirmarEliminacion = (id: string) => {
    setItemAEliminar(id);
    setShowConfirm(true);
  };

  const eliminarItem = async () => {
    if (!itemAEliminar) return;

    try {
      await api.eliminar(itemAEliminar);
      success('Item eliminado con éxito');
      setShowConfirm(false);
      setItemAEliminar(null);
    } catch (err) {
      error('Error al eliminar el item');
    }
  };

  return (
    <>
      <ul>
        <li>
          <button onClick={() => confirmarEliminacion('123')}>
            Eliminar
          </button>
        </li>
      </ul>

      <ConfirmModal
        isOpen={showConfirm}
        title="Eliminar Item"
        message="¿Estás seguro de que deseas eliminar este item? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={eliminarItem}
        onCancel={() => {
          setShowConfirm(false);
          setItemAEliminar(null);
        }}
      />
    </>
  );
}
```

### Caso 3: Proceso de Múltiples Pasos

```tsx
'use client';

import { useToast } from '@/lib/useToast';

export default function ProcesoMultiPaso() {
  const { success, info, error } = useToast();

  const ejecutarProceso = async () => {
    try {
      info('Iniciando proceso...');
      
      await paso1();
      info('Paso 1 completado');
      
      await paso2();
      info('Paso 2 completado');
      
      await paso3();
      success('¡Proceso completado con éxito!');
    } catch (err) {
      error('El proceso falló. Por favor intenta de nuevo.');
    }
  };

  return (
    <button onClick={ejecutarProceso}>
      Iniciar Proceso
    </button>
  );
}
```

## 🎨 Personalización

### Modificar Duración de Toast

Edita el archivo `app/components/Toast.tsx`:

```tsx
// Cambiar la duración por defecto de 3000ms a 5000ms
useEffect(() => {
  if (duration) {
    const timer = setTimeout(() => {
      onClose();
    }, duration || 5000); // Cambiar aquí

    return () => clearTimeout(timer);
  }
}, [duration, onClose]);
```

### Modificar Posición de Toasts

Edita el archivo `app/components/ToastContainer.tsx`:

```tsx
// Cambiar de top-right a bottom-right
<div className="fixed bottom-4 right-4 z-50 space-y-2">
  {/* ... */}
</div>

// O top-left
<div className="fixed top-4 left-4 z-50 space-y-2">
  {/* ... */}
</div>
```

### Agregar Nuevo Tipo de Toast

1. Actualiza el tipo en `Toast.tsx`:

```tsx
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'custom';
```

2. Agrega el estilo en `getTypeStyles()`:

```tsx
case 'custom':
  return {
    bg: 'bg-purple-100',
    border: 'border-purple-400',
    text: 'text-purple-800',
    icon: /* tu icono */,
  };
```

3. Agrega el método en `useToast.ts`:

```tsx
const custom = useCallback((message: string) => {
  showToast(message, 'custom');
}, [showToast]);

return {
  // ...
  custom,
};
```

## 📱 Responsive Design

El sistema está optimizado para móviles:

- **Desktop**: Toasts en esquina superior derecha
- **Mobile**: Toasts en parte superior con ancho completo (menos padding)
- **ConfirmModal**: Se adapta automáticamente al tamaño de pantalla

## ♿ Accesibilidad

- Iconos descriptivos para cada tipo de notificación
- Botón de cierre claramente visible
- Animaciones respetan `prefers-reduced-motion`
- Contraste de color AA/AAA compliant

## 🔍 Troubleshooting

### Los toasts no aparecen

1. Verifica que `ToastContainer` esté en `layout.tsx`
2. Asegúrate de que el componente sea cliente (`'use client'`)
3. Verifica que estés importando correctamente el hook

### Los toasts aparecen detrás de otros elementos

Aumenta el `z-index` en `ToastContainer.tsx`:

```tsx
<div className="fixed top-4 right-4 z-[9999] space-y-2">
```

### El modal de confirmación no bloquea el fondo

Verifica que el overlay tenga `pointer-events`:

```tsx
<div
  className="fixed inset-0 bg-black bg-opacity-50"
  onClick={onCancel}
  style={{ pointerEvents: 'auto' }}
/>
```

## 📚 Archivos del Sistema

| Archivo | Descripción |
|---------|-------------|
| `app/components/Toast.tsx` | Componente de notificación individual |
| `app/components/ToastContainer.tsx` | Contenedor para gestionar múltiples toasts |
| `app/components/ConfirmModal.tsx` | Modal de confirmación |
| `lib/useToast.ts` | Hook para gestión de toasts |
| `app/globals.css` | Animaciones CSS (slide-in, slide-out) |

## 🚀 Próximas Mejoras

- [ ] Soporte para toasts con acciones (botones personalizados)
- [ ] Toasts "sticky" que no se auto-descartan
- [ ] Animación de progreso visual
- [ ] Agrupación de toasts similares
- [ ] Persistencia de toasts importantes en sessionStorage

## 📝 Notas

- El sistema reemplaza completamente `alert()`, `confirm()` y `prompt()` de JavaScript
- Las animaciones usan CSS puro para mejor rendimiento
- El sistema es totalmente tipado con TypeScript
- Compatible con React Server Components (RSC) siempre que se use en componentes cliente

---

**Documentación actualizada**: Enero 2025  
**Versión del sistema**: 1.0.0
