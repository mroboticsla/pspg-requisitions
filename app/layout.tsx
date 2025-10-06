import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from './components/Header'
import { AuthProvider } from './providers/AuthProvider'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PSPG Requisiciones',
  description: 'Plataforma interna para la gestión y aprobación de requisiciones de nuevo personal para PSP Group',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // `RootLayout` se ejecuta en el servidor. La lógica de ruta/estado del cliente
  // se maneja dentro de `Header` (componente cliente).

  return (
    <html lang="es">
      <body className={`${inter.className} text-brand-dark`}>
        <AuthProvider>
          <div className="min-h-screen bg-surface-secondary">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
