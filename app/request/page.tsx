"use client"

import { useState, useEffect, useMemo, Suspense } from 'react'
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
import StepGeneralData from './steps/StepGeneralData'
import StepJobInfo from './steps/StepJobInfo'
import StepFunctions from './steps/StepFunctions'
import StepProfile from './steps/StepProfile'
import StepCustomSection from './steps/StepCustomSection'

function RequisitionFormContent() {
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
  const [editingStatus, setEditingStatus] = useState<RequisitionComplete['status'] | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Obtener rol del usuario desde el profile
  const userRole = (profile as any)?.roles?.name || null

  // Redirigir al login si no hay usuario autenticado - OPTIMIZADO
  useEffect(() => {
    if (!loading && !user && !redirecting) {
      setRedirecting(true)
      router.replace('/auth')
    }
  }, [loading, user, redirecting, router])

  // Cargar empresas según el rol del usuario - OPTIMIZADO
  useEffect(() => {
    // No cargar si no hay usuario o si ya estamos redirigiendo
    if (!user || !profile || redirecting) return
    
    const fetchUserCompanies = async () => {
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
  }, [user, profile, userRole, redirecting])

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
    
  // Funciones principales del puesto (dinámico)
  funcion1: '',
    
    // Perfil del puesto - Formación académica
    bachiller: false,
    tecnico: false,
    profesional: false,
    especializacion: false,
    estudianteUniversitario: false,
    idiomaIngles: false,
    otrosEstudios: '',
    
    // Habilidad informática requerida
      sistemaOperativo: { 
        windows: false, 
        otros: false 
      },
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

  // Construye el arreglo TEXT[] de funciones desde los campos funcionN en formData
  const buildFuncionesArray = () => {
    return Object.keys(formData)
      .map((k) => {
        const m = /^funcion(\d+)$/.exec(k)
        return m ? { key: k, idx: parseInt(m[1], 10) } : null
      })
      .filter((x): x is { key: string; idx: number } => !!x)
      .sort((a, b) => a.idx - b.idx)
      .map(({ key }) => (formData as any)[key] as string)
      .filter((f) => typeof f === 'string' && f.trim().length > 0)
  }

  // Cargar plantilla cuando se selecciona una empresa
  useEffect(() => {
    const loadTemplate = async () => {
      if (!formData.companyId) {
        setTemplate(null)
        setCurrentStep(0)
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

  // Cargar requisición existente si está en modo edición - OPTIMIZADO
  useEffect(() => {
    // No ejecutar si no hay usuario, está redirigiendo, o no hay ID de requisición
    if (!user || !profile || redirecting || !editRequisitionId) return
    
    const loadExistingRequisition = async () => {
      try {
        setLoadingRequisition(true)
        
        const requisition = await getRequisitionById(editRequisitionId) as RequisitionComplete

        if (!requisition) {
          error('No se encontró la requisición')
          router.push('/requisitions')
          return
        }

        // Verificar que sea editable: admins pueden editar cualquier estado, otros solo borrador
        if (requisition.status !== 'draft' && !(userRole === 'admin' || userRole === 'superadmin')) {
          warning('Solo se pueden editar requisiciones en estado borrador')
          router.push(`/requisitions/${editRequisitionId}`)
          return
        }

        // Guardar estado actual para lógica de envío posterior
        setEditingStatus(requisition.status)

        // Cargar template snapshot
        if (requisition.template_snapshot) {
          setTemplate(requisition.template_snapshot)
        }

        // Normalizar motivo del puesto: garantizar solo un motivo seleccionado
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
        const tipoPuesto = (requisition.tipo_puesto as any) || {}
        let selectedMotivo: string | null = null
        for (const k of motivoKeys) {
          if (tipoPuesto?.[k]) { selectedMotivo = k; break }
        }
        const tipoPuestoNormalizado: Record<string, boolean> = {}
        motivoKeys.forEach(k => { tipoPuestoNormalizado[k as string] = selectedMotivo === k })

        // Mapear los datos de la requisición al formulario
        setFormData({
          companyId: requisition.company_id,
          puestoRequerido: requisition.puesto_requerido || '',
          departamento: requisition.departamento || '',
          numeroVacantes: String(requisition.numero_vacantes || 1),
          
          nuevaCreacion: tipoPuestoNormalizado.nuevaCreacion,
          reemplazoTemporal: tipoPuestoNormalizado.reemplazoTemporal,
          reestructuracionPuesto: tipoPuestoNormalizado.reestructuracionPuesto,
          reemplazoDefinitivo: tipoPuestoNormalizado.reemplazoDefinitivo,
          renunciaVoluntaria: tipoPuestoNormalizado.renunciaVoluntaria,
          promocion: tipoPuestoNormalizado.promocion,
          incapacidad: tipoPuestoNormalizado.incapacidad,
          cancelacionContrato: tipoPuestoNormalizado.cancelacionContrato,
          licencia: tipoPuestoNormalizado.licencia,
          vacaciones: tipoPuestoNormalizado.vacaciones,
          incrementoLabores: tipoPuestoNormalizado.incrementoLabores,
          licenciaMaternidad: tipoPuestoNormalizado.licenciaMaternidad,
          
          motivoPuesto: requisition.motivo_puesto || '',
          nombreEmpleadoReemplaza: requisition.nombre_empleado_reemplaza || '',
          
          // Asegurar presencia de funcion1 para el tipo inferido
          funcion1: requisition.funciones_principales?.[0] || '',

          // Mapear todas las funciones a funcion1..funcionN de forma dinámica
          ...(() => {
            const arr = requisition.funciones_principales || []
            const acc: Record<string, string> = {}
            arr.forEach((val, i) => {
              if (i === 0) return // ya asignado en funcion1
              acc[`funcion${i + 1}`] = val || ''
            })
            // Importante: NO sobrescribir funcion1; solo devolver funcion2..N
            return acc
          })(),
          
          bachiller: (requisition.formacion_academica as any)?.bachiller || false,
          tecnico: (requisition.formacion_academica as any)?.tecnico || false,
          profesional: (requisition.formacion_academica as any)?.profesional || false,
          especializacion: (requisition.formacion_academica as any)?.especializacion || false,
          estudianteUniversitario: (requisition.formacion_academica as any)?.estudianteUniversitario || false,
          idiomaIngles: requisition.idioma_ingles || false,
          otrosEstudios: requisition.otros_estudios || '',
          
          
          wordExcelPowerPoint: { 
            basico: requisition.habilidad_informatica?.word === 'basico',
            intermedio: requisition.habilidad_informatica?.word === 'intermedio',
            avanzado: requisition.habilidad_informatica?.word === 'avanzado'
          },
            baseDatos: { 
              basico: requisition.habilidad_informatica?.base_datos === 'basico', 
              intermedio: requisition.habilidad_informatica?.base_datos === 'intermedio', 
              avanzado: requisition.habilidad_informatica?.base_datos === 'avanzado' 
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
          // Mapear sistema operativo si existe
          sistemaOperativo: {
            windows: !!requisition.habilidad_informatica?.sistema_operativo?.windows,
            otros: !!requisition.habilidad_informatica?.sistema_operativo?.otros,
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
          const responses: Record<string, Record<string, any>> = {}
          requisition.custom_responses.forEach((response) => {
            responses[response.section_id] = response.responses
          })
          setCustomResponses(responses)
        }
      } catch (err: any) {
        console.error('Error loading requisition:', err)
        
        // Mostrar notificación de error
        if (err?.message) {
          error(`Error al cargar la requisición: ${err.message}`)
        } else {
          error('Error inesperado al cargar la requisición')
        }
      } finally {
        setLoadingRequisition(false)
      }
    }

    loadExistingRequisition()
  }, [editRequisitionId, user, profile, redirecting, error, router, userRole, warning]) // Dependencias optimizadas

  const handleCustomResponse = (sectionId: string, fieldName: string, value: any) => {
    setCustomResponses(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [fieldName]: value
      }
    }))
  }

  // Pasos del asistente (base + secciones personalizadas)
  const sortedSections = useMemo(() => {
    return (template?.sections || []).slice().sort((a, b) => a.position - b.position)
  }, [template])

  const baseSteps = useMemo(() => [
    { key: 'datos_generales', label: 'Datos generales' },
    { key: 'info_puesto', label: 'Información del puesto' },
    { key: 'funciones', label: 'Funciones principales' },
    { key: 'perfil', label: 'Perfil del puesto' },
  ], [])

  const allSteps = useMemo(() => {
    const custom = sortedSections.map(s => ({ key: `section_${s.id}`, label: s.name }))
    return [...baseSteps, ...custom]
  }, [baseSteps, sortedSections])

  // Ajustar step si cambia la cantidad
  useEffect(() => {
    if (currentStep >= allSteps.length) {
      setCurrentStep(Math.max(0, allSteps.length - 1))
    }
  }, [allSteps.length, currentStep])

  // Scroll al inicio al cambiar de paso
  useEffect(() => {
    if (typeof window === 'undefined') return
    const root = document.scrollingElement || document.documentElement
    const hasVerticalOverflow = (root?.scrollHeight || 0) > (root?.clientHeight || 0) + 8
    const scrolled = (root?.scrollTop || 0) > 24
    // Solo desplazamos si hay overflow vertical y el usuario está algo desplazado
    if (hasVerticalOverflow && scrolled) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep])

  const totalSteps = allSteps.length

  const goNext = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault()
    e?.stopPropagation()
    // Validaciones mínimas por paso
    // Paso 0: empresa requerida
    if (currentStep === 0) {
      if (!formData.companyId) {
        warning('Por favor seleccione una empresa para continuar')
        return
      }
    }

    // Pasos de secciones personalizadas: validar campos requeridos
    const baseCount = baseSteps.length
    if (currentStep >= baseCount) {
      const sectionIdx = currentStep - baseCount
      const section = sortedSections[sectionIdx]
      if (section) {
        const values = customResponses[section.id] || {}
        const missing: string[] = []
        section.fields.forEach(f => {
          if (f.validation?.required) {
            const v = values[f.name]
            const isEmpty = v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && f.field_type === 'currency' && (v.amount == null))
            if (isEmpty) missing.push(f.label)
          }
        })
        if (missing.length > 0) {
          warning(`Complete los campos requeridos: ${missing.join(', ')}`)
          return
        }
      }
    }

    setCurrentStep((s) => Math.min(totalSteps - 1, s + 1))
  }

  const goPrev = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault()
    e?.stopPropagation()
    setCurrentStep((s) => Math.max(0, s - 1))
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
        funciones_principales: buildFuncionesArray(),
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
          base_datos: (formData.baseDatos.basico ? 'basico' : formData.baseDatos.intermedio ? 'intermedio' : formData.baseDatos.avanzado ? 'avanzado' : undefined) as 'basico' | 'intermedio' | 'avanzado' | undefined,
          sistema_operativo: {
            windows: !!formData.sistemaOperativo.windows,
            otros: !!formData.sistemaOperativo.otros,
          },
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
    
    // Evitar envíos prematuros si aún se están cargando secciones dinámicas
    if (loadingTemplate) {
      warning('Aún se están cargando secciones adicionales. Por favor continúa con "Siguiente" y completa los pasos.')
      return
    }
    
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
        funciones_principales: buildFuncionesArray(),
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
          base_datos: (formData.baseDatos.basico ? 'basico' : formData.baseDatos.intermedio ? 'intermedio' : formData.baseDatos.avanzado ? 'avanzado' : undefined) as 'basico' | 'intermedio' | 'avanzado' | undefined,
          sistema_operativo: {
            windows: !!formData.sistemaOperativo.windows,
            otros: !!formData.sistemaOperativo.otros,
          },
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
        // Actualizar requisición existente; si era borrador, enviarla; si no, conservar estado actual
        requisition = await updateRequisition(editRequisitionId, requisitionData)
        if (editingStatus === 'draft') {
          requisition = await updateRequisition(editRequisitionId, { status: 'submitted' })
        }
      } else {
        // Crear y enviar la requisición
        requisition = await createRequisition(requisitionData)
        await updateRequisition(requisition.id, { status: 'submitted' })
      }
      
      if (editRequisitionId && editingStatus !== 'draft') {
        success('¡Requisición actualizada exitosamente!')
      } else {
        success('¡Requisición enviada exitosamente!')
      }
      router.push(`/requisitions/${requisition.id}`)
    } catch (err: any) {
      console.error('Error submitting requisition:', err)
      error(err?.message || 'Error al enviar la requisición')
    } finally {
      setSaving(false)
    }
  }

  // Mostrar loading solo mientras AuthProvider está cargando inicialmente
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Mostrar loading mientras se carga la requisición existente
  if (loadingRequisition) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando requisición...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario después de la carga, mostrar loading mientras redirige
  if (!user || !profile || redirecting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  // Determinar si mostrar "Siguiente" o "Enviar" evitando envíos prematuros mientras se cargan secciones
  const isLastStep = currentStep === totalSteps - 1
  const showNext = !isLastStep || loadingTemplate

  return (
    <div className="min-h-[calc(100dvh-var(--header-h,64px))] flex items-start md:items-center py-6 md:py-12">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with instructions */}
        <div className="bg-brand-dark text-white p-4">
          <h2 className="text-lg font-bold text-center">
            {editRequisitionId ? 'EDITAR REQUISICIÓN' : 'NUEVA REQUISICIÓN'}
          </h2>
          <p className="text-sm text-center mt-1">
            Recuerde realizar su requisición de personal con <strong>mínimo 15 días hábiles de ANTICIPACIÓN</strong> a la fecha de inicio de labores solicitadas.
          </p>
          {/* Progreso */}
          <div className="mt-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Paso {currentStep + 1} de {totalSteps}</span>
              <span>{allSteps[currentStep]?.label}</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-2 bg-brand-accent transition-all"
                style={{ width: `${Math.max(5, ((currentStep + 1) / Math.max(1, totalSteps)) * 100)}%` }}
              />
            </div>
          </div>
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
          {/* Paso 0: Datos Generales */}
          {currentStep === 0 && (
            <StepGeneralData
              loadingCompanies={loadingCompanies}
              userCompanies={userCompanies}
              userRole={userRole}
              editRequisitionId={editRequisitionId}
              formData={formData}
              handleInputChange={handleInputChange}
            />
          )}

          {/* Paso 1: Información sobre el puesto */}
          {currentStep === 1 && (
            <StepJobInfo formData={formData} handleInputChange={handleInputChange} />
          )}

          {/* Paso 2: Funciones principales */}
          {currentStep === 2 && (
            <StepFunctions formData={formData} handleInputChange={handleInputChange} />
          )}

          {/* Paso 3: Perfil del puesto */}
          {currentStep === 3 && (
            <StepProfile
              formData={formData}
              handleInputChange={handleInputChange}
              handleNestedCheckboxChange={handleNestedCheckboxChange}
            />
          )}

          {/* Pasos 4+: secciones personalizadas */}
          {currentStep >= 4 && currentStep < totalSteps && (
            loadingTemplate ? (
              <div className="flex items-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                Cargando secciones...
              </div>
            ) : (
              (() => {
                const idx = currentStep - 4
                const section = sortedSections[idx]
                if (!section) return null
                return (
                  <StepCustomSection
                    section={section as any}
                    values={customResponses[section.id] || {}}
                    onChange={handleCustomResponse}
                    disabled={saving}
                  />
                )
              })()
            )
          )}

          {/* Navegación y acciones (barra inferior sticky para mejor UX) */}
          <div className="sticky bottom-0 left-0 right-0 mt-8 -mx-6 px-6 py-4 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 border-t border-gray-200 flex items-center justify-between">
            {/* Acción secundaria: Guardar borrador (lado izquierdo para reducir confusión con primarios) */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-gray-100 disabled:cursor-not-allowed"
                aria-label={editRequisitionId ? 'Actualizar borrador' : 'Guardar como borrador'}
              >
                {saving
                  ? 'Guardando…'
                  : editRequisitionId
                    ? (editingStatus && editingStatus !== 'draft' ? 'Guardar cambios' : 'Actualizar borrador')
                    : 'Guardar borrador'}
              </button>
            </div>

            {/* Navegación del asistente (lado derecho, primaria a la derecha) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentStep === 0 || saving}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Anterior
              </button>

              {showNext ? (
                <button
                  type="button"
                  onClick={(e) => goNext(e)}
                  disabled={saving}
                  className="px-4 py-2 bg-brand-dark text-white rounded-md hover:bg-brand-accent disabled:bg-gray-400"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving || loadingTemplate}
                  className="px-6 py-2 bg-brand-dark text-white rounded-md hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? 'Enviando…' : editRequisitionId ? 'Actualizar y enviar' : 'Enviar requisición'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RequisitionForm() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    }>
      <RequisitionFormContent />
    </Suspense>
  )
}
