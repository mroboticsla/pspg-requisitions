'use client'

import React from 'react'
import { JobProfileData } from '@/lib/types/candidates'

interface Props {
  data: JobProfileData | any // Allow any for compatibility with existing formData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onNestedChange: (section: string, field: string, checked: boolean) => void
  readOnly?: boolean
}

export default function JobProfileForm({
  data,
  onChange,
  onNestedChange,
  readOnly = false
}: Props) {
  // Asegurar exclusividad de nivel por cada habilidad (básico/intermedio/avanzado)
  const handleExclusiveLevel = (
    skill: 'wordExcelPowerPoint' | 'baseDatos' | 'internet' | 'correoElectronico',
    level: 'basico' | 'intermedio' | 'avanzado',
    checked: boolean
  ) => {
    if (readOnly) return

    // Si se marca un nivel, desmarcar los otros del mismo skill
    if (checked) {
      (['basico', 'intermedio', 'avanzado'] as const).forEach((lv) => {
        onNestedChange(skill, lv, lv === level)
      })
    } else {
      // Si se desmarca, simplemente dejarlo en false
      onNestedChange(skill, level, false)
    }
  }

  return (
    <div className="form-section">
      <div className="form-section-header">PERFIL EDUCATIVO</div>
      <div className="form-section-content">
        {/* Formación Académica */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Seleccione los niveles de formación académica que ha completado.</p>
          <div className="space-y-2">
            <label className="checkbox-item flex items-center gap-2">
              <input
                type="checkbox"
                id="bachiller"
                name="bachiller"
                checked={!!data.bachiller}
                onChange={onChange}
                disabled={readOnly}
              />
              <span>Bachiller</span>
            </label>
            <label className="checkbox-item flex items-center gap-2">
              <input
                type="checkbox"
                id="tecnico"
                name="tecnico"
                checked={!!data.tecnico}
                onChange={onChange}
                disabled={readOnly}
              />
              <span>Técnico</span>
            </label>
            <label className="checkbox-item flex items-center gap-2">
              <input
                type="checkbox"
                id="profesional"
                name="profesional"
                checked={!!data.profesional}
                onChange={onChange}
                disabled={readOnly}
              />
              <span>Profesional</span>
            </label>
            <label className="checkbox-item flex items-center gap-2">
              <input
                type="checkbox"
                id="especializacion"
                name="especializacion"
                checked={!!data.especializacion}
                onChange={onChange}
                disabled={readOnly}
              />
              <span>Especialización</span>
            </label>
            <label className="checkbox-item flex items-center gap-2">
              <input
                type="checkbox"
                id="estudianteUniversitario"
                name="estudianteUniversitario"
                checked={!!data.estudianteUniversitario}
                onChange={onChange}
                disabled={readOnly}
              />
              <span>Estudiante universitario</span>
            </label>
          </div>

          {/* Idiomas */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">IDIOMAS</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="checkbox-item flex items-center gap-2">
                <input
                  type="checkbox"
                  id="idiomaEspanol"
                  name="idiomaEspanol"
                  checked={!!data.idiomaEspanol}
                  onChange={onChange}
                  disabled={readOnly}
                />
                <span>Español</span>
              </label>
              <label className="checkbox-item flex items-center gap-2">
                <input
                  type="checkbox"
                  id="idiomaIngles"
                  name="idiomaIngles"
                  checked={!!data.idiomaIngles}
                  onChange={onChange}
                  disabled={readOnly}
                />
                <span>Inglés</span>
              </label>
              <label className="checkbox-item flex items-center gap-2">
                <input
                  type="checkbox"
                  id="idiomaFrances"
                  name="idiomaFrances"
                  checked={!!data.idiomaFrances}
                  onChange={onChange}
                  disabled={readOnly}
                />
                <span>Francés</span>
              </label>
              <label className="checkbox-item flex items-center gap-2">
                <input
                  type="checkbox"
                  id="idiomaAleman"
                  name="idiomaAleman"
                  checked={!!data.idiomaAleman}
                  onChange={onChange}
                  disabled={readOnly}
                />
                <span>Alemán</span>
              </label>
              <label className="checkbox-item flex items-center gap-2">
                <input
                  type="checkbox"
                  id="idiomaPortugues"
                  name="idiomaPortugues"
                  checked={!!data.idiomaPortugues}
                  onChange={onChange}
                  disabled={readOnly}
                />
                <span>Portugués</span>
              </label>
              <label className="checkbox-item flex items-center gap-2">
                <input
                  type="checkbox"
                  id="idiomaItaliano"
                  name="idiomaItaliano"
                  checked={!!data.idiomaItaliano}
                  onChange={onChange}
                  disabled={readOnly}
                />
                <span>Italiano</span>
              </label>
              <label className="checkbox-item flex items-center gap-2">
                <input
                  type="checkbox"
                  id="idiomaMandarin"
                  name="idiomaMandarin"
                  checked={!!data.idiomaMandarin}
                  onChange={onChange}
                  disabled={readOnly}
                />
                <span>Mandarín</span>
              </label>
            </div>
          </div>

          {/* Otros estudios */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Otros estudios</label>
            <input
              type="text"
              name="otrosEstudios"
              value={data.otrosEstudios || ''}
              onChange={onChange}
              className="form-input"
              placeholder="Diplomados, certificaciones, etc."
              disabled={readOnly}
            />
          </div>
        </div>

        {/* Habilidad Informática */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">HABILIDAD INFORMÁTICA</p>
          <div className="space-y-3">
            {/* Sistema operativo */}
            <div className="flex items-center flex-wrap gap-4">
              <span className="text-sm text-gray-700 w-full sm:w-auto">Sistema Operativo:</span>
              <label className="checkbox-item flex items-center gap-2">
                <input
                  type="checkbox"
                  id="windows"
                  checked={!!data.sistemaOperativo?.windows}
                  onChange={(e) => onNestedChange('sistemaOperativo', 'windows', e.target.checked)}
                  disabled={readOnly}
                />
                <span>Windows</span>
              </label>
              <label className="checkbox-item flex items-center gap-2">
                <input
                  type="checkbox"
                  id="linux"
                  checked={!!data.sistemaOperativo?.linux}
                  onChange={(e) => onNestedChange('sistemaOperativo', 'linux', e.target.checked)}
                  disabled={readOnly}
                />
                <span>Linux</span>
              </label>
              <label className="checkbox-item flex items-center gap-2">
                <input
                  type="checkbox"
                  id="macos"
                  checked={!!data.sistemaOperativo?.macos}
                  onChange={(e) => onNestedChange('sistemaOperativo', 'macos', e.target.checked)}
                  disabled={readOnly}
                />
                <span>MacOS</span>
              </label>
              <label className="checkbox-item flex items-center gap-2">
                <input
                  type="checkbox"
                  id="otrosSO"
                  checked={!!data.sistemaOperativo?.otros}
                  onChange={(e) => onNestedChange('sistemaOperativo', 'otros', e.target.checked)}
                  disabled={readOnly}
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
                      checked={!!(data as any)?.[key]?.[level]}
                      onChange={(e) => handleExclusiveLevel(key as any, level, e.target.checked)}
                      disabled={readOnly}
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
                value={data.otroEspecifique || ''}
                onChange={onChange}
                className="form-input flex-1 min-w-[240px]"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-header">EXPERIENCIA</div>
          <div className="form-section-content">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="checkbox-item flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="informacion"
                    name="informacion"
                    checked={!!data.informacion}
                    onChange={onChange}
                    disabled={readOnly}
                  />
                  <span>Informática</span>
                </label>
                <label className="checkbox-item flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="maquinariaEquipos"
                    name="maquinariaEquipos"
                    checked={!!data.maquinariaEquipos}
                    onChange={onChange}
                    disabled={readOnly}
                  />
                  <span>Maquinaria y Equipos Industriales</span>
                </label>
                <label className="checkbox-item flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="decisiones"
                    name="decisiones"
                    checked={!!data.decisiones}
                    onChange={onChange}
                    disabled={readOnly}
                  />
                  <span>Toma de Decisiones</span>
                </label>
                <label className="checkbox-item flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="supervisionPersonal"
                    name="supervisionPersonal"
                    checked={!!data.supervisionPersonal}
                    onChange={onChange}
                    disabled={readOnly}
                  />
                  <span>Supervisión de Personal a cargo</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
