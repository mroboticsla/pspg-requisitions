"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import { useToast } from '@/lib/useToast'
import { Search, FileText, Eye, Briefcase, GraduationCap } from 'lucide-react'
import { FullCandidateProfile } from '@/lib/types/candidates'

interface CandidateRow {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  is_active: boolean
  candidate_profile?: {
    summary: string | null
    resume_url: string | null
  }
}

export default function CandidatesAdminPage() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const { error: showError } = useToast()

  const [candidates, setCandidates] = useState<CandidateRow[]>([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.replace('/admin/login?reason=unauthenticated')
    }
  }, [loading, user, profile, router])

  const refresh = useCallback(async () => {
    try {
      setBusy(true)
      
      // 1. Get users with role 'candidate'
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'candidate')
        .single()
      
      if (!roleData) throw new Error('Rol de candidato no encontrado')

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id, first_name, last_name, phone, is_active,
          candidate_profiles ( summary, resume_url )
        `)
        .eq('role_id', roleData.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // 2. Get emails (requires admin secure endpoint usually, but for now we might skip or use the same pattern as users page)
      // For simplicity in this demo, we'll fetch emails via the secure endpoint if possible, or just show what we have.
      // Reusing the pattern from users page:
      
      const s = await supabase.auth.getSession()
      const token = (s as any).data?.session?.access_token ?? null

      const candidatesWithEmails = await Promise.all(
        (profiles || []).map(async (p: any) => {
          let email = null
          try {
            const emailRes = await fetch('/api/admin/secure', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ action: 'get-user-email', userId: p.id })
            })
            const emailBody = await emailRes.json()
            if (emailRes.ok) email = emailBody.data?.email
          } catch (e) { /* ignore */ }

          return {
            ...p,
            email,
            candidate_profile: p.candidate_profiles?.[0] // It's an array because of the join
          }
        })
      )
      
      setCandidates(candidatesWithEmails)

    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }, [showError])

  useEffect(() => {
    if (loading) return
    if (!user || !profile) return
    refresh()
  }, [loading, user, profile, refresh])

  const filteredCandidates = useMemo(() => {
    if (!search.trim()) return candidates
    const s = search.toLowerCase()
    return candidates.filter(c => {
      const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase()
      const email = c.email || ''
      return fullName.includes(s) || email.toLowerCase().includes(s)
    })
  }, [candidates, search])

  return (
    <RequireRoleClient allow={['superadmin', 'admin', 'partner']}>
      <div className="space-y-6">
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Candidatos</h1>
              <p className="text-gray-600 mt-1">Base de datos de talento registrado</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar candidatos..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-accent focus:border-brand-accent sm:text-sm"
            />
          </div>

          {/* List */}
          {busy ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando candidatos...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredCandidates.length === 0 && (
                  <li className="px-6 py-4 text-center text-gray-500">No se encontraron candidatos</li>
                )}
                {filteredCandidates.map((candidate) => (
                  <li key={candidate.id}>
                    <div className="block hover:bg-gray-50 transition duration-150 ease-in-out">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-dark flex items-center justify-center text-white font-bold">
                              {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-brand-dark truncate">
                                {candidate.first_name} {candidate.last_name}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="truncate">{candidate.email}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {candidate.candidate_profile?.resume_url && (
                              <a
                                href={candidate.candidate_profile.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-400 hover:text-red-600"
                                title="Ver CV"
                              >
                                <FileText className="w-5 h-5" />
                              </a>
                            )}
                            <button
                              onClick={() => router.push(`/admin/candidates/${candidate.id}`)}
                              className="p-2 text-gray-400 hover:text-brand-accent"
                              title="Ver Perfil Completo"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            {candidate.candidate_profile?.summary && (
                              <p className="flex items-center text-sm text-gray-500 line-clamp-2 max-w-2xl">
                                {candidate.candidate_profile.summary}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </RequireRoleClient>
  )
}
