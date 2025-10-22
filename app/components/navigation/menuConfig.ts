import type React from 'react'
import { LayoutDashboard, FilePlus2, CheckSquare, ListChecks, BarChart3, Users, Shield, User as UserIcon, Building2, FileText, Settings } from 'lucide-react'

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
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', roles: ['superadmin', 'admin'], icon: LayoutDashboard },
  {
    id: 'requisitions', 
    label: 'Requisiciones', 
    roles: ['superadmin', 'admin', 'partner'], 
    children: [
      { id: 'req-new', label: 'Crear Requisición', path: '/request', roles: ['superadmin', 'admin', 'partner'], icon: FilePlus2 },
      { id: 'req-mine', label: 'Mis Requisiciones', path: '/requisitions', roles: ['superadmin', 'admin', 'partner'], icon: ListChecks },
    ]
  },
  { id: 'reports', label: 'Reportes', path: '/reports', roles: ['superadmin','admin'], icon: BarChart3 },
  { 
    id: 'admin', 
    label: 'Administración', 
    roles: ['superadmin','admin'], 
    children: [
      { id: 'companies', label: 'Empresas', path: '/admin/companies', roles: ['superadmin', 'admin'], icon: Building2 },
      { id: 'partners', label: 'Asociados', path: '/admin/partners', roles: ['superadmin', 'admin'], icon: Users },
      { id: 'users', label: 'Usuarios', path: '/admin/users', roles: ['superadmin', 'admin'], icon: UserIcon },
      { id: 'templates', label: 'Plantillas de Requisiciones', path: '/admin/templates', roles: ['superadmin', 'admin'], icon: FileText },
      { id: 'req-admin', label: 'Gestión de Requisiciones', path: '/admin/requisitions', roles: ['superadmin', 'admin'], icon: CheckSquare },
    ]
  },
  { 
    id: 'access', 
    label: 'Acceso', 
    roles: ['superadmin'], 
    children: [
      { id: 'administrators', label: 'Administradores', path: '/admin/administrators', roles: ['superadmin'], icon: Shield },
      { id: 'roles', label: 'Roles', path: '/admin/roles', roles: ['superadmin'], icon: Shield },
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
