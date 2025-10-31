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
  // Asegurar exclusividad de nivel por cada habilidad (básico/intermedio/avanzado)
  const handleExclusiveLevel = (
    skill: 'wordExcelPowerPoint' | 'baseDatos' | 'internet' | 'correoElectronico',
    level: 'basico' | 'intermedio' | 'avanzado',
    checked: boolean
  ) => {
    // Si se marca un nivel, desmarcar los otros del mismo skill
    if (checked) {
      (['basico', 'intermedio', 'avanzado'] as const).forEach((lv) => {
        handleNestedCheckboxChange(skill, lv, lv === level)
      })
    } else {
      // Si se desmarca, simplemente dejarlo en false
      handleNestedCheckboxChange(skill, level, false)
    }
  }

  return (
    <div className="form-section">
      <div className="form-section-header">PERFIL DEL PUESTO</div>
      <div className="form-section-content">
        {/* Formación Académica */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">FORMACIÓN ACADÉMICA REQUERIDA PARA EL PUESTO</p>
          <div className="space-y-2">
            <label className="checkbox-item flex items-center gap-2">
              <input
                type="checkbox"
                id="bachiller"
                name="bachiller"
                checked={!!formData.bachiller}
                onChange={handleInputChange}
              />
              <span>Bachiller</span>
            </label>
            <label className="checkbox-item flex items-center gap-2">
              <input
                type="checkbox"
                id="tecnico"
                name="tecnico"
                checked={!!formData.tecnico}
                onChange={handleInputChange}
              />
              <span>Técnico</span>
            </label>
            <label className="checkbox-item flex items-center gap-2">
              <input
                type="checkbox"
                id="profesional"
                name="profesional"
                checked={!!formData.profesional}
                onChange={handleInputChange}
              />
              <span>Profesional</span>
            </label>
            <label className="checkbox-item flex items-center gap-2">
              <input
                type="checkbox"
                id="especializacion"
                name="especializacion"
                checked={!!formData.especializacion}
                onChange={handleInputChange}
              />
              <span>Especialización</span>
            </label>
            <label className="checkbox-item flex items-center gap-2">
              <input
                type="checkbox"
                id="estudianteUniversitario"
                name="estudianteUniversitario"
                checked={!!formData.estudianteUniversitario}
                onChange={handleInputChange}
              />
              <span>Estudiante universitario</span>
            </label>
          </div>

          {/* Idiomas */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">IDIOMAS</p>
            <label className="checkbox-item flex items-center gap-2">
              <input
                type="checkbox"
                id="idiomaIngles"
                name="idiomaIngles"
                checked={!!formData.idiomaIngles}
                onChange={handleInputChange}
              />
              <span>Inglés</span>
            </label>
          </div>

          {/* Otros estudios */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Otros estudios</label>
            <input
              type="text"
              name="otrosEstudios"
              value={formData.otrosEstudios || ''}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Diplomados, certificaciones, etc."
            />
          </div>
        </div>

        {/* Habilidad Informática */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">HABILIDAD INFORMÁTICA REQUERIDA</p>
          <div className="space-y-3">
            {/* Sistema operativo */}
            <div className="flex items-center flex-wrap gap-4">
              <span className="text-sm text-gray-700 w-full sm:w-auto">Sistema Operativo:</span>
              <label className="checkbox-item flex items-center gap-2">
                <input
                  type="checkbox"
                  id="windows"
                  checked={!!formData.sistemaOperativo?.windows}
                  onChange={(e) => handleNestedCheckboxChange('sistemaOperativo', 'windows', e.target.checked)}
                />
                <span>Windows</span>
              </label>
              <label className="checkbox-item flex items-center gap-2">
                <input
                  type="checkbox"
                  id="otrosSO"
                  checked={!!formData.sistemaOperativo?.otros}
                  onChange={(e) => handleNestedCheckboxChange('sistemaOperativo', 'otros', e.target.checked)}
                />
                <span>Otros</span>
              </label>
            </div>

            {/* Niveles por habilidad, una línea por habilidad */}
            {([
              { key: 'wordExcelPowerPoint', label: 'Word-Excel-PowerPoint' },
              { key: 'baseDatos', label: 'Base de datos' },
              { key: 'internet', label: 'Internet (Navegadores)' },
              { key: 'correoElectronico', label: 'Correo electrónico' },
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-center flex-wrap gap-4">
                <span className="text-sm text-gray-700 w-full sm:w-64">{label}</span>
                {(['basico', 'intermedio', 'avanzado'] as const).map((level) => (
                  <label key={level} className="checkbox-item flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`${key}_${level}`}
                      checked={!!(formData as any)?.[key]?.[level]}
                      onChange={(e) => handleExclusiveLevel(key as any, level, e.target.checked)}
                    />
                    <span className="capitalize">{level}</span>
                  </label>
                ))}
              </div>
            ))}

            {/* Otro (Especifique) */}
            <div className="flex items-center flex-wrap gap-3">
              <label className="text-sm text-gray-700 w-full sm:w-64">Otro (Especifique)</label>
              <input
                type="text"
                name="otroEspecifique"
                value={formData.otroEspecifique || ''}
                onChange={handleInputChange}
                className="form-input flex-1 min-w-[240px]"
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
