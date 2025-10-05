// Copiado desde app/page.tsx
'use client'

import { useState } from 'react'

export default function RequisitionForm() {
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    puestoRequerido: '',
    departamento: '',
    numeroVacantes: '',
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
    funcion1: '',
    funcion2: '',
    funcion3: '',
    funcion4: '',
    funcion5: '',
    bachiller: false,
    tecnico: false,
    profesional: false,
    especializacion: false,
    estudianteUniversitario: false,
    idiomaIngles: false,
    otrosEstudios: '',
    sistemaOperativo: { windows: false, otros: false },
    wordExcelPowerPoint: { basico: false, intermedio: false, avanzado: false },
    baseDatos: { basico: false, intermedio: false, avanzado: false },
    internet: { basico: false, intermedio: false, avanzado: false },
    correoElectronico: { basico: false, intermedio: false, avanzado: false },
    otroEspecifique: '',
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
    alert('Formulario enviado correctamente (modo demo)')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* ...existing form content... */}
      <div className="bg-surface-primary p-6 rounded-lg shadow-md border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-800">Formulario de Requisición</h2>
          <div className="w-12 h-12 bg-brand-dark rounded-md flex items-center justify-center text-white font-bold">PSP</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre de la Empresa</label>
            <input name="nombreEmpresa" value={formData.nombreEmpresa} onChange={handleInputChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent" />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Departamento</label>
              <input name="departamento" value={formData.departamento} onChange={handleInputChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Vacantes</label>
              <input name="numeroVacantes" value={formData.numeroVacantes} onChange={handleInputChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-brand-dark hover:bg-brand-accent text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent">Enviar Requisición</button>
          </div>
        </form>
      </div>
    </div>
  )
}
