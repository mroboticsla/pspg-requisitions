'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Megaphone, MapPin, Building2, Calendar, 
  Filter, FileText, Eye, CheckCircle, Archive, Clock, AlertCircle,
  Briefcase, ChevronLeft, ChevronRight, Users, BarChart3
} from 'lucide-react';
import { getJobAds, getJobAdStats } from '@/lib/jobAds';
import type { JobAd, JobAdStatus } from '@/lib/types/job-ads';
import { useToast } from '@/lib/useToast';
import { RequireRoleClient } from '@/app/components/RequireRole';
import { KPICard } from '@/app/components/KPICard';

const statusLabels: Record<JobAdStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
};

const statusColors: Record<JobAdStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-800',
};

export default function JobAdsPage() {
  const router = useRouter();
  const { error } = useToast();
  const [ads, setAds] = useState<JobAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobAdStatus | JobAdStatus[] | 'expiring_soon' | 'expired' | ''>('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const loadAds = useCallback(async () => {
    try {
      setLoading(true);
      
      let apiStatus: string | string[] | undefined = undefined;
      let apiExpiration: 'expiring_soon' | 'expired' | undefined = undefined;

      if (statusFilter === 'expiring_soon') {
        apiExpiration = 'expiring_soon';
      } else if (statusFilter === 'expired') {
        apiExpiration = 'expired';
      } else {
        apiStatus = statusFilter || undefined;
      }

      const { data, count } = await getJobAds({
        page,
        pageSize,
        search: searchTerm,
        status: apiStatus,
        expiration_status: apiExpiration
      });
      setAds(data);
      setTotalCount(count);
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, error]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      loadAds();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadAds]);

  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    expiringSoon: 0,
    expired: 0
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getJobAdStats();
        setStats(prev => ({
          ...prev,
          total: data.total,
          published: data.published,
          draft: data.draft,
          archived: data.archived,
          expiringSoon: data.expiringSoon,
          expired: data.expired
        }));
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    }
    loadStats();
  }, []);

  const quickFilters: { label: string; value: JobAdStatus | 'expiring_soon' | 'expired' | "" }[] = [
    { label: "Todos", value: "" },
    { label: "Publicados", value: "published" },
    { label: "Borradores", value: "draft" },
    { label: "Archivados", value: "archived" },
    { label: "Próximos a vencer", value: "expiring_soon" },
    { label: "Vencidos", value: "expired" },
  ];

  const totalPages = Math.ceil(totalCount / pageSize);

  const calculatePercentage = (value: number) => {
    if (stats.total === 0) return 0;
    return (value / stats.total) * 100;
  };

  const unpublishedCount = stats.draft + stats.archived;

  return (
    <RequireRoleClient permission="manage_job_ads" redirectTo="/admin/login">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Anuncios</h1>
            <p className="text-gray-600 mt-1">Administra las ofertas de empleo publicadas en el portal</p>
          </div>
          <button
            onClick={() => router.push('/admin/job-ads/new')}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-admin-accent text-white hover:bg-admin-accentHover transition-colors shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Anuncio</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total"
            subtitle="Mostrar todos los anuncios"
            value={stats.total}
            icon={<Briefcase className="w-6 h-6" />}
            variant="dark"
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className="cursor-pointer hover:ring-2 hover:ring-admin-accent/50 transition-all"
          />
          <KPICard
            title="Publicados"
            subtitle="Anuncios en curso"
            value={stats.published}
            percentage={calculatePercentage(stats.published)}
            icon={<CheckCircle className="w-6 h-6" />}
            variant="green"
            onClick={() => { setStatusFilter('published'); setPage(1); }}
            className="cursor-pointer hover:ring-2 hover:ring-green-500/50 transition-all"
          />
          <KPICard
            title="Sin Publicar"
            value={unpublishedCount}
            percentage={calculatePercentage(unpublishedCount)}
            subtitle="Borradores y Archivados"
            icon={<Archive className="w-6 h-6" />}
            variant="neutral"
            onClick={() => { setStatusFilter(['draft', 'archived']); setPage(1); }}
            className="cursor-pointer hover:ring-2 hover:ring-gray-500/50 transition-all"
          />
          <KPICard
            title="Por Vencer (7 días)"
            subtitle="Anuncios próximos a vencer"
            value={stats.expiringSoon}
            percentage={calculatePercentage(stats.expiringSoon)}
            icon={<Clock className="w-6 h-6" />}
            variant="warning"
            onClick={() => { setStatusFilter('expiring_soon'); setPage(1); }}
            className="cursor-pointer hover:ring-2 hover:ring-yellow-500/50 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtros</h3>
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setPage(1);
                }}
                className="ml-auto text-sm text-admin-accent hover:text-admin-accentHover transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {quickFilters.map((filter) => (
              <button
                key={filter.label}
                onClick={() => { setStatusFilter(filter.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === filter.value
                    ? "bg-admin-accent text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
             {/* Add a visual indicator for "Sin Publicar" filter if active */}
             {Array.isArray(statusFilter) && statusFilter.includes('draft') && statusFilter.includes('archived') && (
                <button
                  onClick={() => { setStatusFilter(['draft', 'archived']); setPage(1); }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors bg-admin-accent text-white shadow-sm"
                >
                  Sin Publicar
                </button>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título o empresa..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent text-sm"
              />
            </div>

            <div>
              <select
                value={Array.isArray(statusFilter) ? '' : statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent text-sm"
              >
                <option value="">Todos los estados</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
                <option value="expiring_soon">Próximos a vencer</option>
                <option value="expired">Vencidos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando anuncios...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 bg-gray-50 px-6 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">Anuncio / Empresa</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-2">Métricas</div>
              <div className="col-span-2">Expiración</div>
              <div className="col-span-2 text-right">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="p-4 lg:px-6 lg:py-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Mobile View */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{ad.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <Building2 className="w-3 h-3" />
                          <span>{ad.company_snapshot?.name || 'Empresa desconocida'}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ad.status]}`}>
                        {statusLabels[ad.status]}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{ad.views_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{ad.applications_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(ad.expiration_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/admin/job-ads/${ad.id}`)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalles
                    </button>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <h3 className="font-medium text-gray-900 group-hover:text-admin-accent transition-colors">
                        {ad.title}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>
                          {ad.company_snapshot?.name || 'Empresa desconocida'}
                          {ad.metadata?.is_anonymous && <span className="ml-1 text-xs text-blue-600 font-medium">(Anónimo)</span>}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[ad.status]}`}>
                        {statusLabels[ad.status]}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1" title="Visitas">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span>{ad.views_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Candidatos">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{ad.applications_count || 0}</span>
                      </div>
                    </div>

                    <div className="col-span-2 text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ad.expiration_date).toLocaleDateString()}
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => router.push(`/admin/job-ads/${ad.id}`)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-admin-accent bg-admin-accent/5 hover:bg-admin-accent/10 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {ads.length === 0 && (
                <div className="text-center py-12">
                  <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No se encontraron anuncios</p>
                </div>
              )}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Anterior</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Siguiente</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RequireRoleClient>
  );
}
