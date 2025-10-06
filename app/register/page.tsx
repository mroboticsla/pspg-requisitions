"use client"

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      // Crear perfil mínimo en public.profiles; la DB (trigger) puede asignar role por defecto
      const userId = (data?.user as any)?.id || (data as any)?.id
      if (userId) {
        await supabase.from('profiles').insert({ id: userId, is_active: true })
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
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Crear cuenta</h2>
      {message && <p className="mb-2 text-sm text-neutral-700">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 bg-surface-primary p-6 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Correo</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="form-input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="form-input" />
        </div>
        <button disabled={loading} className={`w-full py-2 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-brand-dark hover:bg-brand-accent'}`}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  )
}
