"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import { useToast } from '@/lib/useToast'
import { ArrowLeft, Save, User, Mail, Phone, Shield, Eye, EyeOff } from 'lucide-react'
import PhoneInput, { getUnformattedPhone, COUNTRY_CODES } from '@/app/components/PhoneInput'

interface RoleOption {
  id: string
  name: string
}

interface UserData {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  role_id: string | null
  roles?: {
    id: string
    name: string
  } | null
}

const EXCLUDED_ROLES = ['system', 'superadmin', 'admin', 'partner']

export default function UserFormPage() {
  const params = useParams()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const { success, error: showError } = useToast()

  const isNew = params.id === 'new'
  const userId = !isNew ? params.id as string : null

  const [roles, setRoles] = useState<RoleOption[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadingUser, setLoadingUser] = useState(!isNew)

  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneCountry, setPhoneCountry] = useState('+52')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isSuper = (profile as any)?.roles?.name === 'superadmin'
  const isAdmin = (profile as any)?.roles?.name === 'admin'
  const canManage = isSuper || isAdmin

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.replace('/auth')
    }
  }, [loading, user, profile, router])

  // Load roles
  useEffect(() => {
    if (!user || !canManage) return

    const loadRoles = async () => {
      try {
        const s = await supabase.auth.getSession()
        const token = (s as any).data?.session?.access_token ?? null

        const res = await fetch('/api/admin/secure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'list-roles' })
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Error loading roles')

        const allRoles = body.data || []
        const userRoles = allRoles.filter((r: RoleOption) => !EXCLUDED_ROLES.includes(r.name))
        setRoles(userRoles)
        
        // Set default role for new users
        if (isNew && userRoles.length > 0) {
          setRoleId(userRoles.find((r: RoleOption) => r.name === 'candidate')?.id || userRoles[0].id)
        }
      } catch (err: any) {
        showError(err.message || 'Error loading roles')
      }
    }

    loadRoles()
  }, [user, canManage, isNew, showError])

  // Load user data if editing
  useEffect(() => {
    if (isNew || !userId || !user) return

    const loadUserData = async () => {
      try {
        setLoadingUser(true)
        const s = await supabase.auth.getSession()
        const token = (s as any).data?.session?.access_token ?? null

        const res = await fetch('/api/admin/secure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'list-users' })
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Error loading user')

        const users = body.data || []
        const foundUser = users.find((u: UserData) => u.id === userId)
        
        if (!foundUser) {
          showError('Usuario no encontrado')
          router.replace('/admin/users')
          return
        }

        setUserData(foundUser)

        // Populate form fields
        setFirstName(foundUser.first_name || '')
        setLastName(foundUser.last_name || '')
        setRoleId(foundUser.role_id || '')

        // Parse phone
        if (foundUser.phone) {
          const matchedCountry = COUNTRY_CODES.find(c => foundUser.phone?.startsWith(c.code))
          if (matchedCountry) {
            setPhoneCountry(matchedCountry.code)
            setPhoneNumber(foundUser.phone.slice(matchedCountry.code.length))
          } else {
            setPhoneNumber(foundUser.phone)
          }
        }
      } catch (err: any) {
        showError(err.message || 'Error loading user data')
        router.replace('/admin/users')
      } finally {
        setLoadingUser(false)
      }
    }

    loadUserData()
  }, [isNew, userId, user, showError, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setBusy(true)

      // Validate phone
      const digits = getUnformattedPhone(phoneNumber)
      const countryConfig = COUNTRY_CODES.find(c => c.code === phoneCountry)
      if (countryConfig && digits.length !== countryConfig.length) {
        showError(`El número de teléfono debe tener ${countryConfig.length} dígitos para ${countryConfig.name}.`)
        return
      }

      const phone = `${phoneCountry}${digits}`.trim()

      const s = await supabase.auth.getSession()
      const token = (s as any).data?.session?.access_token ?? null

      const selectedRole = roles.find(r => r.id === roleId)
      if (!selectedRole) {
        showError('Debe seleccionar un rol')
        return
      }

      const payload: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone,
        roleName: selectedRole.name
      }

      if (isNew) {
        // Create new user
        if (!email || !password) {
          showError('Email y contraseña son requeridos')
          return
        }

        if (password.length < 6) {
          showError('La contraseña debe tener al menos 6 caracteres')
          return
        }

        payload.email = email.trim()
        payload.password = password

        const res = await fetch('/api/admin/secure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'create-user', ...payload })
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Error creating user')

        success('Usuario creado correctamente')
      } else {
        // Update existing user
        payload.userId = userId

        const res = await fetch('/api/admin/secure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'update-user', ...payload })
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Error updating user')

        success('Usuario actualizado correctamente')
      }

      router.push('/admin/users')
    } catch (err: any) {
      showError(err.message || 'Error processing form')
    } finally {
      setBusy(false)
    }
  }

  if (loading || loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!canManage) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium text-sm">
            Acceso restringido. Solo administradores pueden gestionar usuarios.
          </p>
        </div>
      </div>
    )
  }

  return (
    <RequireRoleClient allow={["superadmin", "admin"]}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/admin/users')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver a Usuarios</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isNew ? 'Crear Usuario' : 'Editar Usuario'}
            </h1>
            {!isNew && userData && (
              <p className="text-gray-600 mt-1">
                {userData.first_name} {userData.last_name}
              </p>
            )}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                      placeholder="Nombre"
                      required
                      disabled={busy}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                    placeholder="Apellido"
                    required
                    disabled={busy}
                  />
                </div>
              </div>

              {/* Email (only for new users) */}
              {isNew && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                      placeholder="usuario@ejemplo.com"
                      required
                      disabled={busy}
                    />
                  </div>
                </div>
              )}

              {/* Password (only for new users) */}
              {isNew && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pr-10 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      disabled={busy}
                    >
                      {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                </div>
              )}

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <PhoneInput
                  phoneCountry={phoneCountry}
                  phoneNumber={phoneNumber}
                  onCountryChange={setPhoneCountry}
                  onNumberChange={setPhoneNumber}
                  required
                  placeholder="1234567890"
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </span>
                  <select
                    id="role"
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent appearance-none"
                    required
                    disabled={busy}
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/admin/users')}
                  disabled={busy}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full sm:w-auto px-6 py-3 bg-brand-accent text-white rounded-lg hover:bg-brand-accentDark disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {busy ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isNew ? 'Crear Usuario' : 'Guardar Cambios'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </RequireRoleClient>
  )
}
