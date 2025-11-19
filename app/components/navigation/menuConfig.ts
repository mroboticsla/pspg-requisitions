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
}

export const MENU: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', roles: ['superadmin', 'admin', 'partner'], icon: LayoutDashboard },
  { id: 'contact-requests', label: 'Buzón Web', path: '/admin/contact-requests', roles: ['superadmin', 'admin'], icon: Inbox },
  {
    id: 'jobs',
    label: 'Empleos',
    roles: ['superadmin', 'admin'],
    children: [
      { id: 'job-ads', label: 'Gestión de Anuncios', path: '/admin/job-ads', roles: ['superadmin', 'admin'], icon: Megaphone },
    ]
  },
  {
    id: 'requisitions', 
    label: 'Requisiciones', 
    roles: ['superadmin', 'admin', 'partner'], 
    children: [
      { id: 'req-new', label: 'Crear Solicitud', path: '/request', roles: ['superadmin', 'admin', 'partner'], icon: FilePlus2 },
      { id: 'req-mine', label: 'Solicitudes', path: '/requisitions', roles: ['superadmin', 'admin', 'partner'], icon: ListChecks },
      { id: 'templates', label: 'Plantillas', path: '/admin/templates', roles: ['superadmin', 'admin'], icon: FileText },
    ]
  },
  { id: 'reports', 
    label: 'Reportes', 
    roles: ['superadmin','admin'], children: [
      { id: 'req-reports', label: 'Reportes de Requisiciones', path: '/admin/requisitions', roles: ['superadmin','admin'], icon: BarChart3 },
    ] 
  },
  { 
    id: 'customers', 
    label: 'Clientes', 
    roles: ['superadmin','admin'], 
    children: [
      { id: 'companies', label: 'Empresas', path: '/admin/companies', roles: ['superadmin', 'admin'], icon: Building2 },
      { id: 'partners', label: 'Contactos', path: '/admin/partners', roles: ['superadmin', 'admin'], icon: Users },
    ]
  },
  { id: 'candidates', 
    label: 'Candidatos', 
    roles: ['superadmin','admin'], children: [
      { id: 'users', label: 'Listado de Candidatos', path: '/admin/users', roles: ['superadmin', 'admin'], icon: UserIcon },
    ] 
  },
  {   
    id: 'access', 
    label: 'Administración de Acceso', 
    roles: ['superadmin'], 
    children: [
      { id: 'administrators', label: 'Administradores', path: '/admin/administrators', roles: ['superadmin'], icon: Shield },
      { id: 'roles', label: 'Roles', path: '/admin/roles', roles: ['superadmin'], icon: Shield },
      { id: 'security', label: 'Monitor de Seguridad', path: '/admin/security', roles: ['superadmin'], icon: Shield },
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
