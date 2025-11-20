"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../providers/AuthProvider'
import { useSafeRouter } from '../../lib/useSafeRouter'
import { RequireRoleClient } from '../components/RequireRole'
import { Users, Shield, TrendingUp, Activity, UserCheck, UserX, Clock, ChevronRight, Download, Calendar, BarChart2, Briefcase, CheckCircle2, XCircle } from 'lucide-react'
import { PieChart, Pie, Cell, Legend } from 'recharts'
import { format as formatDate, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { downloadCSV, downloadExcel, downloadJSON, formatUsersForExport, formatRolesForExport } from '@/lib/exportUtils'
import { PieChartComponent } from '@/app/components/charts/PieChartComponent'
import { BarChartComponent } from '@/app/components/charts/BarChartComponent'
import { LineChartComponent } from '@/app/components/charts/LineChartComponent'
import { KPICard } from '@/app/components/KPICard'
import { RequisitionStatus } from '@/lib/types/requisitions'
import { useToast } from '@/lib/useToast'

type ProfileRow = { id: string, first_name?: string, last_name?: string, is_active?: boolean, roles?: any, created_at?: string }
type RoleRow = { id: string, name: string, permissions?: any }

// Constants moved outside component to avoid dependency issues
const COLORS = ['#FF1556', '#00253F', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9']

const statusColors: Record<RequisitionStatus, string> = {
  draft: '#94a3b8',
  submitted: '#3b82f6',
  in_review: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  cancelled: '#6b7280',
  filled: '#8b5cf6',
}

const statusLabels: Record<RequisitionStatus, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  in_review: 'En Revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  filled: 'Cubierta',
}

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
  const [requisitionData, setRequisitionData] = useState<{ total: number; processed: number; byStatus: Record<string, number>; recent: { id: string; status: string; created_at?: string }[] }>({
    total: 0,
    processed: 0,
    byStatus: {},
    recent: []
  })
  const [requisitionsList, setRequisitionsList] = useState<{ id: string; status: RequisitionStatus; created_at?: string }[]>([])

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
    } else if (roleName === 'candidate') {
      router.replace('/dashboard/candidate')
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
        console.warn('Timeout de verificación de sesión alcanzado (25s), redirigiendo a /admin')
        router.replace('/admin?reason=session-check-timeout')
      }
    }, 25000)
    return () => clearTimeout(timeoutId)
  }, [loading, router])

  // Redirigir al login si no hay usuario autenticado
  useEffect(() => {
    if (!loading && (!user || !profile)) {
      console.debug('Dashboard: No hay usuario autenticado, redirigiendo a /admin (login admin)')
      router.replace('/admin?reason=unauthenticated')
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

      // Mapa de roles por id para asignación cuando falte el objeto roles
      const rolesMap = roles.reduce<Record<string, string>>((acc, r) => {
        acc[r.id] = r.name
        return acc
      }, {})

      // Normalizar usuarios: garantizar created_at y rol
      const normalizedUsers = users.map(u => {
        let roleName: string | undefined
        if (Array.isArray(u.roles)) roleName = u.roles[0]?.name
        else if (u.roles && typeof u.roles === 'object') roleName = (u.roles as any)?.name
        else if ((u as any).role_id && rolesMap[(u as any).role_id]) roleName = rolesMap[(u as any).role_id]
        return {
          ...u,
          roles: roleName ? { name: roleName } : null,
          // No inventar fecha actual si falta: usar updated_at si existe o dejar null para excluir del gráfico
          created_at: u.created_at || (u as any).updated_at || null
        }
      })

      // Guardar usuarios normalizados para tendencia
      setAllUsers(normalizedUsers)

      const filteredUsers = filterUsersByDateRange(normalizedUsers, dateRange)

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
        const roleName = (u as any)?.roles?.name || (Array.isArray(u.roles) ? u.roles[0]?.name : null)
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

      // ----------------------------------------------------
      // Requisiciones (solicitudes) - filtradas por rango de fecha
      // ----------------------------------------------------
      // Nota: Usamos el cliente autenticado (admin/superadmin) para obtener todas las requisiciones.
      const { data: allRequisitions, error: reqError } = await supabase
        .from('requisitions')
        .select('id, status, created_at')
        .order('created_at', { ascending: false })

      if (reqError) {
        console.error('Error obteniendo requisiciones:', reqError)
      } else {
        // Filtrar por rango de fechas
        const reqs = (allRequisitions || []) as { id: string; status: RequisitionStatus; created_at?: string }[]
        const filteredReqs = filterRequisitionsByDateRange(reqs, dateRange)

        // Conteo por estado
        const byStatus: Record<string, number> = {}
        filteredReqs.forEach(r => {
          byStatus[r.status] = (byStatus[r.status] || 0) + 1
        })

  // En proceso: enviadas + en revisión (no cuenta aprobadas/rechazadas/canceladas/draft)
  const processed = filteredReqs.filter(r => r.status === 'submitted' || r.status === 'in_review').length

        // Requisiciones recientes (últimas 5)
        const recent = filteredReqs.slice(0, 5)

        setRequisitionData({
          total: filteredReqs.length,
            processed,
            byStatus,
            recent
        })
        setRequisitionsList(reqs)
      }
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

  // Filtrar requisiciones por rango de fechas
  const filterRequisitionsByDateRange = (reqs: { id: string; status: RequisitionStatus; created_at?: string }[], range: '7days' | '30days' | 'all') => {
    if (range === 'all') return reqs
    const now = new Date()
    const daysAgo = range === '7days' ? 7 : 30
    const startDate = startOfDay(subDays(now, daysAgo))
    const endDate = endOfDay(now)
    return reqs.filter(r => {
      if (!r.created_at) return false
      try {
        const d = parseISO(r.created_at)
        return isWithinInterval(d, { start: startDate, end: endDate })
      } catch {
        return false
      }
    })
  }

  // Datos para gráfico de tendencia (usuarios por día)
  const userTrendData = useMemo(() => {
    if (allUsers.length === 0) return []
    // Aplicar mismo filtro de rango a usuarios
    const usersInRange = filterUsersByDateRange(allUsers, dateRange)
    if (usersInRange.length === 0) return []

    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90
    const data: { date: string; usuarios: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const label = formatDate(date, 'dd/MMM', { locale: es })
      const count = usersInRange.filter(u => {
        if (!u.created_at) return false
        try {
          const d = parseISO(u.created_at)
          return formatDate(d, 'yyyy-MM-dd') === formatDate(date, 'yyyy-MM-dd')
        } catch {
          return false
        }
      }).length
      data.push({ date: label, usuarios: count })
    }
    return data
  }, [allUsers, dateRange])

  // Datos para gráfico de barras de estados de requisiciones
  const requisitionStatusChartData = useMemo(() => {
    const entries = Object.entries(requisitionData.byStatus)
    if (!entries.length) return []
    const total = requisitionData.total || 1
    return entries.map(([status, count]) => ({
      status,
      count,
      porcentaje: Math.round((count / total) * 100)
    }))
  }, [requisitionData])

  // Distribución (pie) por estado para usar el componente compartido
  const statusDistribution = useMemo(() => {
    const entries = Object.entries(requisitionData.byStatus) as [RequisitionStatus, number][]
    const data = entries.map(([status, value]) => ({
      name: statusLabels[status] || status,
      value,
      color: statusColors[status] || '#94a3b8'
    }))
    return data.filter(d => d.value > 0)
  }, [requisitionData])

  // Tendencia de requisiciones por día
  const requisitionTrendData = useMemo(() => {
    if (!requisitionsList || requisitionsList.length === 0) return []
    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90
    const data: { date: string; requisiciones: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const label = formatDate(date, 'dd/MMM', { locale: es })
      const count = requisitionsList.filter(r => {
        if (!r.created_at) return false
        try {
          const d = parseISO(r.created_at)
          return formatDate(d, 'yyyy-MM-dd') === formatDate(date, 'yyyy-MM-dd')
        } catch {
          return false
        }
      }).length
      data.push({ date: label, requisiciones: count })
    }
    return data
  }, [requisitionsList, dateRange])

  // Datos de barra por estado para el componente reutilizable
  const requisitionStatusBarData = useMemo(() => {
    return (Object.entries(requisitionData.byStatus) as [RequisitionStatus, number][]) 
      .map(([status, count]) => ({
        date: (statusLabels[status] || status).replace('_', ' '),
        requisiciones: count
      }))
  }, [requisitionData])

  // Distribución de roles para gráfico Pie (usuarios)
  const userRolesPieData = useMemo(() => {
    if (!stats.usersByRole || stats.usersByRole.length === 0) return []
    return stats.usersByRole.map((r, idx) => ({
      name: r.role || 'Sin rol',
      value: r.count,
      color: COLORS[idx % COLORS.length]
    }))
  }, [stats.usersByRole])

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
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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

      {/* KPI Cards - Usuarios */}
      <section aria-labelledby="kpis-usuarios">
        <h2 id="kpis-usuarios" className="sr-only">Indicadores de usuarios</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <KPICard
            title="Total Usuarios"
            value={stats.totalUsers}
            loading={loadingData}
            variant="dark"
            icon={<Users className="w-10 h-10" />}
            subtitle={<span className="flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> Registrados en el sistema</span>}
          />
          <KPICard
            title="Usuarios Activos"
            value={stats.activeUsers}
            loading={loadingData}
            variant="accent"
            icon={<UserCheck className="w-10 h-10" />}
            percentage={stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : null}
            subtitle={stats.totalUsers > 0 ? 'Porcentaje del total' : undefined}
          />
          <KPICard
            title="Usuarios Inactivos"
            value={stats.inactiveUsers}
            loading={loadingData}
            variant="warning"
            icon={<UserX className="w-10 h-10" />}
            subtitle={stats.inactiveUsers > 0 ? 'Requieren atención' : 'Excelente gestión'}
          />
          <KPICard
            title="Roles Configurados"
            value={stats.totalRoles}
            loading={loadingData}
            variant="dark"
            icon={<Shield className="w-10 h-10" />}
            subtitle="Sistema de permisos"
          />
        </div>
      </section>

      {/* KPI Cards - Requisiciones */}
      <section aria-labelledby="kpis-requisiciones">
        <h2 id="kpis-requisiciones" className="sr-only">Indicadores de requisiciones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
          <KPICard
            title="Total Requisiciones"
            value={requisitionData.total}
            loading={loadingData}
            variant="dark"
            icon={<Briefcase className="w-10 h-10" />}
            subtitle={<span className="flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> Solicitudes registradas</span>}
          />
          <KPICard
            title="En Proceso"
            value={requisitionData.processed}
            loading={loadingData}
            variant="accent"
            icon={<Activity className="w-10 h-10" />}
            percentage={(requisitionData.total - (requisitionData.byStatus['draft'] || 0)) > 0
              ? (requisitionData.processed / (requisitionData.total - (requisitionData.byStatus['draft'] || 0))) * 100
              : null}
            subtitle={(requisitionData.total - (requisitionData.byStatus['draft'] || 0)) > 0 ? 'Del total (sin borradores)' : undefined}
          />
          <KPICard
            title="Aprobadas"
            value={requisitionData.byStatus['approved'] || 0}
            loading={loadingData}
            variant="green"
            icon={<CheckCircle2 className="w-10 h-10" />}
            subtitle={(requisitionData.byStatus['approved'] || 0) > 0 ? 'Listas para cubrir' : 'Sin aprobaciones'}
          />
          <KPICard
            title="Rechazadas"
            value={requisitionData.byStatus['rejected'] || 0}
            loading={loadingData}
            variant="red"
            icon={<XCircle className="w-10 h-10" />}
            subtitle={(requisitionData.byStatus['rejected'] || 0) > 0 ? 'Revisar causas' : 'Sin rechazos'}
          />
          <KPICard
            title="Borrador"
            value={requisitionData.byStatus['draft'] || 0}
            loading={loadingData}
            variant="neutral"
            icon={<Clock className="w-10 h-10" />}
            subtitle={(requisitionData.byStatus['draft'] || 0) > 0 ? 'Por completar' : 'Sin borradores'}
          />
        </div>
      </section>
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

      {/* Gráficos de Requisiciones y Usuarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de Requisiciones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart2 className="w-5 h-5 mr-2 text-brand-accent" />
            Tendencia de Requisiciones
          </h2>
          <BarChartComponent data={requisitionTrendData} loading={loadingData} />
        </div>

        {/* Distribución por Estado de Requisiciones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-brand-accent" />
            Distribución por Estado
          </h2>
          <PieChartComponent data={statusDistribution} loading={loadingData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Tendencia de Usuarios (solo si hay usuarios) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-brand-accent" />
            Tendencia de Usuarios
          </h2>
          <LineChartComponent data={userTrendData.map(d => ({ date: d.date, value: d.usuarios }))} loading={loadingData} dataKey="value" labelKey="date" color="#FF1556" />
        </div>

        {/* Distribución por Roles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-brand-accent" />
            Distribución por Roles
          </h2>
          <PieChartComponent data={userRolesPieData} loading={loadingData} />
        </div>
      </div>

      {/* Estados de Requisiciones (Resumen detallado) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-brand-accent" />
          Estados de Requisiciones (Detalle)
        </h2>
        {loadingData ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : requisitionStatusBarData.length > 0 ? (
          <BarChartComponent data={requisitionStatusBarData} loading={false} />
        ) : (
          <p className="text-gray-500 text-center py-8">No hay datos de requisiciones para el período seleccionado</p>
        )}
        {!loadingData && requisitionStatusChartData.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {requisitionStatusChartData.map(item => (
              <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 capitalize">{item.status.replace('_', ' ')}</div>
                <div className="text-sm text-gray-600">{item.count} ({item.porcentaje}%)</div>
              </div>
            ))}
          </div>
        )}
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
