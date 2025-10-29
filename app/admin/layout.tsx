'use client'

import { usePathname } from 'next/navigation'
import Header from '../components/Header'
import Sidebar from '../components/navigation/Sidebar'
import MainContent from '../components/MainContent'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Si estamos en la página de login, renderizar solo los children sin layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-surface-secondary overflow-x-hidden">
      <Header showNavigation={true} />
      <Sidebar />
      <MainContent>
        {children}
      </MainContent>
    </div>
  )
}
