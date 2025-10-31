'use client'

import React from 'react'

interface Props {
  formData: Record<string, any>
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
}

export default function StepFunctions({ formData, handleInputChange }: Props) {
  // Determinar cuántas funciones mostrar inicialmente basadas SOLO en valores no vacíos (fallback a 1)
  const [count, setCount] = React.useState<number>(() => {
    const nonEmpty = Object.entries(formData || {})
      .filter(([k, v]) => /^funcion\d+$/.test(k) && typeof v === 'string' && v.trim().length > 0)
      .length
    return Math.max(1, nonEmpty)
  })

  // Si el formulario se llena asíncronamente (modo edición), ampliar el conteo para mostrar todas
  React.useEffect(() => {
    const nonEmpty = Object.entries(formData || {})
      .filter(([k, v]) => /^funcion\d+$/.test(k) && typeof v === 'string' && v.trim().length > 0)
      .length
    if (nonEmpty > count) {
      setCount(nonEmpty)
    }
  }, [formData, count])

  // Helper para emitir cambios programáticos compatibles con handleInputChange
  const emitChange = (name: string, value: string) => {
    const e = {
      target: { name, value },
    } as unknown as React.ChangeEvent<HTMLInputElement>
    handleInputChange(e)
  }

  const getVal = (n: number) => {
    const val = (formData as any)[`funcion${n}`]
    return typeof val === 'string' ? val : ''
  }

  const handleRemove = (index: number) => {
    if (count <= 1) return
    // Compactar: mover valores hacia arriba desde index+1 ... count
    for (let i = index; i < count; i++) {
      const nextVal = i + 1 <= count ? getVal(i + 1) : ''
      emitChange(`funcion${i}` as string, nextVal)
    }
    // Limpiar el último y decrementar
    emitChange(`funcion${count}`, '')
    setCount((c) => Math.max(1, c - 1))
  }

  const handleMove = (from: number, to: number) => {
    if (to < 1 || to > count) return
    const a = getVal(from)
    const b = getVal(to)
    emitChange(`funcion${from}`, b)
    emitChange(`funcion${to}`, a)
  }

  return (
    <div className="form-section">
      <div className="form-section-header">FUNCIONES PRINCIPALES DEL PUESTO</div>
      <div className="form-section-content">
        <div className="space-y-3">
          {Array.from({ length: count }, (_, idx) => idx + 1).map((num, i) => (
            <div key={num} className="">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">{num}.-</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-2 py-1 text-xs"
                    onClick={() => handleMove(num, num - 1)}
                    disabled={num === 1}
                    aria-label={`Subir función ${num}`}
                  >
                    Subir
                  </button>
                  <button
                    type="button"
                    className="btn-secondary px-2 py-1 text-xs"
                    onClick={() => handleMove(num, num + 1)}
                    disabled={num === count}
                    aria-label={`Bajar función ${num}`}
                  >
                    Bajar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary px-2 py-1 text-xs text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => handleRemove(num)}
                    disabled={count <= 1}
                    aria-label={`Eliminar función ${num}`}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <textarea
                name={`funcion${num}`}
                value={getVal(num)}
                onChange={handleInputChange}
                rows={2}
                placeholder="Describe la función principal"
                className="form-textarea"
              />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setCount((c) => c + 1)}
          >
            Agregar otra función
          </button>
        </div>
      </div>
    </div>
  )
}
