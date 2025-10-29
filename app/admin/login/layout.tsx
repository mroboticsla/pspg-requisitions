import type { Metadata } from 'next'

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
  return <>{children}</>
}
