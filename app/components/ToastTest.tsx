'use client';

import { useToast } from '@/lib/useToast';

/**
 * Componente de prueba para verificar que los toasts funcionan
 * Puedes agregarlo temporalmente a cualquier página para probar
 */
export default function ToastTest() {
  const { success, error, warning, info } = useToast();

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-sm font-semibold mb-2">🧪 Test de Toasts</h3>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => success('¡Toast de éxito!')}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Success
        </button>
        <button
          onClick={() => error('Toast de error')}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Error
        </button>
        <button
          onClick={() => warning('Toast de advertencia')}
          className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
        >
          Warning
        </button>
        <button
          onClick={() => info('Toast de información')}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Info
        </button>
      </div>
    </div>
  );
}
