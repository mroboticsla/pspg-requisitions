"use client"

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` })
      if (error) throw error
      setMessage('Se envió un correo con instrucciones para restablecer la contraseña.')
    } catch (err: any) {
      setMessage(err.message || 'Error al solicitar recuperación de contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Recuperar contraseña</h2>
      {message && <p className="mb-2 text-sm text-neutral-700">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 bg-surface-primary p-6 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Correo</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="form-input" />
        </div>
        <button disabled={loading} className={`w-full py-2 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-brand-dark hover:bg-brand-accent'}`}>
          {loading ? 'Enviando...' : 'Enviar instrucciones'}
        </button>
      </form>
    </div>
  )
}
