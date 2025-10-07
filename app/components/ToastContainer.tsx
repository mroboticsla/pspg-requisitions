'use client';

import { useToast } from '@/lib/useToast';
import Toast from './Toast';

/**
 * Contenedor para renderizar todas las notificaciones toast activas
 * Este componente debe estar en el nivel raíz de la aplicación (layout.tsx)
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
