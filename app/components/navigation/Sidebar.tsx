"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MENU, filterMenu, Role, MenuItem } from './menuConfig'
import getCurrentUserRole from '@/lib/getCurrentUserRole'
import { useAuth } from '../../providers/AuthProvider'

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

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  // No renderizar en pantallas de autenticación o cuando no hay usuario
  if (isAuthRoute || authLoading || !user) return null

  const itemsByRole = filterMenu(MENU, role)
  // Si el rol trae permissions.modules, usamos ese mapa para mostrar/ocultar módulos del sidebar
  const items = (() => {
    const modules = (profile?.roles?.permissions?.modules ?? null) as Record<string, boolean> | null
    if (!modules || typeof modules !== 'object') return itemsByRole
    const allow = (id: string) => Boolean(modules[id])
    const topLevelFiltered: MenuItem[] = []
    for (const it of itemsByRole) {
      // Si el ítem no tiene restricción por módulos (id ausente), lo mantenemos
      if (!it.id) { topLevelFiltered.push(it); continue }
      // Solo mostramos si el módulo está permitido en permissions.modules
      if (allow(it.id)) topLevelFiltered.push(it)
    }
    return topLevelFiltered
  })()
  const expanded = !collapsed || hoverExpand

  const Nav = (
    <nav className="space-y-1 overflow-hidden">
      {items.map(item => (
        <div key={item.id}>
          {item.path ? (
            <SideLink href={item.path} active={pathname?.startsWith(item.path)} collapsed={!expanded} title={item.label} icon={item.icon}>
              {item.label}
            </SideLink>
          ) : (
            expanded ? (
              <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500`}>
                {item.label}
              </div>
            ) : null
          )}
          {item.children && item.children.length > 0 && expanded && (
            <div className={`ml-2 space-y-1`}>
              {item.children.map(ch => (
                <SideLink key={ch.id} href={ch.path!} active={pathname === ch.path} collapsed={false} title={ch.label} icon={ch.icon}>
                  {ch.label}
                </SideLink>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )

  if (loading) {
    return (
      <aside
        className={`hidden md:block bg-white/95 backdrop-blur border-r border-gray-200 ${collapsed ? 'w-16' : 'w-64'} transition-all duration-200 ${className}`}
      >
        <div className="p-3 text-gray-500 text-sm">Cargando…</div>
      </aside>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-r border-gray-200 ${expanded ? 'w-64' : 'w-16'} transition-all duration-200 ${className} overflow-hidden h-full`}
        onMouseEnter={() => setHoverExpand(true)}
        onMouseLeave={() => setHoverExpand(false)}
      >
        <div className="flex items-center justify-between h-12 px-3 border-b border-gray-100">
          <span className={`text-sm font-semibold text-gray-700 ${expanded ? 'block' : 'hidden'}`}>Navegación</span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 text-xs"
            aria-label="Alternar sidebar"
            title={expanded ? 'Colapsar sidebar' : 'Expandir sidebar'}
          >
            {expanded ? '«' : '»'}
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

function SideLink({ href, children, active, collapsed, title, icon: Icon }: { href: string, children: React.ReactNode, active?: boolean, collapsed: boolean, title?: string, icon?: React.ComponentType<React.SVGProps<SVGSVGElement>> }) {
  return (
    <Link
      href={href}
      title={collapsed ? title : undefined}
      className={
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
          active ? 'bg-brand-accent/10 text-brand-dark' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
      {!collapsed && <span className="truncate">{children}</span>}
    </Link>
  )
}
