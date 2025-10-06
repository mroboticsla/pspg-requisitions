"use client"

import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneCountry, setPhoneCountry] = useState('+52')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      // Normalizar y validar teléfono
      const digits = phoneNumber.replace(/\D/g, '')
      // Reglas simples: +52 (MX) y +1 (US) requieren 10 dígitos
      if ((phoneCountry === '+52' || phoneCountry === '+1') && digits.length !== 10) {
        setMessage('El número de teléfono debe tener 10 dígitos para el código seleccionado.')
        setLoading(false)
        return
      }

      const phone = `${phoneCountry}${digits}`.trim()
      const userMetadata = { first_name: firstName, last_name: lastName, phone }

      // Incluir metadata en el signUp para que aparezca en user.user_metadata
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: userMetadata } })
      if (error) throw error

      // Crear perfil mínimo en backend para que use la service role key y asigne role
      const userId = (data?.user as any)?.id || (data as any)?.id
      if (userId) {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 7000) // 7s timeout

          const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, first_name: firstName, last_name: lastName, phone }),
            signal: controller.signal
          })
          clearTimeout(timeout)

          const resJson = await res.json()
          if (!res.ok) {
            console.error('Profile creation failed', resJson)
            const errorMsg = resJson.error || 'Error desconocido al crear el perfil'
            throw new Error(`Error al crear perfil: ${errorMsg}. Detalles: ${JSON.stringify(resJson.details || {})}`)
          }
          
          console.log('Profile created successfully', resJson)
        } catch (e: any) {
          if (e.name === 'AbortError') {
            console.error('Profile creation request aborted (timeout)')
            throw new Error('La creación del perfil tardó demasiado. Por favor, intenta nuevamente o contacta a soporte.')
          } else {
            console.error('Failed to create profile via API', e)
            throw new Error(e.message || 'No se pudo crear el perfil automáticamente. Por favor contacta a soporte.')
          }
        }
      } else {
        throw new Error('No se pudo obtener el ID del usuario creado')
      }

      setMessage('Revisa tu correo para verificar tu cuenta (si aplica).')
      setTimeout(() => router.push('/login'), 1500)
    } catch (err: any) {
      setMessage(err.message || 'Error en el registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-surface-secondary">
      <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-8">
          <div className="bg-surface-primary p-8 rounded-xl shadow-lg border border-neutral-200">
            <div className="text-center mb-8">
              <div className="h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                <img src="/images/logo-web-dark.png" alt="PSP logo" className="h-10 rounded-lg object-cover" />
              </div>
              <h2 className="text-xl font-bold text-neutral-800 mb-2">Registro de Candidatos</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-neutral-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                    placeholder="Nombre"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-neutral-700 mb-2">Apellido</label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                    placeholder="Apellido"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">Correo Electrónico</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                  </span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Teléfono</label>
                <div className="flex items-stretch border border-neutral-300 rounded-lg overflow-hidden bg-surface-secondary focus-within:ring-2 focus-within:ring-brand-accent">
                  <select
                    value={phoneCountry}
                    onChange={e => setPhoneCountry(e.target.value)}
                    className="px-3 py-3 bg-surface-secondary text-brand-dark border-none outline-none"
                    aria-label="Código de país"
                  >
                    <option value="+52">MX +52</option>
                    <option value="+1">US +1</option>
                  </select>

                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="1234567890"
                    className="flex-1 px-4 py-3 bg-surface-secondary text-brand-dark border-none focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">Contraseña</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                  </span>

                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                    placeholder="••••••••"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-700 focus:outline-none"
                  >
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {message && (
                <p className="text-sm text-neutral-700 mb-2">{message}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all duration-200 transform ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-dark hover:bg-brand-accent'} `}
              >
                {loading ? 'Creando...' : 'Crear cuenta'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-neutral-500">© 2025 PSP Group. Todos los derechos reservados.</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-neutral-600">
              ¿Ya tienes una cuenta? <a href="/login" className="font-medium text-brand-accent hover:text-brand-dark transition-colors">Inicia sesión</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
