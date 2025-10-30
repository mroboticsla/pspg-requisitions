'use client'

import React from 'react'

interface Props {
  formData: Record<string, any>
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
}

export default function StepJobInfo({ formData, handleInputChange }: Props) {
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
                onChange={handleInputChange}
              />
              <label htmlFor="nuevaCreacion">Nueva creación</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="reemplazoTemporal"
                name="reemplazoTemporal"
                checked={formData.reemplazoTemporal}
                onChange={handleInputChange}
              />
              <label htmlFor="reemplazoTemporal">Reemplazo temporal</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="reestructuracionPuesto"
                name="reestructuracionPuesto"
                checked={formData.reestructuracionPuesto}
                onChange={handleInputChange}
              />
              <label htmlFor="reestructuracionPuesto">Reestructuración del puesto</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="reemplazoDefinitivo"
                name="reemplazoDefinitivo"
                checked={formData.reemplazoDefinitivo}
                onChange={handleInputChange}
              />
              <label htmlFor="reemplazoDefinitivo">Reemplazo definitivo</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="renunciaVoluntaria"
                name="renunciaVoluntaria"
                checked={formData.renunciaVoluntaria}
                onChange={handleInputChange}
              />
              <label htmlFor="renunciaVoluntaria">Renuncia voluntaria</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="promocion"
                name="promocion"
                checked={formData.promocion}
                onChange={handleInputChange}
              />
              <label htmlFor="promocion">Promoción</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="incapacidad"
                name="incapacidad"
                checked={formData.incapacidad}
                onChange={handleInputChange}
              />
              <label htmlFor="incapacidad">Incapacidad</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="cancelacionContrato"
                name="cancelacionContrato"
                checked={formData.cancelacionContrato}
                onChange={handleInputChange}
              />
              <label htmlFor="cancelacionContrato">Cancelación del contrato</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="licencia"
                name="licencia"
                checked={formData.licencia}
                onChange={handleInputChange}
              />
              <label htmlFor="licencia">Licencia</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="vacaciones"
                name="vacaciones"
                checked={formData.vacaciones}
                onChange={handleInputChange}
              />
              <label htmlFor="vacaciones">Vacaciones</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="incrementoLabores"
                name="incrementoLabores"
                checked={formData.incrementoLabores}
                onChange={handleInputChange}
              />
              <label htmlFor="incrementoLabores">Incremento de labores</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="licenciaMaternidad"
                name="licenciaMaternidad"
                checked={formData.licenciaMaternidad}
                onChange={handleInputChange}
              />
              <label htmlFor="licenciaMaternidad">Licencia de maternidad</label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del puesto</label>
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
        </div>
      </div>
    </div>
  )
}
