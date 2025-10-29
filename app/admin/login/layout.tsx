import type { Metadata } from 'next'
import { PublicNavbar } from '@/app/components/public/layout/PublicNavbar'
import { PublicFooter } from '@/app/components/public/layout/PublicFooter'

export const metadata: Metadata = {
  title: 'Acceso Administrativo | PSP Group',
  description: 'Panel de acceso administrativo - Área restringida',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
