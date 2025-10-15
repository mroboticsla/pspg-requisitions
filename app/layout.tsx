import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from "@vercel/analytics/next"
import { Inter } from 'next/font/google'
import './globals.css'
import Header from './components/Header'
import Sidebar from './components/navigation/Sidebar'
import { AuthProvider } from './providers/AuthProvider'
import { ToastProvider } from '@/lib/useToast'
import ToastContainer from './components/ToastContainer'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PSPG Requisiciones',
  description: 'Plataforma interna para la gestión y aprobación de requisiciones de nuevo personal para PSP Group',
  icons: {
    icon: [
      '/favicon.ico',
      '/images/favicon.png',
    ],
    shortcut: '/favicon.ico',
    apple: '/images/favicon.png',
  },
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
          <ToastProvider>
            <div className="min-h-screen bg-surface-secondary">
              <Header showNavigation={false} />
              <div className="flex">
                <Sidebar className="shrink-0" />
                <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 md:ml-0">
                  <div className="max-w-7xl mx-auto">
                    {children}
                  </div>
                </main>
              </div>
            </div>
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
        <SpeedInsights />
        <Analytics/>
      </body>
    </html>
  )
}
