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
      <p>Requisition form (moved to app/(app)/page.tsx)</p>
    </div>
  )
}
