import { redirect } from 'next/navigation'

export default function Page() {
  // Redirige la raíz a la pantalla de login
  redirect('/login')
}
