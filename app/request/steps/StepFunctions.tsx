'use client'

import React from 'react'

interface Props {
  formData: Record<string, any>
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
}

export default function StepFunctions({ formData, handleInputChange }: Props) {
  return (
    <div className="form-section">
      <div className="form-section-header">FUNCIONES PRINCIPALES DEL PUESTO</div>
      <div className="form-section-content space-y-3">
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{num}.-</label>
            <textarea
              name={`funcion${num}`}
              value={(formData as any)[`funcion${num}`] as string}
              onChange={handleInputChange}
              rows={2}
              className="form-textarea"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
