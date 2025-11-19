'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Megaphone, MapPin, Building2, Calendar, 
  Filter, FileText, Eye, CheckCircle, Archive, Clock, AlertCircle,
  Briefcase
} from 'lucide-react';
import { getJobAds } from '@/lib/jobAds';
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
  const [statusFilter, setStatusFilter] = useState<JobAdStatus | ''>('');

  useEffect(() => {
    loadAds();
  }, []);

  async function loadAds() {
    try {
      setLoading(true);
      const data = await getJobAds();
      setAds(data);
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const total = ads.length;
    const published = ads.filter(ad => ad.status === 'published').length;
    const drafts = ads.filter(ad => ad.status === 'draft').length;
    const archived = ads.filter(ad => ad.status === 'archived').length;
    
    // Expiring soon (next 7 days)
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    const expiringSoon = ads.filter(ad => {
      if (ad.status !== 'published') return false;
      const expDate = new Date(ad.expiration_date);
      return expDate > now && expDate <= nextWeek;
    }).length;

    return { total, published, drafts, archived, expiringSoon };
  }, [ads]);

  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const matchesSearch = 
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.company_snapshot?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || ad.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [ads, searchTerm, statusFilter]);

  const quickFilters: { label: string; value: JobAdStatus | "" }[] = [
    { label: "Todos", value: "" },
    { label: "Publicados", value: "published" },
    { label: "Borradores", value: "draft" },
    { label: "Archivados", value: "archived" },
  ];

  return (
    <RequireRoleClient allow={['admin', 'superadmin']} redirectTo="/admin/login">
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
            title="Total Anuncios"
            value={stats.total}
            icon={<Briefcase className="w-6 h-6" />}
            variant="dark"
          />
          <KPICard
            title="Publicados"
            value={stats.published}
            icon={<Megaphone className="w-6 h-6" />}
            variant="green"
            percentage={stats.total > 0 ? (stats.published / stats.total) * 100 : 0}
          />
          <KPICard
            title="Borradores"
            value={stats.drafts}
            icon={<FileText className="w-6 h-6" />}
            variant="neutral"
          />
          <KPICard
            title="Por Expirar (7 días)"
            value={stats.expiringSoon}
            icon={<Clock className="w-6 h-6" />}
            variant="warning"
            subtitle="Requieren atención"
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
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === filter.value
                    ? "bg-admin-accent text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent text-sm"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as JobAdStatus | '')}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent text-sm"
              >
                <option value="">Todos los estados</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
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
              <div className="col-span-2">Ubicación</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-2">Expiración</div>
              <div className="col-span-2 text-right">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredAds.map((ad) => (
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
                        <MapPin className="w-3 h-3" />
                        <span>{ad.location || 'Sin ubicación'}</span>
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

                    <div className="col-span-2 text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {ad.location || 'Sin ubicación'}
                    </div>

                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[ad.status]}`}>
                        {statusLabels[ad.status]}
                      </span>
                    </div>

                    <div className="col-span-2 text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ad.expiration_date).toLocaleDateString()}
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => router.push(`/admin/job-ads/${ad.id}`)}
                        className="p-2 rounded-md text-gray-400 hover:text-admin-accent hover:bg-admin-accent/10 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredAds.length === 0 && (
                <div className="text-center py-12">
                  <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No se encontraron anuncios</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RequireRoleClient>
  );
}
