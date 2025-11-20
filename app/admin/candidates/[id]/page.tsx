"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import { FullCandidateProfile } from '@/lib/types/candidates'
import { getCandidateProfile, analyzeCandidateMatch, MatchResult } from '@/lib/candidates'
import { Requisition } from '@/lib/types/requisitions'
import { FileText, ExternalLink, Briefcase, GraduationCap, Award, Globe, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function CandidateDetailPage() {
  const { id } = useParams()
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()

  const [candidate, setCandidate] = useState<FullCandidateProfile | null>(null)
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [selectedReqId, setSelectedReqId] = useState<string>('')
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.replace('/admin/login?reason=unauthenticated')
    }
  }, [loading, user, profile, router])

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  useEffect(() => {
    if (selectedReqId && candidate) {
      const req = requisitions.find(r => r.id === selectedReqId)
      if (req) {
        const result = analyzeCandidateMatch(candidate, req)
        setMatchResult(result)
      }
    } else {
      setMatchResult(null)
    }
  }, [selectedReqId, candidate, requisitions])

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
        .in('status', ['approved', 'submitted', 'in_review']) // Only active ones
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
                  <a 
                    href={candidate.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> LinkedIn
                  </a>
                )}
                {candidate.portfolio_url && (
                  <a 
                    href={candidate.portfolio_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                  >
                    <Globe className="w-4 h-4 mr-2" /> Portafolio
                  </a>
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

            {/* Skills & Languages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-gray-400" /> Habilidades
                </h2>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map(skill => (
                    <span key={skill.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {skill.skill_name} <span className="opacity-60 ml-1">({skill.level})</span>
                    </span>
                  ))}
                  {candidate.skills.length === 0 && <p className="text-gray-500 italic text-sm">Sin habilidades</p>}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gray-400" /> Idiomas
                </h2>
                <div className="space-y-2">
                  {candidate.languages.map(lang => (
                    <div key={lang.id} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{lang.language}</span>
                      <span className="text-gray-500">{lang.proficiency}</span>
                    </div>
                  ))}
                  {candidate.languages.length === 0 && <p className="text-gray-500 italic text-sm">Sin idiomas</p>}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Match Analysis */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Análisis de Compatibilidad</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Comparar con Requisición</label>
                <select
                  value={selectedReqId}
                  onChange={e => setSelectedReqId(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent text-sm"
                >
                  <option value="">Seleccionar requisición...</option>
                  {requisitions.map(req => (
                    <option key={req.id} value={req.id}>
                      {req.puesto_requerido} ({req.departamento})
                    </option>
                  ))}
                </select>
              </div>

              {matchResult ? (
                <div className="space-y-6">
                  {/* Score Circle */}
                  <div className="flex flex-col items-center justify-center">
                    <div className={`relative w-24 h-24 rounded-full flex items-center justify-center border-4 text-2xl font-bold ${
                      matchResult.score >= 80 ? 'border-green-500 text-green-600' :
                      matchResult.score >= 50 ? 'border-yellow-500 text-yellow-600' :
                      'border-red-500 text-red-600'
                    }`}>
                      {matchResult.score}%
                    </div>
                    <span className="text-sm text-gray-500 mt-2">Coincidencia Estimada</span>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    {matchResult.matches.map((match, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm border-b border-gray-100 pb-2 last:border-0">
                        {match.status === 'match' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                        {match.status === 'partial' && <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
                        {match.status === 'missing' && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                        
                        <div>
                          <p className="font-medium text-gray-900">{match.item}</p>
                          <p className="text-xs text-gray-500">{match.category} {match.details ? `• ${match.details}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-700">
                    <strong>Nota:</strong> Este análisis es una sugerencia basada en palabras clave y no debe reemplazar la evaluación humana.
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Selecciona una requisición para ver el análisis de compatibilidad.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RequireRoleClient>
  )
}
