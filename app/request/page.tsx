"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { useSafeRouter } from '../../lib/useSafeRouter'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { UserCompany } from '@/lib/types/company'
import { createRequisition, updateRequisition, getRequisitionById } from '@/lib/requisitions'
import { getCompanyActiveTemplate } from '@/lib/templates'
import { DynamicSection } from '../components/DynamicField'
import type { FormTemplateComplete, RequisitionComplete } from '@/lib/types/requisitions'
import { useToast } from '@/lib/useToast'

export default function RequisitionForm() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const searchParams = useSearchParams()
  const editRequisitionId = searchParams.get('edit')
  const { success, error, warning, info } = useToast()
  
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [template, setTemplate] = useState<FormTemplateComplete | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customResponses, setCustomResponses] = useState<Record<string, Record<string, any>>>({})
  const [loadingRequisition, setLoadingRequisition] = useState(false)

  // Obtener rol del usuario desde el profile
  const userRole = (profile as any)?.roles?.name || null

  // Redirigir al login si no hay usuario autenticado
  useEffect(() => {
    if (!loading && (!user || !profile)) {
      console.debug('RequisitionForm: No hay usuario autenticado, redirigiendo al login')
      router.replace('/auth')
    }
  }, [loading, user, profile, router])

  // Cargar empresas según el rol del usuario
  useEffect(() => {
    const fetchUserCompanies = async () => {
      if (!user || !userRole) return
      
      try {
        setLoadingCompanies(true)
        
        // Si es admin o superadmin, cargar todas las empresas activas
        if (userRole === 'admin' || userRole === 'superadmin') {
          const { data, error } = await supabase
            .from('companies')
            .select('id, name')
            .eq('is_active', true)
            .order('name', { ascending: true })
          
          if (error) {
            console.error('Error al cargar empresas:', error)
            return
          }
          
          // Transformar al formato UserCompany
          const companies: UserCompany[] = (data || []).map(company => ({
            company_id: company.id,
            company_name: company.name,
            role_in_company: 'admin',
            is_active: true
          }))
          
          setUserCompanies(companies)
        } else {
          // Para otros roles, usar la función RPC que filtra por asignación
          const { data, error } = await supabase.rpc('get_user_companies')
          
          if (error) {
            console.error('Error al cargar empresas:', error)
            return
          }
          
          setUserCompanies(data || [])
        }
      } catch (err) {
        console.error('Error al cargar empresas:', err)
      } finally {
        setLoadingCompanies(false)
      }
    }

    fetchUserCompanies()
  }, [user, userRole])

  const [formData, setFormData] = useState({
    // Datos Generales
    companyId: '', // Cambiado de nombreEmpresa a companyId
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
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
        ...((prev as any)[section] as any),
        [field]: checked
      }
    }))
  }

  // Cargar plantilla cuando se selecciona una empresa
  useEffect(() => {
    const loadTemplate = async () => {
      if (!formData.companyId) {
        setTemplate(null)
        return
      }

      try {
        setLoadingTemplate(true)
        const activeTemplate = await getCompanyActiveTemplate(formData.companyId)
        setTemplate(activeTemplate)
      } catch (error) {
        console.error('Error loading template:', error)
      } finally {
        setLoadingTemplate(false)
      }
    }

    loadTemplate()
  }, [formData.companyId])

  // Cargar requisición existente si está en modo edición
  useEffect(() => {
    const loadExistingRequisition = async () => {
      if (!editRequisitionId) return
      if (loadingRequisition) return // Evitar múltiples cargas simultáneas

      try {
        setLoadingRequisition(true)
        console.log('Cargando requisición para editar:', editRequisitionId)
        
        const requisition = await getRequisitionById(editRequisitionId) as RequisitionComplete
        console.log('Requisición cargada:', requisition)

        if (!requisition) {
          console.error('Requisición no encontrada')
          error('No se encontró la requisición')
          router.push('/requisitions')
          return
        }

        // Verificar que sea editable (solo drafts)
        if (requisition.status !== 'draft') {
          console.warn('Requisición no editable, estado:', requisition.status)
          warning('Solo se pueden editar requisiciones en estado borrador')
          router.push(`/requisitions/${editRequisitionId}`)
          return
        }

        // Cargar template snapshot
        if (requisition.template_snapshot) {
          console.log('Cargando template snapshot')
          setTemplate(requisition.template_snapshot)
        }

        // Mapear los datos de la requisición al formulario
        console.log('Mapeando datos al formulario...')
        setFormData({
          companyId: requisition.company_id,
          puestoRequerido: requisition.puesto_requerido || '',
          departamento: requisition.departamento || '',
          numeroVacantes: String(requisition.numero_vacantes || 1),
          
          nuevaCreacion: (requisition.tipo_puesto as any)?.nuevaCreacion || false,
          reemplazoTemporal: (requisition.tipo_puesto as any)?.reemplazoTemporal || false,
          reestructuracionPuesto: (requisition.tipo_puesto as any)?.reestructuracionPuesto || false,
          reemplazoDefinitivo: (requisition.tipo_puesto as any)?.reemplazoDefinitivo || false,
          renunciaVoluntaria: (requisition.tipo_puesto as any)?.renunciaVoluntaria || false,
          promocion: (requisition.tipo_puesto as any)?.promocion || false,
          incapacidad: (requisition.tipo_puesto as any)?.incapacidad || false,
          cancelacionContrato: (requisition.tipo_puesto as any)?.cancelacionContrato || false,
          licencia: (requisition.tipo_puesto as any)?.licencia || false,
          vacaciones: (requisition.tipo_puesto as any)?.vacaciones || false,
          incrementoLabores: (requisition.tipo_puesto as any)?.incrementoLabores || false,
          licenciaMaternidad: (requisition.tipo_puesto as any)?.licenciaMaternidad || false,
          
          motivoPuesto: requisition.motivo_puesto || '',
          nombreEmpleadoReemplaza: requisition.nombre_empleado_reemplaza || '',
          
          funcion1: requisition.funciones_principales?.[0] || '',
          funcion2: requisition.funciones_principales?.[1] || '',
          funcion3: requisition.funciones_principales?.[2] || '',
          funcion4: requisition.funciones_principales?.[3] || '',
          funcion5: requisition.funciones_principales?.[4] || '',
          
          bachiller: (requisition.formacion_academica as any)?.bachiller || false,
          tecnico: (requisition.formacion_academica as any)?.tecnico || false,
          profesional: (requisition.formacion_academica as any)?.profesional || false,
          especializacion: (requisition.formacion_academica as any)?.especializacion || false,
          estudianteUniversitario: (requisition.formacion_academica as any)?.estudianteUniversitario || false,
          idiomaIngles: requisition.idioma_ingles || false,
          otrosEstudios: requisition.otros_estudios || '',
          
          sistemaOperativo: { 
            windows: false, 
            otros: false 
          },
          wordExcelPowerPoint: { 
            basico: requisition.habilidad_informatica?.word === 'basico',
            intermedio: requisition.habilidad_informatica?.word === 'intermedio',
            avanzado: requisition.habilidad_informatica?.word === 'avanzado'
          },
          baseDatos: { 
            basico: false, 
            intermedio: false, 
            avanzado: false 
          },
          internet: { 
            basico: requisition.habilidad_informatica?.internet === 'basico',
            intermedio: requisition.habilidad_informatica?.internet === 'intermedio',
            avanzado: requisition.habilidad_informatica?.internet === 'avanzado'
          },
          correoElectronico: { 
            basico: requisition.habilidad_informatica?.outlook === 'basico',
            intermedio: requisition.habilidad_informatica?.outlook === 'intermedio',
            avanzado: requisition.habilidad_informatica?.outlook === 'avanzado'
          },
          otroEspecifique: requisition.habilidad_informatica?.software_especifico?.[0]?.nombre || '',
          
          informacion: (requisition.habilidades_tecnicas as any)?.informacion || false,
          maquinariaEquipos: (requisition.habilidades_tecnicas as any)?.maquinariaEquipos || false,
          decisiones: (requisition.habilidades_tecnicas as any)?.decisiones || false,
          supervisionPersonal: (requisition.habilidades_tecnicas as any)?.supervisionPersonal || false,
          responsabilidades: (requisition.habilidades_tecnicas as any)?.responsabilidades || { confidencial: false, restringida: false },
          supervision: (requisition.habilidades_tecnicas as any)?.supervision || { directa: false, indirecta: false }
        })

        // Cargar custom responses
        if (requisition.custom_responses && requisition.custom_responses.length > 0) {
          console.log('Cargando respuestas personalizadas:', requisition.custom_responses.length)
          const responses: Record<string, Record<string, any>> = {}
          requisition.custom_responses.forEach((response) => {
            responses[response.section_id] = response.responses
          })
          setCustomResponses(responses)
        }

        console.log('Requisición cargada exitosamente')
      } catch (err: any) {
        console.error('Error loading requisition:', err)
        console.error('Error type:', typeof err)
        console.error('Error keys:', err ? Object.keys(err) : 'null')
        console.error('Error message:', err?.message)
        console.error('Error toString:', err?.toString())
        console.error('Error JSON:', JSON.stringify(err, null, 2))
        
        // Mostrar notificación de error
        if (err?.message) {
          error(`Error al cargar la requisición: ${err.message}`)
        } else {
          error('Error inesperado al cargar la requisición')
        }
        // No redirigir, permitir que el usuario vea qué pasó
        // router.push('/requisitions')
      } finally {
        setLoadingRequisition(false)
      }
    }

    loadExistingRequisition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editRequisitionId]) // Solo depende de editRequisitionId, no de router

  const handleCustomResponse = (sectionId: string, fieldName: string, value: any) => {
    setCustomResponses(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [fieldName]: value
      }
    }))
  }

  const handleSaveDraft = async () => {
    try {
      setSaving(true)
      
      const requisitionData = {
        company_id: formData.companyId,
        departamento: formData.departamento,
        puesto_requerido: formData.puestoRequerido,
        numero_vacantes: parseInt(formData.numeroVacantes) || 1,
        tipo_puesto: {
          nuevaCreacion: formData.nuevaCreacion,
          reemplazoTemporal: formData.reemplazoTemporal,
          reestructuracionPuesto: formData.reestructuracionPuesto,
          reemplazoDefinitivo: formData.reemplazoDefinitivo,
          renunciaVoluntaria: formData.renunciaVoluntaria,
          promocion: formData.promocion,
          incapacidad: formData.incapacidad,
          cancelacionContrato: formData.cancelacionContrato,
          licencia: formData.licencia,
          vacaciones: formData.vacaciones,
          incrementoLabores: formData.incrementoLabores,
          licenciaMaternidad: formData.licenciaMaternidad,
        },
        motivo_puesto: formData.motivoPuesto,
        nombre_empleado_reemplaza: formData.nombreEmpleadoReemplaza,
        funciones_principales: [
          formData.funcion1,
          formData.funcion2,
          formData.funcion3,
          formData.funcion4,
          formData.funcion5,
        ].filter(f => f?.trim()),
        formacion_academica: {
          bachiller: formData.bachiller,
          tecnico: formData.tecnico,
          profesional: formData.profesional,
          especializacion: formData.especializacion,
          estudianteUniversitario: formData.estudianteUniversitario,
        },
        otros_estudios: formData.otrosEstudios,
        idioma_ingles: formData.idiomaIngles,
        habilidad_informatica: {
          word: (formData.wordExcelPowerPoint.basico ? 'basico' : formData.wordExcelPowerPoint.intermedio ? 'intermedio' : formData.wordExcelPowerPoint.avanzado ? 'avanzado' : undefined) as 'basico' | 'intermedio' | 'avanzado' | undefined,
          excel: (formData.wordExcelPowerPoint.basico ? 'basico' : formData.wordExcelPowerPoint.intermedio ? 'intermedio' : formData.wordExcelPowerPoint.avanzado ? 'avanzado' : undefined) as 'basico' | 'intermedio' | 'avanzado' | undefined,
          powerpoint: (formData.wordExcelPowerPoint.basico ? 'basico' : formData.wordExcelPowerPoint.intermedio ? 'intermedio' : formData.wordExcelPowerPoint.avanzado ? 'avanzado' : undefined) as 'basico' | 'intermedio' | 'avanzado' | undefined,
          outlook: (formData.correoElectronico.basico ? 'basico' : formData.correoElectronico.intermedio ? 'intermedio' : formData.correoElectronico.avanzado ? 'avanzado' : undefined) as 'basico' | 'intermedio' | 'avanzado' | undefined,
          internet: (formData.internet.basico ? 'basico' : formData.internet.intermedio ? 'intermedio' : formData.internet.avanzado ? 'avanzado' : undefined) as 'basico' | 'intermedio' | 'avanzado' | undefined,
          software_especifico: formData.otroEspecifique ? [{ nombre: formData.otroEspecifique, nivel: 'basico' as const }] : undefined,
        },
        habilidades_tecnicas: {
          informacion: formData.informacion,
          maquinariaEquipos: formData.maquinariaEquipos,
          decisiones: formData.decisiones,
          supervisionPersonal: formData.supervisionPersonal,
          responsabilidades: formData.responsabilidades,
          supervision: formData.supervision,
        },
        custom_responses: customResponses,
      }

      let requisition
      if (editRequisitionId) {
        // Actualizar requisición existente
        requisition = await updateRequisition(editRequisitionId, requisitionData)
        success('¡Borrador actualizado exitosamente!')
      } else {
        // Crear nueva requisición
        requisition = await createRequisition(requisitionData)
        success('¡Borrador guardado exitosamente!')
      }
      
      router.push(`/requisitions/${requisition.id}`)
    } catch (err: any) {
      console.error('Error saving draft:', err)
      error(err?.message || 'Error al guardar el borrador')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyId) {
      warning('Por favor seleccione una empresa')
      return
    }

    if (!formData.puestoRequerido) {
      warning('Por favor especifique el puesto requerido')
      return
    }

    try {
      setSaving(true)
      
      const requisitionData = {
        company_id: formData.companyId,
        departamento: formData.departamento,
        puesto_requerido: formData.puestoRequerido,
        numero_vacantes: parseInt(formData.numeroVacantes) || 1,
        tipo_puesto: {
          nuevaCreacion: formData.nuevaCreacion,
          reemplazoTemporal: formData.reemplazoTemporal,
          reestructuracionPuesto: formData.reestructuracionPuesto,
          reemplazoDefinitivo: formData.reemplazoDefinitivo,
          renunciaVoluntaria: formData.renunciaVoluntaria,
          promocion: formData.promocion,
          incapacidad: formData.incapacidad,
          cancelacionContrato: formData.cancelacionContrato,
          licencia: formData.licencia,
          vacaciones: formData.vacaciones,
          incrementoLabores: formData.incrementoLabores,
          licenciaMaternidad: formData.licenciaMaternidad,
        },
        motivo_puesto: formData.motivoPuesto,
        nombre_empleado_reemplaza: formData.nombreEmpleadoReemplaza,
        funciones_principales: [
          formData.funcion1,
          formData.funcion2,
          formData.funcion3,
          formData.funcion4,
          formData.funcion5,
        ].filter(f => f?.trim()),
        formacion_academica: {
          bachiller: formData.bachiller,
          tecnico: formData.tecnico,
          profesional: formData.profesional,
          especializacion: formData.especializacion,
          estudianteUniversitario: formData.estudianteUniversitario,
        },
        otros_estudios: formData.otrosEstudios,
        idioma_ingles: formData.idiomaIngles,
        habilidad_informatica: {
          word: (formData.wordExcelPowerPoint.basico ? 'basico' : formData.wordExcelPowerPoint.intermedio ? 'intermedio' : formData.wordExcelPowerPoint.avanzado ? 'avanzado' : undefined) as 'basico' | 'intermedio' | 'avanzado' | undefined,
          excel: (formData.wordExcelPowerPoint.basico ? 'basico' : formData.wordExcelPowerPoint.intermedio ? 'intermedio' : formData.wordExcelPowerPoint.avanzado ? 'avanzado' : undefined) as 'basico' | 'intermedio' | 'avanzado' | undefined,
          powerpoint: (formData.wordExcelPowerPoint.basico ? 'basico' : formData.wordExcelPowerPoint.intermedio ? 'intermedio' : formData.wordExcelPowerPoint.avanzado ? 'avanzado' : undefined) as 'basico' | 'intermedio' | 'avanzado' | undefined,
          outlook: (formData.correoElectronico.basico ? 'basico' : formData.correoElectronico.intermedio ? 'intermedio' : formData.correoElectronico.avanzado ? 'avanzado' : undefined) as 'basico' | 'intermedio' | 'avanzado' | undefined,
          internet: (formData.internet.basico ? 'basico' : formData.internet.intermedio ? 'intermedio' : formData.internet.avanzado ? 'avanzado' : undefined) as 'basico' | 'intermedio' | 'avanzado' | undefined,
          software_especifico: formData.otroEspecifique ? [{ nombre: formData.otroEspecifique, nivel: 'basico' as const }] : undefined,
        },
        habilidades_tecnicas: {
          informacion: formData.informacion,
          maquinariaEquipos: formData.maquinariaEquipos,
          decisiones: formData.decisiones,
          supervisionPersonal: formData.supervisionPersonal,
          responsabilidades: formData.responsabilidades,
          supervision: formData.supervision,
        },
        custom_responses: customResponses,
      }

      let requisition
      if (editRequisitionId) {
        // Actualizar requisición existente y cambiar estado
        await updateRequisition(editRequisitionId, requisitionData)
        requisition = await updateRequisition(editRequisitionId, { status: 'submitted' })
      } else {
        // Crear y enviar la requisición
        requisition = await createRequisition(requisitionData)
        await updateRequisition(requisition.id, { status: 'submitted' })
      }
      
      success('¡Requisición enviada exitosamente!')
      router.push(`/requisitions/${requisition.id}`)
    } catch (err: any) {
      console.error('Error submitting requisition:', err)
      error(err?.message || 'Error al enviar la requisición')
    } finally {
      setSaving(false)
    }
  }

  // Mostrar loading mientras se verifica la sesión o se carga la requisición
  if (loading || loadingRequisition) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loadingRequisition ? 'Cargando requisición...' : 'Verificando sesión...'}
          </p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, mostrar loading mientras redirige
  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with instructions */}
        <div className="bg-brand-dark text-white p-4">
          <h2 className="text-lg font-bold text-center">
            {editRequisitionId ? 'EDITAR REQUISICIÓN' : 'NUEVA REQUISICIÓN'}
          </h2>
          <p className="text-sm text-center mt-1">
            Recuerde realizar su requisición de personal con <strong>mínimo 15 días hábiles de ANTICIPACIÓN</strong> a la fecha de inicio de labores solicitadas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Botón volver si está editando */}
          {editRequisitionId && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => router.push(`/requisitions/${editRequisitionId}`)}
                className="flex items-center gap-2 text-brand-dark hover:text-brand-accent font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a detalles
              </button>
            </div>
          )}

          {/* Datos Generales */}
          <div className="form-section">
            <div className="form-section-header">
              DATOS GENERALES
            </div>
            <div className="form-section-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NOMBRE DE LA EMPRESA <span className="text-red-600">*</span>
                  </label>
                  {loadingCompanies ? (
                    <div className="form-input flex items-center text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                      Cargando empresas...
                    </div>
                  ) : userCompanies.length === 0 ? (
                    <div className="form-input text-red-600">
                      No tiene empresas asignadas. Contacte al administrador.
                    </div>
                  ) : (
                    <>
                      <select
                        name="companyId"
                        value={formData.companyId}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                        disabled={!!editRequisitionId}
                      >
                        <option value="">Seleccione una empresa</option>
                        {userCompanies.map((company) => (
                          <option key={company.company_id} value={company.company_id}>
                            {company.company_name}
                          </option>
                        ))}
                      </select>
                      {editRequisitionId && (
                        <p className="mt-1 text-xs text-gray-500">
                          No se puede cambiar la empresa al editar una requisición
                        </p>
                      )}
                      {!editRequisitionId && (userRole === 'admin' || userRole === 'superadmin') && (
                        <p className="mt-1 text-xs text-brand-accent">
                          <span className="font-semibold">Admin:</span> Puede ver todas las empresas activas
                        </p>
                      )}
                    </>
                  )}
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

          {/* Informaci f3n sobre el puesto */}
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
                    value={(formData as any)[`funcion${num}`] as string}
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

                  {( [ 'wordExcelPowerPoint', 'baseDatos', 'internet', 'correoElectronico' ] as const).map((skill) => (
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
            </div>
          </div>

          {/* Secciones Personalizadas */}
          {template && template.sections && template.sections.length > 0 && (
            <div className="space-y-6">
              <div className="border-t-2 border-brand-dark pt-6">
                <h3 className="text-lg font-bold text-brand-dark mb-4">
                  INFORMACIÓN ADICIONAL PERSONALIZADA
                </h3>
              </div>
              {template.sections
                .sort((a, b) => a.position - b.position)
                .map((section) => (
                  <DynamicSection
                    key={section.id}
                    section={section}
                    values={customResponses[section.id] || {}}
                    onChange={handleCustomResponse}
                    disabled={saving}
                  />
                ))}
            </div>
          )}

          {/* Submit button */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : editRequisitionId ? 'Actualizar Borrador' : 'Guardar como Borrador'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-brand-dark text-white rounded-md hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Enviando...' : editRequisitionId ? 'Actualizar y Enviar' : 'Enviar Requisición'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
