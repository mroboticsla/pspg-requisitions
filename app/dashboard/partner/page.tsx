"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'
import { RequireRoleClient } from '@/app/components/RequireRole'
import { listRequisitions } from '@/lib/requisitions'
import type { Requisition, RequisitionStatus } from '@/lib/types/requisitions'
import { 
  FileText, 
  Plus, 
  TrendingUp, 
  Activity, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ChevronRight, 
  Calendar,
  Users,
  Eye,
  AlertCircle,
  Briefcase
} from 'lucide-react'
import { format as formatDate, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { useToast } from '@/lib/useToast'
import { PieChartComponent } from '@/app/components/charts/PieChartComponent'
import { BarChartComponent } from '@/app/components/charts/BarChartComponent'

type DashboardStats = {
  total: number
  draft: number
  submitted: number
  in_review: number
  approved: number
  rejected: number
  cancelled: number
  filled: number
  recentRequisitions: Requisition[]
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

const statusColors: Record<RequisitionStatus, string> = {
  draft: '#94a3b8',
  submitted: '#3b82f6',
  in_review: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  cancelled: '#6b7280',
  filled: '#8b5cf6',
}

export default function PartnerDashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const { error: toastError } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    draft: 0,
    submitted: 0,
    in_review: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    filled: 0,
    recentRequisitions: []
  })
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'all'>('30days')

  const allowed = useMemo(() => {
    const roleName = (profile as any)?.roles?.name
    return ['partner', 'admin', 'superadmin'].includes(roleName)
  }, [profile])

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
      console.debug('Dashboard Partner: No hay usuario autenticado, redirigiendo al login')
      router.replace('/auth')
    }
  }, [loading, user, profile, router])

  const fetchDashboardData = useCallback(async () => {
    if (!profile?.id) return

    setLoadingData(true)
    setError(null)
    try {
      // Obtener todas las requisiciones del usuario
      const requisitionsData = await listRequisitions({ created_by: profile.id })
      setRequisitions(requisitionsData)

      // Filtrar por rango de fechas
      const filteredReqs = filterRequisitionsByDateRange(requisitionsData, dateRange)

      // Calcular estadísticas
      const draft = filteredReqs.filter(r => r.status === 'draft').length
      const submitted = filteredReqs.filter(r => r.status === 'submitted').length
      const in_review = filteredReqs.filter(r => r.status === 'in_review').length
      const approved = filteredReqs.filter(r => r.status === 'approved').length
      const rejected = filteredReqs.filter(r => r.status === 'rejected').length
      const cancelled = filteredReqs.filter(r => r.status === 'cancelled').length
      const filled = filteredReqs.filter(r => r.status === 'filled').length

      // Requisiciones recientes (últimas 5)
      const sortedReqs = [...filteredReqs].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
      const recentRequisitions = sortedReqs.slice(0, 5)

      setStats({
        total: filteredReqs.length,
        draft,
        submitted,
        in_review,
        approved,
        rejected,
        cancelled,
        filled,
        recentRequisitions
      })
    } catch (err: any) {
      const errorMsg = err.message || String(err)
      setError(errorMsg)
      toastError(err?.message || 'Error al cargar las estadísticas del dashboard')
      console.error('Error fetching requisitions:', err)
    } finally {
      setLoadingData(false)
    }
  }, [profile?.id, dateRange, toastError])

  // Función para filtrar requisiciones por rango de fechas
  const filterRequisitionsByDateRange = (reqs: Requisition[], range: '7days' | '30days' | 'all'): Requisition[] => {
    if (range === 'all') return reqs

    const now = new Date()
    const daysAgo = range === '7days' ? 7 : 30
    const startDate = startOfDay(subDays(now, daysAgo))
    const endDate = endOfDay(now)

    return reqs.filter(req => {
      if (!req.created_at) return false
      try {
        const reqDate = parseISO(req.created_at)
        return isWithinInterval(reqDate, { start: startDate, end: endDate })
      } catch {
        return false
      }
    })
  }

  // Datos para gráfico de pastel (distribución por estado)
  const statusDistribution = useMemo(() => {
    const data = [
      { name: 'Borradores', value: stats.draft, color: statusColors.draft },
      { name: 'Enviadas', value: stats.submitted, color: statusColors.submitted },
      { name: 'En Revisión', value: stats.in_review, color: statusColors.in_review },
      { name: 'Aprobadas', value: stats.approved, color: statusColors.approved },
      { name: 'Rechazadas', value: stats.rejected, color: statusColors.rejected },
      { name: 'Canceladas', value: stats.cancelled, color: statusColors.cancelled },
      { name: 'Cubiertas', value: stats.filled, color: statusColors.filled },
    ]
    const filtered = data.filter(item => item.value > 0)
    console.log('📊 Datos del gráfico de distribución:', filtered)
    return filtered
  }, [stats])

  // Datos para gráfico de tendencia (requisiciones por día)
  const requisitionTrendData = useMemo(() => {
    if (!requisitions || requisitions.length === 0) {
      console.log('📈 No hay requisiciones para el gráfico de tendencia')
      return []
    }

    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90
    const data = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i)
      const dateStr = formatDate(date, 'dd/MMM', { locale: es })
      
      const reqsOnDay = requisitions.filter(req => {
        if (!req.created_at) return false
        try {
          const reqDate = parseISO(req.created_at)
          return formatDate(reqDate, 'yyyy-MM-dd') === formatDate(date, 'yyyy-MM-dd')
        } catch (error) {
          console.error('Error parsing date:', req.created_at, error)
          return false
        }
      }).length

      data.push({
        date: dateStr,
        requisiciones: reqsOnDay
      })
    }

    console.log('📈 Datos del gráfico de tendencia:', data.slice(0, 5), '... (total:', data.length, 'puntos)')
    return data
  }, [requisitions, dateRange])

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Dashboard</h1>
          <p className="text-gray-600 mt-1">Panel de control de mis requisiciones</p>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-brand-accent animate-pulse" />
          <span className="text-sm text-gray-600">Sistema activo</span>
        </div>
      </div>

      {/* Controles: Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requisiciones */}
        <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-sm font-medium">Total Requisiciones</p>
              <p className="text-3xl font-bold mt-2">
                {loadingData ? '...' : stats.total}
              </p>
            </div>
            <FileText className="w-12 h-12 text-white/80" />
          </div>
          <div className="mt-4 flex items-center text-white/90 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            Creadas en el período
          </div>
        </div>

        {/* En Proceso */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-sm font-medium">En Proceso</p>
              <p className="text-3xl font-bold mt-2">
                {loadingData ? '...' : (stats.submitted + stats.in_review)}
              </p>
            </div>
            <Clock className="w-12 h-12 text-white/80" />
          </div>
          <div className="mt-4 flex items-center text-white/90 text-sm">
            Enviadas y en revisión
          </div>
        </div>

        {/* Aprobadas */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-sm font-medium">Aprobadas</p>
              <p className="text-3xl font-bold mt-2">
                {loadingData ? '...' : stats.approved}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-white/80" />
          </div>
          <div className="mt-4 flex items-center text-white/90 text-sm">
            {!loadingData && stats.total > 0 && (
              <>
                <span className="font-semibold">{Math.round((stats.approved / stats.total) * 100)}%</span>
                <span className="ml-1">del total</span>
              </>
            )}
          </div>
        </div>

        {/* Borradores */}
        <div className="bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-sm font-medium">Borradores</p>
              <p className="text-3xl font-bold mt-2">
                {loadingData ? '...' : stats.draft}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-white/80" />
          </div>
          <div className="mt-4 flex items-center text-white/90 text-sm">
            {stats.draft > 0 ? 'Por completar' : 'Todo enviado'}
          </div>
        </div>
      </div>

      {/* Acceso Rápido a Crear Requisición */}
      <div className="bg-gradient-to-r from-brand-accent to-brand-accentDark rounded-lg shadow-md p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">¿Necesitas contratar personal?</h2>
            <p className="text-pink-100 mt-1 text-sm">Crea una nueva requisición en pocos minutos</p>
          </div>
          <Link
            href="/request"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-brand-accent rounded-lg hover:bg-pink-50 transition-colors font-semibold shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Requisición</span>
          </Link>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Distribución por Estado */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-brand-accent" />
            Distribución por Estado
          </h2>
          {statusDistribution.length > 0 ? (
            <PieChartComponent data={statusDistribution} loading={loadingData} />
          ) : (
            <div className="text-center py-16">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay datos disponibles</p>
              <p className="text-sm text-gray-400 mt-1">Crea tu primera requisición para ver estadísticas</p>
            </div>
          )}
        </div>

        {/* Gráfico de Tendencia */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-brand-accent" />
            Tendencia de Creación
          </h2>
          {requisitionTrendData.length > 0 ? (
            <BarChartComponent data={requisitionTrendData} loading={loadingData} />
          ) : (
            <div className="text-center py-16">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay datos suficientes para el período seleccionado</p>
              <p className="text-sm text-gray-400 mt-1">Crea más requisiciones para ver tendencias</p>
            </div>
          )}
        </div>
      </div>

      {/* Resumen de Estados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-brand-accent" />
          Resumen de Estados
        </h2>
        {loadingData ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { key: 'draft', label: 'Borradores', count: stats.draft, icon: FileText, color: 'text-neutral-600', bg: 'bg-neutral-100' },
              { key: 'submitted', label: 'Enviadas', count: stats.submitted, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
              { key: 'in_review', label: 'En Revisión', count: stats.in_review, icon: Eye, color: 'text-yellow-600', bg: 'bg-yellow-100' },
              { key: 'approved', label: 'Aprobadas', count: stats.approved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
              { key: 'rejected', label: 'Rechazadas', count: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
              { key: 'cancelled', label: 'Canceladas', count: stats.cancelled, icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100' },
              { key: 'filled', label: 'Cubiertas', count: stats.filled, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
            ].map(({ key, label, count, icon: Icon, color, bg }) => (
              <div key={key} className={`${bg} rounded-lg p-4 text-center`}>
                <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-600 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Requisiciones Recientes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-brand-accent" />
            Requisiciones Recientes
          </h2>
          <Link href="/requisitions" className="text-sm text-brand-accent hover:underline font-medium">
            Ver todas
          </Link>
        </div>
        {loadingData ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : stats.recentRequisitions.length > 0 ? (
          <div className="space-y-3">
            {stats.recentRequisitions.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {req.puesto_requerido || 'Sin especificar'}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                    {req.departamento && <span>{req.departamento}</span>}
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {req.numero_vacantes || 0} vacantes
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(new Date(req.created_at), 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium`}
                    style={{
                      backgroundColor: `${statusColors[req.status]}15`,
                      color: statusColors[req.status]
                    }}
                  >
                    {statusLabels[req.status]}
                  </span>
                  <Link
                    href={`/requisitions/${req.id}`}
                    className="p-2 rounded bg-brand-accent text-white hover:bg-brand-accentDark transition-colors"
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No has creado requisiciones aún</p>
            <Link
              href="/request"
              className="inline-block mt-4 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accentDark transition-colors text-sm"
            >
              Crear mi primera requisición
            </Link>
          </div>
        )}
      </div>

      {/* Alertas */}
      {stats.draft > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-semibold">
                📝 Tienes {stats.draft} borrador{stats.draft !== 1 ? 'es' : ''} pendiente{stats.draft !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Completa y envía tus borradores para que puedan ser procesados.
              </p>
            </div>
            <Link href="/requisitions" className="text-sm text-yellow-700 hover:underline font-medium">
              Ver borradores
            </Link>
          </div>
        </div>
      )}

      {/* Información útil */}
      <div className="bg-brand-dark/5 border border-brand-dark/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Activity className="w-5 h-5 text-brand-dark mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-brand-dark font-semibold">💡 Dashboard de Partner</p>
            <p className="text-xs text-gray-700 mt-1">
              Panel actualizado en tiempo real con tus requisiciones. Utiliza los filtros de período para analizar tendencias históricas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <RequireRoleClient 
      allow={['partner', 'admin', 'superadmin']} 
      fallback={
        <div className="p-6 text-red-600">
          Acceso restringido. No tiene permisos suficientes.
        </div>
      }
    >
      {content}
    </RequireRoleClient>
  )
}
