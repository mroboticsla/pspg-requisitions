'use client'

import React from 'react'

interface Props {
  formData: Record<string, any>
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
}

export default function StepJobInfo({ formData, handleInputChange }: Props) {
  // Motivos posibles (exclusivos)
  const motivoKeys = [
    'nuevaCreacion',
    'reemplazoTemporal',
    'reestructuracionPuesto',
    'reemplazoDefinitivo',
    'renunciaVoluntaria',
    'promocion',
    'incapacidad',
    'cancelacionContrato',
    'licencia',
    'vacaciones',
    'incrementoLabores',
    'licenciaMaternidad',
  ] as const

  // Asegurar selección única del motivo
  const handleMotivoChange = (name: (typeof motivoKeys)[number]) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    if (checked) {
      // Desmarcar todos los demás si se marca uno
      motivoKeys.forEach((key) => {
        if (key !== name && formData[key]) {
          const syntheticEvent = {
            target: { name: key, type: 'checkbox', checked: false },
          } as unknown as React.ChangeEvent<HTMLInputElement>
          handleInputChange(syntheticEvent)
        }
      })
    }
    // Aplicar cambio del actual
    handleInputChange(e)
  }

  // Manejar el selector de reemplazo de empleado y limpiar el nombre si corresponde
  const handleReemplazaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleInputChange(e)
    const value = e.target.value
    if (value !== 'si' && formData.nombreEmpleadoReemplaza) {
      const clearEvent = {
        target: { name: 'nombreEmpleadoReemplaza', value: '' },
      } as unknown as React.ChangeEvent<HTMLInputElement>
      handleInputChange(clearEvent)
    }
  }

  return (
    <div className="form-section">
      <div className="form-section-header">INFORMACIÓN SOBRE EL PUESTO</div>
      <div className="form-section-content">
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">El puesto responde a:</p>
          <div className="checkbox-group">
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="nuevaCreacion"
                name="nuevaCreacion"
                checked={formData.nuevaCreacion}
                onChange={handleMotivoChange('nuevaCreacion')}
              />
              <label htmlFor="nuevaCreacion">Nueva creación</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="reemplazoTemporal"
                name="reemplazoTemporal"
                checked={formData.reemplazoTemporal}
                onChange={handleMotivoChange('reemplazoTemporal')}
              />
              <label htmlFor="reemplazoTemporal">Reemplazo temporal</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="reestructuracionPuesto"
                name="reestructuracionPuesto"
                checked={formData.reestructuracionPuesto}
                onChange={handleMotivoChange('reestructuracionPuesto')}
              />
              <label htmlFor="reestructuracionPuesto">Reestructuración del puesto</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="reemplazoDefinitivo"
                name="reemplazoDefinitivo"
                checked={formData.reemplazoDefinitivo}
                onChange={handleMotivoChange('reemplazoDefinitivo')}
              />
              <label htmlFor="reemplazoDefinitivo">Reemplazo definitivo</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="renunciaVoluntaria"
                name="renunciaVoluntaria"
                checked={formData.renunciaVoluntaria}
                onChange={handleMotivoChange('renunciaVoluntaria')}
              />
              <label htmlFor="renunciaVoluntaria">Renuncia voluntaria</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="promocion"
                name="promocion"
                checked={formData.promocion}
                onChange={handleMotivoChange('promocion')}
              />
              <label htmlFor="promocion">Promoción</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="incapacidad"
                name="incapacidad"
                checked={formData.incapacidad}
                onChange={handleMotivoChange('incapacidad')}
              />
              <label htmlFor="incapacidad">Incapacidad</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="cancelacionContrato"
                name="cancelacionContrato"
                checked={formData.cancelacionContrato}
                onChange={handleMotivoChange('cancelacionContrato')}
              />
              <label htmlFor="cancelacionContrato">Cancelación del contrato</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="licencia"
                name="licencia"
                checked={formData.licencia}
                onChange={handleMotivoChange('licencia')}
              />
              <label htmlFor="licencia">Licencia</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="vacaciones"
                name="vacaciones"
                checked={formData.vacaciones}
                onChange={handleMotivoChange('vacaciones')}
              />
              <label htmlFor="vacaciones">Vacaciones</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="incrementoLabores"
                name="incrementoLabores"
                checked={formData.incrementoLabores}
                onChange={handleMotivoChange('incrementoLabores')}
              />
              <label htmlFor="incrementoLabores">Incremento de labores</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="licenciaMaternidad"
                name="licenciaMaternidad"
                checked={formData.licenciaMaternidad}
                onChange={handleMotivoChange('licenciaMaternidad')}
              />
              <label htmlFor="licenciaMaternidad">Licencia de maternidad</label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del puesto</label>
            <textarea
              name="motivoPuesto"
              value={formData.motivoPuesto}
              onChange={handleInputChange}
              rows={3}
              className="form-textarea"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿El puesto reemplaza a otro empleado?
            </label>
            <select
              name="reemplazaOtroEmpleado"
              value={formData.reemplazaOtroEmpleado ?? (formData.nombreEmpleadoReemplaza ? 'si' : 'no')}
              onChange={handleReemplazaChange}
              className="form-input"
            >
              <option value="no">No</option>
              <option value="si">Sí</option>
            </select>

            {(formData.reemplazaOtroEmpleado === 'si' || !!formData.nombreEmpleadoReemplaza) && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NOMBRE DEL EMPLEADO A QUIEN REEMPLAZA
                </label>
                <input
                  type="text"
                  name="nombreEmpleadoReemplaza"
                  value={formData.nombreEmpleadoReemplaza}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
