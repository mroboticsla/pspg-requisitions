'use client'

import { useState } from 'react'

export default function RequisitionForm() {
  const [formData, setFormData] = useState({
    // Datos Generales
    nombreEmpresa: '',
    puestoRequerido: '',
    departamento: '',
    numeroVacantes: '',
    
    // Información sobre el puesto
    nuevaCreacion: false,
    reemplazoTemporal: false,
    reestructuracionPuesto: false,
    reemplazoDefinitivo: false,
    renunciaVoluntaria: false,
    promocion: false,
    incapacidad: false,
    cancelacionContrato: false,
    licencia: false,
    vacaciones: false,
    incrementoLabores: false,
    licenciaMaternidad: false,
    
    motivoPuesto: '',
    nombreEmpleadoReemplaza: '',
    
    // Funciones principales del puesto
    funcion1: '',
    funcion2: '',
    funcion3: '',
    funcion4: '',
    funcion5: '',
    
    // Perfil del puesto - Formación académica
    bachiller: false,
    tecnico: false,
    profesional: false,
    especializacion: false,
    estudianteUniversitario: false,
    idiomaIngles: false,
    otrosEstudios: '',
    
    // Habilidad informática requerida
    sistemaOperativo: { windows: false, otros: false },
    wordExcelPowerPoint: { basico: false, intermedio: false, avanzado: false },
    baseDatos: { basico: false, intermedio: false, avanzado: false },
    internet: { basico: false, intermedio: false, avanzado: false },
    correoElectronico: { basico: false, intermedio: false, avanzado: false },
    otroEspecifique: '',
    
    // Habilidad y conocimientos técnicos
    informacion: false,
    maquinariaEquipos: false,
    decisiones: false,
    supervisionPersonal: false,
    responsabilidades: { confidencial: false, restringida: false },
    supervision: { directa: false, indirecta: false }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleNestedCheckboxChange = (section: string, field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev] as any,
        [field]: checked
      }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form data:', formData)
    // Aquí se conectará con el backend en el futuro
    alert('Formulario enviado correctamente (modo demo)')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with instructions */}
        <div className="bg-teal-800 text-white p-4">
          <h2 className="text-lg font-bold text-center">INSTRUCCIONES</h2>
          <p className="text-sm text-center mt-1">
            Recuerde realizar su requisición de personal con <strong>mínimo 15 días hábiles de ANTICIPACIÓN</strong> a la fecha de inicio de labores solicitadas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Datos Generales */}
          <div className="form-section">
            <div className="form-section-header">
              DATOS GENERALES
            </div>
            <div className="form-section-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NOMBRE DE LA EMPRESA
                  </label>
                  <input
                    type="text"
                    name="nombreEmpresa"
                    value={formData.nombreEmpresa}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DEPARTAMENTO
                  </label>
                  <input
                    type="text"
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PUESTO REQUERIDO
                  </label>
                  <input
                    type="text"
                    name="puestoRequerido"
                    value={formData.puestoRequerido}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NÚMERO DE VACANTES
                  </label>
                  <input
                    type="number"
                    name="numeroVacantes"
                    value={formData.numeroVacantes}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información sobre el puesto */}
          <div className="form-section">
            <div className="form-section-header">
              INFORMACIÓN SOBRE EL PUESTO
            </div>
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
                    <label htmlFor="promocion">Promoción o</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo del puesto
                  </label>
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

          {/* Funciones principales del puesto */}
          <div className="form-section">
            <div className="form-section-header">
              FUNCIONES PRINCIPALES DEL PUESTO
            </div>
            <div className="form-section-content space-y-3">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {num}.-
                  </label>
                  <textarea
                    name={`funcion${num}`}
                    value={formData[`funcion${num}` as keyof typeof formData] as string}
                    onChange={handleInputChange}
                    rows={2}
                    className="form-textarea"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Perfil del puesto */}
          <div className="form-section">
            <div className="form-section-header">
              PERFIL DEL PUESTO
            </div>
            <div className="form-section-content">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">FORMACIÓN ACADÉMICA REQUERIDA PARA EL PUESTO</p>
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
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="estudianteUniversitario"
                      name="estudianteUniversitario"
                      checked={formData.estudianteUniversitario}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="estudianteUniversitario">Estudiante Universitario</label>
                  </div>
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="idiomaIngles"
                      name="idiomaIngles"
                      checked={formData.idiomaIngles}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="idiomaIngles">Idioma Inglés</label>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Otros estudios (Especifique)
                  </label>
                  <input
                    type="text"
                    name="otrosEstudios"
                    value={formData.otrosEstudios}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Habilidad informática requerida */}
          <div className="form-section">
            <div className="form-section-header">
              HABILIDAD INFORMÁTICA REQUERIDA
            </div>
            <div className="form-section-content">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Sistema operativo (Windows)</p>
                  <div className="flex space-x-4">
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
                </div>

                {['wordExcelPowerPoint', 'baseDatos', 'internet', 'correoElectronico'].map((skill) => (
                  <div key={skill}>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {skill === 'wordExcelPowerPoint' && 'Word-Excel-Power Point'}
                      {skill === 'baseDatos' && 'Base de datos'}
                      {skill === 'internet' && 'Internet (Navegadores)'}
                      {skill === 'correoElectronico' && 'Correo electrónico'}
                    </p>
                    <div className="flex space-x-4">
                      {['basico', 'intermedio', 'avanzado'].map((level) => (
                        <div key={level} className="checkbox-item">
                          <input
                            type="checkbox"
                            id={`${skill}_${level}`}
                            checked={(formData[skill as keyof typeof formData] as any)[level]}
                            onChange={(e) => handleNestedCheckboxChange(skill, level, e.target.checked)}
                          />
                          <label htmlFor={`${skill}_${level}`} className="capitalize">{level}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Otro (Especifique)
                  </label>
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
          </div>

          {/* Habilidad y conocimientos técnicos */}
          <div className="form-section">
            <div className="form-section-header">
              HABILIDAD Y CONOCIMIENTOS TÉCNICOS EN EL ÁREA DE:
            </div>
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
                          onChange={(e) => handleNestedCheckboxChange('responsabilidades', 'confidencial', e.target.checked)}
                        />
                        <label htmlFor="confidencial">Confidencial</label>
                      </div>
                      <div className="checkbox-item">
                        <input
                          type="checkbox"
                          id="restringida"
                          checked={formData.responsabilidades.restringida}
                          onChange={(e) => handleNestedCheckboxChange('responsabilidades', 'restringida', e.target.checked)}
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

          {/* Submit button */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              Guardar como Borrador
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              Enviar Requisición
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
