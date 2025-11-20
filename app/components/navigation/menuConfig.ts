import type React from 'react'
import { LayoutDashboard, FilePlus2, CheckSquare, ListChecks, BarChart3, Users, Shield, User as UserIcon, Building2, FileText, Settings, Inbox, Megaphone } from 'lucide-react'

export type Role = 'superadmin' | 'admin' | 'partner' | 'candidate'

export type MenuItem = {
  id: string
  label: string
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  path?: string
  roles?: Role[]
  children?: MenuItem[]
  permission?: string
}

export const MENU: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', roles: ['superadmin', 'admin', 'partner', 'candidate'], icon: LayoutDashboard, permission: 'view_dashboard' },
  { id: 'contact-requests', label: 'Buzón Web', path: '/admin/contact-requests', roles: ['superadmin', 'admin'], icon: Inbox, permission: 'manage_contact_requests' },
  {
    id: 'jobs',
    label: 'Empleos',
    roles: ['superadmin', 'admin'],
    children: [
      { id: 'job-ads', label: 'Gestión de Anuncios', path: '/admin/job-ads', roles: ['superadmin', 'admin'], icon: Megaphone, permission: 'manage_job_ads' },
    ]
  },
  { 
    id: 'candidates', 
    roles: ['superadmin','admin'], 
    label: 'Gestión de Candidatos', 
    children: [
      { id: 'candidates-admin', label: 'Gestión de Candidatos', path: '/admin/candidates', roles: ['superadmin', 'admin'], icon: Users, permission: 'manage_candidates' },
    ],
    icon: UserIcon 
  },
  {
    id: 'requisitions', 
    label: 'Requisiciones', 
    roles: ['superadmin', 'admin', 'partner'], 
    children: [
      { id: 'req-new', label: 'Crear Solicitud', path: '/request', roles: ['superadmin', 'admin', 'partner'], icon: FilePlus2, permission: 'create_requisitions' },
      { id: 'req-mine', label: 'Solicitudes', path: '/requisitions', roles: ['superadmin', 'admin', 'partner'], icon: ListChecks, permission: 'view_requisitions' },
      { id: 'templates', label: 'Plantillas', path: '/admin/templates', roles: ['superadmin', 'admin'], icon: FileText, permission: 'manage_templates' },
    ]
  },
  { id: 'reports', 
    label: 'Reportes', 
    roles: ['superadmin','admin'], children: [
      { id: 'req-reports', label: 'Reportes de Requisiciones', path: '/admin/requisitions', roles: ['superadmin','admin'], icon: BarChart3, permission: 'view_reports' },
    ] 
  },
  { 
    id: 'customers', 
    label: 'Clientes', 
    roles: ['superadmin','admin'], 
    children: [
      { id: 'companies', label: 'Empresas', path: '/admin/companies', roles: ['superadmin', 'admin'], icon: Building2, permission: 'manage_companies' },
      { id: 'partners', label: 'Contactos', path: '/admin/partners', roles: ['superadmin', 'admin'], icon: Users, permission: 'manage_partners' },
    ]
  },
  {   
    id: 'access', 
    label: 'Administración de Acceso', 
    roles: ['superadmin'], 
    children: [
      { id: 'administrators', label: 'Administradores', path: '/admin/administrators', roles: ['superadmin'], icon: Shield, permission: 'manage_administrators' },
      { id: 'roles', label: 'Roles', path: '/admin/roles', roles: ['superadmin'], icon: Shield, permission: 'manage_roles' },
      { id: 'security', label: 'Monitor de Seguridad', path: '/admin/security', roles: ['superadmin'], icon: Shield, permission: 'view_security_logs' },
    ]
  },
  { id: 'profile', label: 'Mi perfil', path: '/profile', icon: UserIcon },
]

export function filterMenu(items: MenuItem[], role: Role | null): MenuItem[] {
  const ok = (it: MenuItem) => !it.roles || (role ? it.roles.includes(role) : false)
  const walk = (list: MenuItem[]): MenuItem[] =>
    list.map(it => {
      if (!ok(it)) return null as any
      const children = it.children ? walk(it.children) : undefined
      if (!it.path && (!children || children.length === 0)) return null as any
      return { ...it, children }
    }).filter(Boolean) as MenuItem[]
  return walk(items)
}

export function filterMenuByModules(items: MenuItem[], modules: Record<string, boolean> | null, canDo: string[] | null = null): MenuItem[] {
  if (!modules || typeof modules !== 'object') return items

  const walk = (list: MenuItem[], isRoot: boolean): MenuItem[] => {
    return list.map((item): MenuItem | null => {
      // 1. Verificar si el nodo actual está permitido por configuración de módulos
      let isAllowed = true
      if (item.id) {
        const config = modules[item.id]
        if (config !== undefined) {
          // Si existe configuración explícita (true/false), la respetamos
          isAllowed = config
        } else {
          // Si no existe configuración:
          // - Si es nivel raíz (menú principal), debe estar explícitamente habilitado (false por defecto)
          // - Si es hijo (submenú), se asume habilitado si el padre pasó (true por defecto)
          //   ya que la UI actual solo permite configurar nivel raíz
          isAllowed = !isRoot
        }
      }

      // 2. Verificar si el usuario tiene el permiso requerido (si existe)
      if (isAllowed && item.permission && canDo) {
        if (!canDo.includes(item.permission)) {
          isAllowed = false
        }
      }

      if (!isAllowed) return null

      // 3. Filtrar hijos recursivamente si existen
      const children = item.children ? walk(item.children, false) : undefined

      // 4. Si es un padre (sin path) y se quedó sin hijos tras el filtrado, eliminarlo
      // Esto evita carpetas vacías en el menú
      if (!item.path && (!children || children.length === 0)) {
        return null
      }

      // 5. Retornar nodo con la lista de hijos actualizada
      return { ...item, children }
    }).filter((n): n is MenuItem => n !== null)
  }

  return walk(items, true)
}
