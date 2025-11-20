"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import { FullCandidateProfile } from '@/lib/types/candidates'
import { getCandidateProfile, analyzeCandidateMatch, MatchResult } from '@/lib/candidates'
import { Requisition } from '@/lib/types/requisitions'
import { FileText, ExternalLink, Briefcase, GraduationCap, Award, Globe, ArrowLeft, CheckCircle, XCircle, AlertCircle, BarChart2, Download } from 'lucide-react'
import ConfirmModal from '@/app/components/ConfirmModal'
import CompatibilityModal from '@/app/components/CompatibilityModal'
import { downloadCandidatePDF } from '@/lib/exportUtils'

export default function CandidateDetailPage() {
  const { id } = useParams()
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()

  const [candidate, setCandidate] = useState<FullCandidateProfile | null>(null)
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [isCompatibilityModalOpen, setIsCompatibilityModalOpen] = useState(false)
  const [busy, setBusy] = useState(true)
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.replace('/admin/login?reason=unauthenticated')
    }
  }, [loading, user, profile, router])

  useEffect(() => {
    if (id) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleExternalLink = (url: string) => {
    const normalizedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    setConfirmUrl(normalizedUrl)
  }

  const confirmNavigation = () => {
    if (confirmUrl) {
      window.open(confirmUrl, '_blank', 'noopener,noreferrer')
      setConfirmUrl(null)
    }
  }

  const handleAnalyze = (req: Requisition) => {
    if (!candidate) return { score: 0, matches: [] }
    return analyzeCandidateMatch(candidate, req)
  }

  const loadData = async () => {
    try {
      setBusy(true)
      const candData = await getCandidateProfile(id as string)
      
      // Fetch email securely
      let email = null
      try {
        const s = await supabase.auth.getSession()
        const token = (s as any).data?.session?.access_token ?? null
        const emailRes = await fetch('/api/admin/secure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'get-user-email', userId: id })
        })
        const emailBody = await emailRes.json()
        if (emailRes.ok) email = emailBody.data?.email
      } catch (e) { console.error('Error fetching email', e) }

      if (candData) {
        setCandidate({ ...candData, email })
      } else {
        setCandidate(null)
      }

      // Fetch active requisitions for matching
      const { data: reqs } = await supabase
        .from('requisitions')
        .select('*')
        .eq('status', 'approved') // Only active ones
        .order('created_at', { ascending: false })
      
      setRequisitions(reqs || [])
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  if (loading || busy) return <div className="p-8 text-center">Cargando...</div>
  if (!candidate) return <div className="p-8 text-center">Candidato no encontrado</div>

  return (
    <RequireRoleClient allow={['superadmin', 'admin', 'partner']}>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-shrink-0">
              {candidate.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={candidate.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-gray-100" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-brand-dark flex items-center justify-center text-white text-3xl font-bold">
                  {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{candidate.first_name} {candidate.last_name}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                <span>{candidate.email}</span>
                <span>•</span>
                <span>{candidate.phone}</span>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-4">
                {candidate.resume_url && (
                  <a 
                    href={candidate.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100"
                  >
                    <FileText className="w-4 h-4 mr-2" /> Ver CV
                  </a>
                )}
                {candidate.linkedin_url && (
                  <button 
                    onClick={() => handleExternalLink(candidate.linkedin_url!)}
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> LinkedIn
                  </button>
                )}
                {candidate.portfolio_url && (
                  <button 
                    onClick={() => handleExternalLink(candidate.portfolio_url!)}
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                  >
                    <Globe className="w-4 h-4 mr-2" /> Portafolio
                  </button>
                )}
              </div>

              {candidate.summary && (
                <div className="mt-6 p-4 bg-gray-50 rounded-md text-gray-700 text-sm leading-relaxed">
                  {candidate.summary}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Experience */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gray-400" /> Experiencia
              </h2>
              <div className="space-y-6">
                {candidate.experience.map(exp => (
                  <div key={exp.id} className="relative pl-4 border-l-2 border-gray-200">
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                    <h3 className="font-medium text-gray-900">{exp.position}</h3>
                    <p className="text-sm text-brand-dark font-medium">{exp.company}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {exp.start_date} - {exp.is_current ? 'Presente' : exp.end_date}
                    </p>
                    {exp.description && <p className="text-sm text-gray-600 mt-2">{exp.description}</p>}
                  </div>
                ))}
                {candidate.experience.length === 0 && <p className="text-gray-500 italic text-sm">Sin experiencia registrada</p>}
              </div>
            </div>

            {/* Education */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-gray-400" /> Educación
              </h2>
              <div className="space-y-4">
                {candidate.education.map(edu => (
                  <div key={edu.id}>
                    <h3 className="font-medium text-gray-900">{edu.degree} en {edu.field_of_study}</h3>
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {edu.start_date} - {edu.is_current ? 'Presente' : edu.end_date}
                    </p>
                  </div>
                ))}
                {candidate.education.length === 0 && <p className="text-gray-500 italic text-sm">Sin educación registrada</p>}
              </div>
            </div>

            {/* Job Profile - Additional Information */}
            {candidate.job_profile && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Información Complementaria</h2>
                
                {/* Formación Académica */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Formación Académica</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.job_profile.bachiller && <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">Bachiller</span>}
                    {candidate.job_profile.tecnico && <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">Técnico</span>}
                    {candidate.job_profile.profesional && <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">Profesional</span>}
                    {candidate.job_profile.especializacion && <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">Especialización</span>}
                    {candidate.job_profile.estudianteUniversitario && <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">Estudiante Universitario</span>}
                    {!candidate.job_profile.bachiller && !candidate.job_profile.tecnico && !candidate.job_profile.profesional && !candidate.job_profile.especializacion && !candidate.job_profile.estudianteUniversitario && (
                      <span className="text-gray-500 italic text-sm">No especificado</span>
                    )}
                  </div>
                  {candidate.job_profile.otrosEstudios && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-gray-600">Otros estudios: </span>
                      <span className="text-xs text-gray-700">{candidate.job_profile.otrosEstudios}</span>
                    </div>
                  )}
                </div>

                {/* Idiomas Adicionales del Job Profile */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Idiomas (Perfil Complementario)</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.job_profile.idiomaEspanol && <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100">Español</span>}
                    {candidate.job_profile.idiomaIngles && <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100">Inglés</span>}
                    {candidate.job_profile.idiomaFrances && <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100">Francés</span>}
                    {candidate.job_profile.idiomaAleman && <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100">Alemán</span>}
                    {candidate.job_profile.idiomaPortugues && <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100">Portugués</span>}
                    {candidate.job_profile.idiomaItaliano && <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100">Italiano</span>}
                    {candidate.job_profile.idiomaMandarin && <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100">Mandarín</span>}
                    {!candidate.job_profile.idiomaEspanol && !candidate.job_profile.idiomaIngles && !candidate.job_profile.idiomaFrances && !candidate.job_profile.idiomaAleman && !candidate.job_profile.idiomaPortugues && !candidate.job_profile.idiomaItaliano && !candidate.job_profile.idiomaMandarin && (
                      <span className="text-gray-500 italic text-sm">No especificado</span>
                    )}
                  </div>
                </div>

                {/* Habilidades Informáticas */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Habilidades Informáticas</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Sistemas Operativos */}
                    <div>
                      <span className="font-medium text-gray-600">Sistemas Operativos:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {candidate.job_profile.sistemaOperativo?.windows && <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">Windows</span>}
                        {candidate.job_profile.sistemaOperativo?.linux && <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">Linux</span>}
                        {candidate.job_profile.sistemaOperativo?.macos && <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">macOS</span>}
                        {candidate.job_profile.sistemaOperativo?.otros && <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">Otros</span>}
                        {!candidate.job_profile.sistemaOperativo?.windows && !candidate.job_profile.sistemaOperativo?.linux && !candidate.job_profile.sistemaOperativo?.macos && !candidate.job_profile.sistemaOperativo?.otros && (
                          <span className="text-gray-400 italic text-xs">No especificado</span>
                        )}
                      </div>
                    </div>

                    {/* Office */}
                    <div>
                      <span className="font-medium text-gray-600">Office (Word/Excel/PowerPoint):</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {candidate.job_profile.wordExcelPowerPoint?.basico && <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-100">Básico</span>}
                        {candidate.job_profile.wordExcelPowerPoint?.intermedio && <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded border border-orange-100">Intermedio</span>}
                        {candidate.job_profile.wordExcelPowerPoint?.avanzado && <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-100">Avanzado</span>}
                        {!candidate.job_profile.wordExcelPowerPoint?.basico && !candidate.job_profile.wordExcelPowerPoint?.intermedio && !candidate.job_profile.wordExcelPowerPoint?.avanzado && (
                          <span className="text-gray-400 italic text-xs">No especificado</span>
                        )}
                      </div>
                    </div>

                    {/* Bases de Datos */}
                    <div>
                      <span className="font-medium text-gray-600">Bases de Datos:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {candidate.job_profile.baseDatos?.basico && <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-100">Básico</span>}
                        {candidate.job_profile.baseDatos?.intermedio && <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded border border-orange-100">Intermedio</span>}
                        {candidate.job_profile.baseDatos?.avanzado && <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-100">Avanzado</span>}
                        {!candidate.job_profile.baseDatos?.basico && !candidate.job_profile.baseDatos?.intermedio && !candidate.job_profile.baseDatos?.avanzado && (
                          <span className="text-gray-400 italic text-xs">No especificado</span>
                        )}
                      </div>
                    </div>

                    {/* Internet */}
                    <div>
                      <span className="font-medium text-gray-600">Internet:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {candidate.job_profile.internet?.basico && <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-100">Básico</span>}
                        {candidate.job_profile.internet?.intermedio && <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded border border-orange-100">Intermedio</span>}
                        {candidate.job_profile.internet?.avanzado && <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-100">Avanzado</span>}
                        {!candidate.job_profile.internet?.basico && !candidate.job_profile.internet?.intermedio && !candidate.job_profile.internet?.avanzado && (
                          <span className="text-gray-400 italic text-xs">No especificado</span>
                        )}
                      </div>
                    </div>

                    {/* Correo Electrónico */}
                    <div>
                      <span className="font-medium text-gray-600">Correo Electrónico:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {candidate.job_profile.correoElectronico?.basico && <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-100">Básico</span>}
                        {candidate.job_profile.correoElectronico?.intermedio && <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded border border-orange-100">Intermedio</span>}
                        {candidate.job_profile.correoElectronico?.avanzado && <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-100">Avanzado</span>}
                        {!candidate.job_profile.correoElectronico?.basico && !candidate.job_profile.correoElectronico?.intermedio && !candidate.job_profile.correoElectronico?.avanzado && (
                          <span className="text-gray-400 italic text-xs">No especificado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {candidate.job_profile.otroEspecifique && (
                    <div className="mt-3">
                      <span className="text-xs font-medium text-gray-600">Otras habilidades: </span>
                      <span className="text-xs text-gray-700">{candidate.job_profile.otroEspecifique}</span>
                    </div>
                  )}
                </div>

                {/* Habilidades y Conocimientos Técnicos */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Habilidades y Conocimientos Técnicos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      {candidate.job_profile.informacion ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300" />
                      )}
                      <span className={candidate.job_profile.informacion ? 'text-gray-700' : 'text-gray-400'}>
                        Manejo de información confidencial
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {candidate.job_profile.maquinariaEquipos ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300" />
                      )}
                      <span className={candidate.job_profile.maquinariaEquipos ? 'text-gray-700' : 'text-gray-400'}>
                        Manejo de maquinaria/equipos
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {candidate.job_profile.decisiones ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300" />
                      )}
                      <span className={candidate.job_profile.decisiones ? 'text-gray-700' : 'text-gray-400'}>
                        Toma de decisiones
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {candidate.job_profile.supervisionPersonal ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300" />
                      )}
                      <span className={candidate.job_profile.supervisionPersonal ? 'text-gray-700' : 'text-gray-400'}>
                        Supervisión de personal
                      </span>
                    </div>
                  </div>

                  {/* Responsabilidades y Supervisión */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Tipo de responsabilidad:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {candidate.job_profile.responsabilidades?.confidencial && <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded border border-red-100">Confidencial</span>}
                        {candidate.job_profile.responsabilidades?.restringida && <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded border border-orange-100">Restringida</span>}
                        {!candidate.job_profile.responsabilidades?.confidencial && !candidate.job_profile.responsabilidades?.restringida && (
                          <span className="text-gray-400 italic text-xs">No especificado</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Tipo de supervisión:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {candidate.job_profile.supervision?.directa && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">Directa</span>}
                        {candidate.job_profile.supervision?.indirecta && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100">Indirecta</span>}
                        {!candidate.job_profile.supervision?.directa && !candidate.job_profile.supervision?.indirecta && (
                          <span className="text-gray-400 italic text-xs">No especificado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Acciones</h2>
              
              <button
                onClick={() => setIsCompatibilityModalOpen(true)}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-dark hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
              >
                <BarChart2 className="w-4 h-4 mr-2" />
                Analizar Compatibilidad
              </button>

              <button
                onClick={() => candidate && downloadCandidatePDF(candidate)}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <CompatibilityModal
        isOpen={isCompatibilityModalOpen}
        onClose={() => setIsCompatibilityModalOpen(false)}
        requisitions={requisitions}
        onAnalyze={handleAnalyze}
        candidateName={candidate ? `${candidate.first_name} ${candidate.last_name}` : ''}
      />

      <ConfirmModal
        isOpen={!!confirmUrl}
        title="Confirmar navegación"
        message="¿Desea navegar fuera del sitio web a este enlace externo?"
        confirmText="Sí, abrir"
        cancelText="Cancelar"
        onConfirm={confirmNavigation}
        onCancel={() => setConfirmUrl(null)}
        type="warning"
      />
    </RequireRoleClient>
  )
}
