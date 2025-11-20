"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useLayoutEffect } from 'react'
import { Pin, PinOff } from 'lucide-react'
import { MENU, filterMenu, filterMenuByModules, Role, MenuItem } from './menuConfig'
import getCurrentUserRole from '@/lib/getCurrentUserRole'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabaseClient'

type SidebarProps = {
  className?: string
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname()
  const { user, loading: authLoading, profile } = useAuth() as any
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoverExpand, setHoverExpand] = useState(false)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [submittedRequisitionsCount, setSubmittedRequisitionsCount] = useState(0)

  // Detectar rutas de autenticación
  const AUTH_PREFIXES = ['/auth', '/login', '/register', '/forgot-password', '/change-password']
  const isAuthRoute = AUTH_PREFIXES.some(p => pathname?.startsWith(p))

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) setCollapsed(saved === '1')
  }, [])

  // Escucha el evento emitido por el Header para abrir/cerrar el menú móvil
  useEffect(() => {
    const handler = () => setMobileOpen(prev => !prev)
    window.addEventListener('sidebar:toggle', handler)
    return () => window.removeEventListener('sidebar:toggle', handler)
  }, [])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    // Solo continuar si hay usuario; mantener orden de hooks constante
    if (!user?.id) {
      if (mounted) {
        setRole(null)
        setLoading(false)
      }
    } else {
      getCurrentUserRole()
        .then(r => { if (mounted) setRole(r) })
        .finally(() => { if (mounted) setLoading(false) })
    }
    return () => { mounted = false }
  }, [user?.id])

  // Cargar conteo de mensajes no leídos
  useEffect(() => {
    if (!user?.id) return

    const fetchCounts = async () => {
      // Contact Requests (Nuevos)
      const { count: contactCount, error: contactError } = await supabase
        .from('contact_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
      
      if (!contactError && contactCount !== null) {
        setUnreadMessagesCount(contactCount)
      }

      // Requisitions (Enviadas)
      const { count: reqCount, error: reqError } = await supabase
        .from('requisitions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted')
      
      if (!reqError && reqCount !== null) {
        setSubmittedRequisitionsCount(reqCount)
      }
    }

    fetchCounts()

    // Suscripción realtime para actualizar el badge
    const channel = supabase
      .channel('sidebar_badges')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_requests' },
        () => fetchCounts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requisitions' },
        () => fetchCounts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  // Establecer el ancho del sidebar basado en el estado de collapsed y la presencia del usuario
  // Usamos useLayoutEffect para que se ejecute sincrónicamente antes del paint
  useLayoutEffect(() => {
    let sidebarWidth = '0px'
    let sidebarMargin = '0px'
    
    if (isAuthRoute || authLoading || !user?.id) {
      // No mostrar sidebar: ancho 0
      sidebarWidth = '0px'
      sidebarMargin = '0px'
    } else {
      // Mostrar sidebar: establecer ancho según estado collapsed
      sidebarWidth = collapsed ? '64px' : '256px'
      // El margen solo aplica en desktop (≥768px)
      const isDesktop = window.matchMedia('(min-width: 768px)').matches
      sidebarMargin = isDesktop ? sidebarWidth : '0px'
    }
    
    document.documentElement.style.setProperty('--sidebar-w', sidebarWidth)
    document.documentElement.style.setProperty('--sidebar-w-ml', sidebarMargin)
    
    // Emitir evento para notificar el cambio
    window.dispatchEvent(new Event('sidebar:changed'))
    
    // Escuchar cambios de media query para actualizar el margen
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const handleMediaChange = () => {
      if (!isAuthRoute && !authLoading && user?.id) {
        const width = collapsed ? '64px' : '256px'
        const margin = mediaQuery.matches ? width : '0px'
        document.documentElement.style.setProperty('--sidebar-w-ml', margin)
      }
    }
    mediaQuery.addEventListener('change', handleMediaChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [user?.id, collapsed, authLoading, isAuthRoute])

  // No renderizar en pantallas de autenticación o cuando no hay usuario
  if (isAuthRoute || authLoading || !user) return null

  const itemsByRole = filterMenu(MENU, role)
  // Si el rol trae permissions.modules, usamos ese mapa para mostrar/ocultar módulos del sidebar
  const items = (() => {
    const modules = (profile?.roles?.permissions?.modules ?? null) as Record<string, boolean> | null
    const canDo = (profile?.roles?.permissions?.can_do ?? null) as string[] | null
    return filterMenuByModules(itemsByRole, modules, canDo)
  })()
  const expanded = !collapsed || hoverExpand

  // Función para adaptar el path según el rol del usuario
  const adaptPath = (path: string, itemId: string): string => {
    // Si es el item de perfil y el usuario es candidato, redirigir a /candidate/profile
    if (itemId === 'profile' && role === 'candidate') {
      return '/candidate/profile';
    }
    return path;
  };

  const Nav = (
    <nav className="space-y-1 overflow-hidden">
      {items.map(item => (
        <div key={item.id}>
          {item.path ? (
            <SideLink 
              href={adaptPath(item.path, item.id)} 
              active={pathname?.startsWith(adaptPath(item.path, item.id))} 
              collapsed={!expanded} 
              title={item.label} 
              icon={item.icon}
              badge={item.id === 'contact-requests' ? unreadMessagesCount : (item.id === 'req-mine' ? submittedRequisitionsCount : undefined)}
            >
              {item.label}
            </SideLink>
          ) : (
            expanded ? (
              <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500`}>
                {item.label}
              </div>
            ) : null
          )}
          {item.children && item.children.length > 0 && (
            expanded ? (
              <div className={`ml-2 space-y-1`}>
                {item.children.map(ch => (
                  <SideLink 
                    key={ch.id} 
                    href={adaptPath(ch.path!, ch.id)} 
                    active={pathname === adaptPath(ch.path!, ch.id)} 
                    collapsed={false} 
                    title={ch.label} 
                    icon={ch.icon}
                    badge={ch.id === 'contact-requests' ? unreadMessagesCount : (ch.id === 'req-mine' ? submittedRequisitionsCount : undefined)}
                  >
                    {ch.label}
                  </SideLink>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {item.children.map(ch => (
                  <SideLink 
                    key={ch.id} 
                    href={adaptPath(ch.path!, ch.id)} 
                    active={pathname === adaptPath(ch.path!, ch.id)} 
                    collapsed={true} 
                    title={ch.label} 
                    icon={ch.icon}
                    badge={ch.id === 'contact-requests' ? unreadMessagesCount : (ch.id === 'req-mine' ? submittedRequisitionsCount : undefined)}
                  >
                    {ch.label}
                  </SideLink>
                ))}
              </div>
            )
          )}
        </div>
      ))}
    </nav>
  )

  if (loading) {
    return (
      <aside
        className={`hidden md:block fixed left-0 bg-white/95 backdrop-blur border-r border-gray-200 ${collapsed ? 'w-16' : 'w-64'} transition-all duration-200`}
        style={{ 
          top: 'var(--header-h, 64px)',
          height: 'calc(100dvh - var(--header-h, 64px))'
        }}
      >
        <div className="p-3 text-gray-500 text-sm">Cargando…</div>
      </aside>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-r border-gray-200 ${expanded ? 'w-64' : 'w-16'} transition-all duration-200 overflow-hidden`}
        style={{ 
          top: 'var(--header-h, 64px)',
          height: 'calc(100dvh - var(--header-h, 64px))'
        }}
        onMouseEnter={() => setHoverExpand(true)}
        onMouseLeave={() => setHoverExpand(false)}
      >
        <div className="flex items-center justify-between h-12 px-3 border-b border-gray-100">
          <span className={`text-sm font-semibold text-gray-700 ${expanded ? 'block' : 'hidden'}`}>Navegación</span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label={collapsed ? 'Fijar sidebar' : 'Desfijar sidebar'}
            title={collapsed ? 'Fijar sidebar' : 'Desfijar sidebar'}
          >
            {collapsed ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {Nav}
        </div>
      </aside>

      {/* El disparador móvil vive en el Header; aquí sólo renderizamos el drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl p-3">
            <div className="flex items-center justify-between h-12 px-1 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Navegación</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded hover:bg-gray-100">✕</button>
            </div>
            <div className="mt-2">
              {Nav}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SideLink({ href, children, active, collapsed, title, icon: Icon, badge }: { href: string, children: React.ReactNode, active?: boolean, collapsed: boolean, title?: string, icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>, badge?: number }) {
  return (
    <Link
      href={href}
      title={collapsed ? title : undefined}
      className={
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors relative ${
          active ? 'bg-brand-accent/10 text-brand-dark' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      <div className="relative flex items-center justify-center">
        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
        {collapsed && badge !== undefined && badge > 0 && (
           <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
             {badge > 99 ? '99+' : badge}
           </span>
        )}
      </div>
      {!collapsed && (
        <div className="flex flex-1 items-center justify-between truncate w-full">
          <span>{children}</span>
          {badge !== undefined && badge > 0 && (
            <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
