"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../providers/AuthProvider'
import { useSafeRouter } from '../../lib/useSafeRouter'
import { RequireRoleClient } from '../components/RequireRole'
import { Users, Shield, TrendingUp, Activity, UserCheck, UserX, Clock, ChevronRight, Download, Calendar, BarChart2 } from 'lucide-react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format as formatDate, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { downloadCSV, downloadExcel, downloadJSON, formatUsersForExport, formatRolesForExport } from '@/lib/exportUtils'
import { useToast } from '@/lib/useToast'

type ProfileRow = { id: string, first_name?: string, last_name?: string, is_active?: boolean, roles?: any, created_at?: string }
type RoleRow = { id: string, name: string, permissions?: any }

type DashboardStats = {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  totalRoles: number
  recentUsers: ProfileRow[]
  usersByRole: { role: string; count: number }[]
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const { success, error: showErrorToast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalRoles: 0,
    recentUsers: [],
    usersByRole: []
  })
  const [allUsers, setAllUsers] = useState<ProfileRow[]>([])
  const [allRoles, setAllRoles] = useState<RoleRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'all'>('30days')
  const [showExportMenu, setShowExportMenu] = useState(false)

  const allowed = useMemo(() => {
    const roleName = (profile as any)?.roles?.name
    return ['admin', 'superadmin'].includes(roleName)
  }, [profile])

  const isSuperAdmin = useMemo(() => {
    return (profile as any)?.roles?.name === 'superadmin'
  }, [profile])

  // Redirigir a partners si el usuario es partner
  useEffect(() => {
    if (loading || !profile) return
    const roleName = (profile as any)?.roles?.name
    if (roleName === 'partner') {
      router.replace('/dashboard/partner')
    }
  }, [loading, profile, router])

  // Cerrar menú de exportación al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showExportMenu && !target.closest('.export-menu-container')) {
        setShowExportMenu(false)
      }
    }

    if (showExportMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showExportMenu])

  // Timeout de seguridad
  useEffect(() => {
    if (!loading) return
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Timeout de verificación de sesión alcanzado (25s), redirigiendo al login')
        router.replace('/auth')
      }
    }, 25000)
    return () => clearTimeout(timeoutId)
  }, [loading, router])

  // Redirigir al login si no hay usuario autenticado
  useEffect(() => {
    if (!loading && (!user || !profile)) {
      console.debug('Dashboard: No hay usuario autenticado, redirigiendo al login')
      router.replace('/auth')
    }
  }, [loading, user, profile, router])

  const fetchDashboardData = useCallback(async () => {
    setLoadingData(true)
    setError(null)
    try {
      const s = await supabase.auth.getSession()
      const token = (s as any).data?.session?.access_token ?? null

      // Obtener usuarios
      const resUsers = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list-users' })
      })
      const bodyUsers = await resUsers.json()
      if (!resUsers.ok) throw new Error(bodyUsers.error || 'Failed fetching users')
      const users: ProfileRow[] = bodyUsers.data || []
      setAllUsers(users)

      // Obtener roles
      const resRoles = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list-roles' })
      })
      const bodyRoles = await resRoles.json()
      if (!resRoles.ok) throw new Error(bodyRoles.error || 'Failed fetching roles')
      const roles: RoleRow[] = bodyRoles.data || []
      setAllRoles(roles)

      // Filtrar usuarios por rango de fechas
      const filteredUsers = filterUsersByDateRange(users, dateRange)

      // Calcular estadísticas
      const activeUsers = filteredUsers.filter(u => u.is_active !== false).length
      const inactiveUsers = filteredUsers.filter(u => u.is_active === false).length

      // Usuarios recientes (últimos 5)
      const sortedUsers = [...filteredUsers].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
      const recentUsers = sortedUsers.slice(0, 5)

      // Usuarios por rol
      const roleCount = filteredUsers.reduce((acc, u) => {
        const roleName = Array.isArray(u.roles) ? u.roles[0]?.name : u.roles?.name
        const role = roleName || 'Sin rol'
        acc[role] = (acc[role] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const usersByRole = Object.entries(roleCount).map(([role, count]) => ({
        role,
        count
      })).sort((a, b) => b.count - a.count)

      setStats({
        totalUsers: filteredUsers.length,
        activeUsers,
        inactiveUsers,
        totalRoles: roles.length,
        recentUsers,
        usersByRole
      })
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoadingData(false)
    }
  }, [dateRange])

  // Función para filtrar usuarios por rango de fechas
  const filterUsersByDateRange = (users: ProfileRow[], range: '7days' | '30days' | 'all'): ProfileRow[] => {
    if (range === 'all') return users

    const now = new Date()
    const daysAgo = range === '7days' ? 7 : 30
    const startDate = startOfDay(subDays(now, daysAgo))
    const endDate = endOfDay(now)

    return users.filter(user => {
      if (!user.created_at) return false
      try {
        const userDate = parseISO(user.created_at)
        return isWithinInterval(userDate, { start: startDate, end: endDate })
      } catch {
        return false
      }
    })
  }

  // Datos para gráfico de tendencia (usuarios por día)
  const userTrendData = useMemo(() => {
    if (allUsers.length === 0) return []

    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90
    const data = []

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = formatDate(date, 'dd/MMM', { locale: es })
      
      const usersOnDay = allUsers.filter(user => {
        if (!user.created_at) return false
        try {
          const userDate = parseISO(user.created_at)
          return formatDate(userDate, 'yyyy-MM-dd') === formatDate(date, 'yyyy-MM-dd')
        } catch {
          return false
        }
      }).length

      data.push({
        date: dateStr,
        usuarios: usersOnDay
      })
    }

    return data
  }, [allUsers, dateRange])

  // Colores para el gráfico de pastel - Usando paleta de marca
  const COLORS = ['#FF1556', '#00253F', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9']

  // Funciones de exportación
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    try {
      const timestamp = formatDate(new Date(), 'yyyyMMdd-HHmmss', { locale: es })
      const filename = `usuarios_${timestamp}`

      if (format === 'csv') {
        const formattedData = formatUsersForExport(allUsers)
        downloadCSV(formattedData, filename)
        success('Datos exportados a CSV correctamente')
      } else if (format === 'excel') {
        const formattedData = formatUsersForExport(allUsers)
        downloadExcel(formattedData, filename)
        success('Datos exportados a Excel correctamente')
      } else if (format === 'json') {
        downloadJSON({ users: allUsers, roles: allRoles, exportDate: new Date().toISOString() }, filename)
        success('Datos exportados a JSON correctamente')
      }

      setShowExportMenu(false)
    } catch (err: any) {
      showErrorToast(`Error al exportar: ${err.message}`)
    }
  }

  useEffect(() => {
    if (loading) return
    if (!user || !profile) return
    if (!allowed) return
    fetchDashboardData()
  }, [user, profile, loading, allowed, fetchDashboardData])

  // Mostrar loading mientras se verifica la sesión
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Verificando sesión...</p>
      </div>
    </div>
  )

  // Si no hay usuario, mostrar loading mientras redirige
  if (!user || !profile) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  )

  if (!allowed) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <p className="text-red-600">Acceso restringido. No tiene permisos suficientes.</p>
      </div>
    </div>
  )

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Panel de control y estadísticas del sistema</p>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-brand-accent animate-pulse" />
          <span className="text-sm text-gray-600">Sistema activo</span>
        </div>
      </div>

      {/* Controles: Filtros y Exportación */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Filtro de Fecha */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Período:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDateRange('7days')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  dateRange === '7days' ? 'bg-white text-brand-dark shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                7 días
              </button>
              <button
                onClick={() => setDateRange('30days')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  dateRange === '30days' ? 'bg-white text-brand-dark shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                30 días
              </button>
              <button
                onClick={() => setDateRange('all')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  dateRange === 'all' ? 'bg-white text-brand-dark shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todo
              </button>
            </div>
          </div>

          {/* Botón de Exportación */}
          <div className="relative export-menu-container">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center space-x-2 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-dark transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Exportar Datos</span>
            </button>

            {/* Menú de exportación */}
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <span>📄</span>
                    <span>Exportar a CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <span>📊</span>
                    <span>Exportar a Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <span>💾</span>
                    <span>Exportar a JSON</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Usuarios */}
        <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">Total Usuarios</p>
              <p className="text-3xl font-bold mt-2">
                {loadingData ? '...' : stats.totalUsers}
              </p>
            </div>
            <Users className="w-12 h-12 text-gray-200 opacity-80" />
          </div>
          <div className="mt-4 flex items-center text-gray-100 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            Registrados en el sistema
          </div>
        </div>

        {/* Usuarios Activos */}
        <div className="bg-gradient-to-br from-brand-accent to-brand-accentDark rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Usuarios Activos</p>
              <p className="text-3xl font-bold mt-2">
                {loadingData ? '...' : stats.activeUsers}
              </p>
            </div>
            <UserCheck className="w-12 h-12 text-pink-100 opacity-80" />
          </div>
          <div className="mt-4 flex items-center text-pink-100 text-sm">
            {!loadingData && stats.totalUsers > 0 && (
              <>
                <span className="font-semibold">{Math.round((stats.activeUsers / stats.totalUsers) * 100)}%</span>
                <span className="ml-1">del total</span>
              </>
            )}
          </div>
        </div>

        {/* Usuarios Inactivos */}
        <div className="bg-gradient-to-br from-neutral-400 to-neutral-500 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">Usuarios Inactivos</p>
              <p className="text-3xl font-bold mt-2">
                {loadingData ? '...' : stats.inactiveUsers}
              </p>
            </div>
            <UserX className="w-12 h-12 text-gray-200 opacity-80" />
          </div>
          <div className="mt-4 flex items-center text-gray-100 text-sm">
            {stats.inactiveUsers > 0 && 'Requieren atención'}
            {stats.inactiveUsers === 0 && 'Excelente gestión'}
          </div>
        </div>

        {/* Total Roles */}
        <div className="bg-gradient-to-br from-neutral-600 to-neutral-700 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">Roles Configurados</p>
              <p className="text-3xl font-bold mt-2">
                {loadingData ? '...' : stats.totalRoles}
              </p>
            </div>
            <Shield className="w-12 h-12 text-gray-200 opacity-80" />
          </div>
          <div className="mt-4 flex items-center text-gray-100 text-sm">
            Sistema de permisos
          </div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-brand-accent" />
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/users"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-accent hover:bg-brand-accent/5 transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-dark/10 rounded-lg flex items-center justify-center group-hover:bg-brand-dark/20 transition-colors">
                <Users className="w-5 h-5 text-brand-dark" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Gestionar Usuarios</p>
                <p className="text-sm text-gray-600">Ver y administrar usuarios</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-accent transition-colors" />
          </Link>

          {isSuperAdmin && (
            <Link
              href="/admin/roles"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-accent hover:bg-brand-accent/5 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-accent/10 rounded-lg flex items-center justify-center group-hover:bg-brand-accent/20 transition-colors">
                  <Shield className="w-5 h-5 text-brand-accent" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Gestionar Roles</p>
                  <p className="text-sm text-gray-600">Configurar permisos y roles</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-accent transition-colors" />
            </Link>
          )}
        </div>
      </div>

      {/* Gráficos Avanzados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Tendencia de Usuarios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart2 className="w-5 h-5 mr-2 text-brand-accent" />
            Tendencia de Registros
          </h2>
          {loadingData ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : userTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="usuarios" stroke="#FF1556" strokeWidth={2} dot={{ fill: '#FF1556', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-16">No hay datos suficientes para el período seleccionado</p>
          )}
        </div>

        {/* Gráfico de Pastel - Distribución por Roles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-brand-accent" />
            Distribución de Roles
          </h2>
          {loadingData ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : stats.usersByRole.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.usersByRole}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.role}: ${entry.count} (${(entry.percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.usersByRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-16">No hay datos disponibles</p>
          )}
        </div>
      </div>

      {/* Grid de estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usuarios Recientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-brand-accent" />
              Usuarios Recientes
            </h2>
            <Link href="/admin/users" className="text-sm text-brand-accent hover:underline">
              Ver todos
            </Link>
          </div>
          {loadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : stats.recentUsers.length > 0 ? (
            <div className="space-y-3">
              {stats.recentUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {Array.isArray(user.roles) ? user.roles[0]?.name : user.roles?.name || 'Sin rol'}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {user.is_active !== false ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-300">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay usuarios registrados</p>
          )}
        </div>

        {/* Distribución por Roles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-brand-accent" />
            Distribución por Roles
          </h2>
          {loadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : stats.usersByRole.length > 0 ? (
            <div className="space-y-4">
              {stats.usersByRole.map((item, index) => {
                const percentage = stats.totalUsers > 0 ? (item.count / stats.totalUsers) * 100 : 0
                const colors = [
                  'bg-brand-accent',
                  'bg-brand-dark',
                  'bg-neutral-500',
                  'bg-neutral-400',
                  'bg-neutral-600'
                ]
                const color = colors[index % colors.length]
                
                return (
                  <div key={item.role}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">{item.role}</span>
                      <span className="text-sm text-gray-600">{item.count} usuario{item.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
          )}
        </div>
      </div>

      {/* Alertas y Notificaciones Importantes */}
      {stats.inactiveUsers > 0 && (
        <div className="bg-neutral-50 border border-neutral-300 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <UserX className="w-5 h-5 text-neutral-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-neutral-800 font-semibold">
                ⚠️ {stats.inactiveUsers} usuario{stats.inactiveUsers !== 1 ? 's' : ''} inactivo{stats.inactiveUsers !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-neutral-700 mt-1">
                Hay usuarios marcados como inactivos. Revisa si necesitan reactivación o eliminación.
              </p>
            </div>
            <Link href="/admin/users" className="text-sm text-brand-accent hover:underline font-medium">
              Ver usuarios
            </Link>
          </div>
        </div>
      )}

      {/* Información del sistema */}
      <div className="bg-brand-dark/5 border border-brand-dark/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Activity className="w-5 h-5 text-brand-dark mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-brand-dark font-semibold">💡 Sistema de Administración PSP Group</p>
            <p className="text-xs text-gray-700 mt-1">
              Panel actualizado en tiempo real. Usa los filtros de fecha para analizar tendencias. Los datos pueden exportarse en CSV, Excel o JSON.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <RequireRoleClient allow={['admin', 'superadmin']} fallback={<div className="p-6 text-red-600">Acceso restringido. No tiene permisos suficientes.</div>}>
      {content}
    </RequireRoleClient>
  )
}
