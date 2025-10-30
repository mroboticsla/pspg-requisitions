'use client'

import React from 'react'

interface Props {
  formData: Record<string, any>
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  handleNestedCheckboxChange: (section: string, field: string, checked: boolean) => void
}

export default function StepProfile({
  formData,
  handleInputChange,
  handleNestedCheckboxChange,
}: Props) {
  return (
    <div className="form-section">
      <div className="form-section-header">PERFIL DEL PUESTO</div>
      <div className="form-section-content">
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            FORMACIÓN ACADÉMICA REQUERIDA PARA EL PUESTO
          </p>
          <div className="checkbox-group">
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="bachiller"
                name="bachiller"
                checked={formData.bachiller}
                onChange={handleInputChange}
              />
              <label htmlFor="bachiller">Bachiller</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="tecnico"
                name="tecnico"
                checked={formData.tecnico}
                onChange={handleInputChange}
              />
              <label htmlFor="tecnico">Técnico</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="profesional"
                name="profesional"
                checked={formData.profesional}
                onChange={handleInputChange}
              />
              <label htmlFor="profesional">Profesional</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="especializacion"
                name="especializacion"
                checked={formData.especializacion}
                onChange={handleInputChange}
              />
              <label htmlFor="especializacion">Especialización</label>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">HABILIDAD INFORMÁTICA REQUERIDA</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="windows"
                  checked={formData.sistemaOperativo.windows}
                  onChange={(e) => handleNestedCheckboxChange('sistemaOperativo', 'windows', e.target.checked)}
                />
                <label htmlFor="windows">Windows</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="otrosSO"
                  checked={formData.sistemaOperativo.otros}
                  onChange={(e) => handleNestedCheckboxChange('sistemaOperativo', 'otros', e.target.checked)}
                />
                <label htmlFor="otrosSO">Otros</label>
              </div>
            </div>

            {(['wordExcelPowerPoint', 'baseDatos', 'internet', 'correoElectronico'] as const).map(
              (skill) => (
                <div key={skill}>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {skill === 'wordExcelPowerPoint' && 'Word-Excel-Power Point'}
                    {skill === 'baseDatos' && 'Base de datos'}
                    {skill === 'internet' && 'Internet (Navegadores)'}
                    {skill === 'correoElectronico' && 'Correo electrónico'}
                  </p>
                  <div className="flex space-x-4">
                    {(['basico', 'intermedio', 'avanzado'] as const).map((level) => (
                      <div key={level} className="checkbox-item">
                        <input
                          type="checkbox"
                          id={`${skill}_${level}`}
                          checked={((formData as any)[skill] as any)[level]}
                          onChange={(e) => handleNestedCheckboxChange(skill, level, e.target.checked)}
                        />
                        <label htmlFor={`${skill}_${level}`} className="capitalize">
                          {level}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Otro (Especifique)</label>
              <input
                type="text"
                name="otroEspecifique"
                value={formData.otroEspecifique}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-header">HABILIDAD Y CONOCIMIENTOS TÉCNICOS EN EL ÁREA DE:</div>
          <div className="form-section-content">
            <div className="space-y-4">
              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="informacion"
                    name="informacion"
                    checked={formData.informacion}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="informacion">Información</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="maquinariaEquipos"
                    name="maquinariaEquipos"
                    checked={formData.maquinariaEquipos}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="maquinariaEquipos">Maquinaria y equipos</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="decisiones"
                    name="decisiones"
                    checked={formData.decisiones}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="decisiones">Decisiones</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="supervisionPersonal"
                    name="supervisionPersonal"
                    checked={formData.supervisionPersonal}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="supervisionPersonal">Supervisión Personal a cargo</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">RESPONSABILIDADES</p>
                  <div className="space-y-2">
                    <div className="checkbox-item">
                      <input
                        type="checkbox"
                        id="confidencial"
                        checked={formData.responsabilidades.confidencial}
                        onChange={(e) =>
                          handleNestedCheckboxChange('responsabilidades', 'confidencial', e.target.checked)
                        }
                      />
                      <label htmlFor="confidencial">Confidencial</label>
                    </div>
                    <div className="checkbox-item">
                      <input
                        type="checkbox"
                        id="restringida"
                        checked={formData.responsabilidades.restringida}
                        onChange={(e) =>
                          handleNestedCheckboxChange('responsabilidades', 'restringida', e.target.checked)
                        }
                      />
                      <label htmlFor="restringida">Restringida</label>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">SUPERVISIÓN</p>
                  <div className="space-y-2">
                    <div className="checkbox-item">
                      <input
                        type="checkbox"
                        id="directa"
                        checked={formData.supervision.directa}
                        onChange={(e) => handleNestedCheckboxChange('supervision', 'directa', e.target.checked)}
                      />
                      <label htmlFor="directa">Directa</label>
                    </div>
                    <div className="checkbox-item">
                      <input
                        type="checkbox"
                        id="indirecta"
                        checked={formData.supervision.indirecta}
                        onChange={(e) => handleNestedCheckboxChange('supervision', 'indirecta', e.target.checked)}
                      />
                      <label htmlFor="indirecta">Indirecta</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
