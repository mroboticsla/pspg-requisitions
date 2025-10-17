"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import { useToast } from '@/lib/useToast'
import { ArrowLeft, Save, Building2, Mail, Phone, Globe, MapPin } from 'lucide-react'

interface CompanyData {
  id: string
  name: string
  legal_name: string | null
  tax_id: string | null
  industry: string | null
  website: string | null
  address: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  } | null
  contact_info: {
    email?: string
    phone?: string
    mobile?: string
  } | null
  is_active: boolean
}

export default function CompanyFormPage() {
  const params = useParams()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const { success, error: showError } = useToast()

  const isNew = params.id === 'new'
  const companyId = !isNew ? params.id as string : null

  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadingCompany, setLoadingCompany] = useState(!isNew)

  // Form fields
  const [name, setName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [industry, setIndustry] = useState('')
  const [website, setWebsite] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [country, setCountry] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [mobile, setMobile] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [formErrors, setFormErrors] = useState<{ name?: string; tax_id?: string }>({})

  const isSuper = (profile as any)?.roles?.name === 'superadmin'
  const isAdmin = (profile as any)?.roles?.name === 'admin'
  const canManage = isSuper || isAdmin

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.replace('/auth')
    }
  }, [loading, user, profile, router])

  // Load company data if editing
  useEffect(() => {
    if (isNew || !companyId || !user) return

    const loadCompany = async () => {
      try {
        setLoadingCompany(true)
        const s = await supabase.auth.getSession()
        const token = (s as any).data?.session?.access_token ?? null

        const res = await fetch('/api/admin/secure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'get-company', companyId })
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Error loading company')

        const company: CompanyData = body.data
        setCompanyData(company)
        
        // Populate form
        setName(company.name)
        setLegalName(company.legal_name || '')
        setTaxId(company.tax_id || '')
        setIndustry(company.industry || '')
        setWebsite(company.website || '')
        setStreet(company.address?.street || '')
        setCity(company.address?.city || '')
        setState(company.address?.state || '')
        setZip(company.address?.zip || '')
        setCountry(company.address?.country || '')
        setEmail(company.contact_info?.email || '')
        setPhone(company.contact_info?.phone || '')
        setMobile(company.contact_info?.mobile || '')
        setIsActive(company.is_active)
      } catch (err: any) {
        showError(err.message || 'Error loading company')
        router.push('/admin/companies')
      } finally {
        setLoadingCompany(false)
      }
    }

    loadCompany()
  }, [isNew, companyId, user, showError, router])

  const validateForm = (): boolean => {
    const errors: { name?: string; tax_id?: string } = {}
    
    if (!name.trim()) {
      errors.name = 'El nombre de la empresa es requerido'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setBusy(true)
      const s = await supabase.auth.getSession()
      const token = (s as any).data?.session?.access_token ?? null

      const action = isNew ? 'create-company' : 'update-company'
      const payload: any = {
        action,
        name: name.trim(),
        legal_name: legalName.trim() || null,
        tax_id: taxId.trim() || null,
        industry: industry.trim() || null,
        website: website.trim() || null,
        address: {
          street: street.trim() || '',
          city: city.trim() || '',
          state: state.trim() || '',
          zip: zip.trim() || '',
          country: country.trim() || ''
        },
        contact_info: {
          email: email.trim() || '',
          phone: phone.trim() || '',
          mobile: mobile.trim() || ''
        },
        is_active: isActive
      }
      
      if (!isNew) {
        payload.companyId = companyId
      }

      const res = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Error al guardar empresa')

      success(isNew ? 'Empresa creada exitosamente' : 'Empresa actualizada exitosamente')
      router.push('/admin/companies')
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  // Loading state
  if (loading || loadingCompany) {
    return (
      <RequireRoleClient allow={['superadmin', 'admin']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </RequireRoleClient>
    )
  }

  return (
    <RequireRoleClient allow={['superadmin', 'admin']}>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/companies')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isNew ? 'Nueva Empresa' : 'Editar Empresa'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isNew ? 'Complete la información de la nueva empresa' : 'Actualice la información de la empresa'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="space-y-6">
            {/* Información básica */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Información Básica
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Empresa <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`form-input ${formErrors.name ? 'border-red-500' : ''}`}
                    placeholder="Ej: Acme Corporation"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="form-input"
                    placeholder="Ej: Acme Corporation S.A. de C.V."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RFC / Tax ID
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className={`form-input ${formErrors.tax_id ? 'border-red-500' : ''}`}
                    placeholder="Ej: ACM123456ABC"
                  />
                  {formErrors.tax_id && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.tax_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industria
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="form-input"
                    placeholder="Ej: Tecnología, Manufactura, Servicios"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="form-input"
                    placeholder="https://www.ejemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* Información de contacto */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Información de Contacto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="contacto@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                    placeholder="+52 55 1234 5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Móvil
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="form-input"
                    placeholder="+52 55 9876 5432"
                  />
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Dirección
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calle
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="form-input"
                    placeholder="Calle Principal #123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                    placeholder="Ciudad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="form-input"
                    placeholder="Estado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="form-input"
                    placeholder="12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="form-input"
                    placeholder="México"
                  />
                </div>
              </div>
            </div>

            {/* Estado (solo al editar) */}
            {!isNew && (
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-brand-dark focus:ring-brand-accent"
                  />
                  <span className="ml-2 text-sm text-gray-700">Empresa activa</span>
                </label>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => router.push('/admin/companies')}
                disabled={busy}
                className="btn-secondary w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={busy}
                className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {busy ? 'Guardando...' : 'Guardar Empresa'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </RequireRoleClient>
  )
}
