"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import { useToast } from '@/lib/useToast'
import { ArrowLeft, Save, User, Mail, Phone, Shield, Eye, EyeOff, KeyRound, Send, Lock } from 'lucide-react'
import PhoneInput, { getUnformattedPhone, COUNTRY_CODES, composePhoneCountryValue, parsePhoneCountryValue, getCountryByValue, formatPhoneNumber } from '@/app/components/PhoneInput'
import ConfirmModal from '@/app/components/ConfirmModal'

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

const ADMIN_ROLES = ['superadmin', 'admin']

export default function AdminUserFormPage() {
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
  const [currentEmail, setCurrentEmail] = useState('') // Store original email
  const [phoneCountry, setPhoneCountry] = useState(() => composePhoneCountryValue('MX', '+52'))
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Password management states
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false)
  const [showTempPasswordModal, setShowTempPasswordModal] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [showTempPassword, setShowTempPassword] = useState(false)

  const isSuper = (profile as any)?.roles?.name === 'superadmin'

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.replace('/auth')
    }
  }, [loading, user, profile, router])

  // Load roles
  useEffect(() => {
    if (!user || !isSuper) return

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
        const adminRoles = allRoles.filter((r: RoleOption) => ADMIN_ROLES.includes(r.name))
        setRoles(adminRoles)
        
        // Set default role for new users
        if (isNew && adminRoles.length > 0) {
          setRoleId(adminRoles.find((r: RoleOption) => r.name === 'admin')?.id || adminRoles[0].id)
        }
      } catch (err: any) {
        showError(err.message || 'Error loading roles')
      }
    }

    loadRoles()
  }, [user, isSuper, isNew, showError])

  // Load user data if editing
  useEffect(() => {
    if (isNew || !userId || !user) return

    const loadUserData = async () => {
      try {
        setLoadingUser(true)
        const s = await supabase.auth.getSession()
        const token = (s as any).data?.session?.access_token ?? null

        // Load profile data
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
          router.replace('/admin/administrators')
          return
        }

        setUserData(foundUser)

        // Populate form fields
        setFirstName(foundUser.first_name || '')
        setLastName(foundUser.last_name || '')
        setRoleId(foundUser.role_id || '')

        // Load email separately
        const emailRes = await fetch('/api/admin/secure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'get-user-email', userId })
        })
        const emailBody = await emailRes.json()
        if (emailRes.ok && emailBody.data?.email) {
          setEmail(emailBody.data.email)
          setCurrentEmail(emailBody.data.email)
        }

        // Parse phone
        if (foundUser.phone) {
          const matchedCountry = COUNTRY_CODES.find(c => foundUser.phone?.startsWith(c.code))
          if (matchedCountry) {
            const countryValue = composePhoneCountryValue(matchedCountry.country, matchedCountry.code)
            setPhoneCountry(countryValue)
            const numberDigits = foundUser.phone.slice(matchedCountry.code.length)
            setPhoneNumber(formatPhoneNumber(numberDigits, countryValue))
          } else {
            setPhoneNumber(foundUser.phone)
          }
        }
      } catch (err: any) {
        showError(err.message || 'Error loading user data')
        router.replace('/admin/administrators')
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
      const countryConfig = getCountryByValue(phoneCountry)
      if (countryConfig && digits.length !== countryConfig.length) {
        showError(`El número de teléfono debe tener ${countryConfig.length} dígitos para ${countryConfig.name}.`)
        return
      }

      const { dialCode } = parsePhoneCountryValue(phoneCountry)
      const phonePrefix = dialCode || phoneCountry
      const phone = `${phonePrefix}${digits}`.trim()

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
        if (!res.ok) throw new Error(body.error || 'Error creating administrator')

        success('Administrador creado correctamente')
      } else {
        // Update existing user
        payload.userId = userId

        // Update profile
        const res = await fetch('/api/admin/secure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'update-user', ...payload })
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Error updating administrator')

        // Update email if changed
        if (email.trim() !== currentEmail) {
          const emailRes = await fetch('/api/admin/secure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action: 'update-user-email', userId, email: email.trim() })
          })
          const emailBody = await emailRes.json()
          if (!emailRes.ok) throw new Error(emailBody.error || 'Error updating email')
        }

        success('Administrador actualizado correctamente')
      }

      router.push('/admin/administrators')
    } catch (err: any) {
      showError(err.message || 'Error processing form')
    } finally {
      setBusy(false)
    }
  }

  const handleSendPasswordReset = async () => {
    if (!email) {
      showError('No hay correo electrónico registrado')
      return
    }

    try {
      setBusy(true)
      const s = await supabase.auth.getSession()
      const token = (s as any).data?.session?.access_token ?? null

      const res = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'send-password-reset', email })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Error sending password reset')

      success('Se ha enviado un correo electrónico de recuperación de contraseña')
      setShowPasswordResetModal(false)
    } catch (err: any) {
      showError(err.message || 'Error sending password reset')
    } finally {
      setBusy(false)
    }
  }

  const handleSetTempPassword = async () => {
    if (!tempPassword) {
      showError('Debe ingresar una contraseña temporal')
      return
    }

    if (tempPassword.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      setBusy(true)
      const s = await supabase.auth.getSession()
      const token = (s as any).data?.session?.access_token ?? null

      const res = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'set-temporary-password', userId, password: tempPassword })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Error setting temporary password')

      success('Contraseña temporal establecida correctamente')
      setShowTempPasswordModal(false)
      setTempPassword('')
    } catch (err: any) {
      showError(err.message || 'Error setting temporary password')
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

  if (!isSuper) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium text-sm">
            Acceso restringido. Solo superadministradores pueden gestionar administradores.
          </p>
        </div>
      </div>
    )
  }

  return (
    <RequireRoleClient allow={["superadmin"]}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/admin/administrators')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver a Administradores</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isNew ? 'Crear Administrador' : 'Editar Administrador'}
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
                      placeholder="admin@ejemplo.com"
                      required
                      disabled={busy}
                    />
                  </div>
                </div>
              )}

              {/* Email (editable for existing users) */}
              {!isNew && (
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
                      placeholder="admin@ejemplo.com"
                      required
                      disabled={busy}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    El correo electrónico puede ser modificado. Se confirmará automáticamente.
                  </p>
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
                  Rol Administrativo *
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
                        {role.name === 'superadmin' ? 'Superadministrador' : 'Administrador'}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Superadministrador: acceso total al sistema. Administrador: gestión general.
                </p>
              </div>

              {/* Password Management (only for existing users) */}
              {!isNew && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <KeyRound className="w-5 h-5 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Gestión de Contraseña</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Puede enviar un correo de recuperación o establecer una contraseña temporal para este usuario.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordResetModal(true)}
                      disabled={busy || !email}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      <Send className="w-4 h-4" />
                      Enviar Recuperación de Contraseña
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTempPasswordModal(true)}
                      disabled={busy}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      <Lock className="w-4 h-4" />
                      Establecer Contraseña Temporal
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/admin/administrators')}
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
                      {isNew ? 'Crear Administrador' : 'Guardar Cambios'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Password Reset Modal */}
        <ConfirmModal
          isOpen={showPasswordResetModal}
          onCancel={() => setShowPasswordResetModal(false)}
          onConfirm={handleSendPasswordReset}
          title="Enviar Recuperación de Contraseña"
          message={`Se enviará un correo electrónico de recuperación de contraseña a ${email}. El usuario podrá establecer una nueva contraseña siguiendo las instrucciones del correo.`}
          confirmText="Enviar Correo"
          type="warning"
        />

        {/* Temporary Password Modal */}
        <ConfirmModal
          isOpen={showTempPasswordModal}
          onCancel={() => {
            setShowTempPasswordModal(false)
            setTempPassword('')
            setShowTempPassword(false)
          }}
          onConfirm={handleSetTempPassword}
          title="Establecer Contraseña Temporal"
          message={
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Establezca una contraseña temporal para este usuario. Asegúrese de comunicar esta contraseña de forma segura al usuario.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Temporal *
                </label>
                <div className="relative">
                  <input
                    type={showTempPassword ? "text" : "password"}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full pr-10 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTempPassword(!showTempPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showTempPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>
            </div>
          }
          confirmText="Establecer Contraseña"
          type="warning"
        />
      </div>
    </RequireRoleClient>
  )
}
