import { redirect } from 'next/navigation'

export default function Page() {
  // Redirige la raíz directamente a la pantalla de autenticación
  redirect('/auth')
}
