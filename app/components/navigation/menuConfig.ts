import type React from 'react'
import { LayoutDashboard, FilePlus2, CheckSquare, ListChecks, BarChart3, Users, Shield, User as UserIcon } from 'lucide-react'

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
    id: 'requisitions', label: 'Requisiciones', roles: ['superadmin', 'admin', 'partner'], children: [
      { id: 'req-new', label: 'Nueva', path: '/requisitions/new', roles: ['partner'], icon: FilePlus2 },
      { id: 'req-approve', label: 'Aprobar', path: '/requisitions/approve', roles: ['superadmin', 'admin'], icon: CheckSquare },
      { id: 'req-mine', label: 'Mis requisiciones', path: '/requisitions/mine', roles: ['partner', 'candidate'], icon: ListChecks },
    ]
  },
  { id: 'reports', label: 'Reportes', path: '/reports', roles: ['superadmin','admin'], icon: BarChart3 },
  { id: 'admin', label: 'Administración', path: '/admin', roles: ['superadmin','admin'], children: [
    { id: 'administrators', label: 'Administradores', path: '/admin/administrators', roles: ['superadmin'], icon: Shield },
    { id: 'partners', label: 'Asociados', path: '/admin/partners', roles: ['superadmin', 'admin'], icon: Users },
    { id: 'users', label: 'Usuarios', path: '/admin/users', roles: ['superadmin', 'admin'], icon: Users },
    { id: 'roles', label: 'Roles', path: '/admin/roles', roles: ['superadmin'], icon: Shield },
  ]},
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
