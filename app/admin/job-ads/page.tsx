'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Megaphone, MapPin, Building2, Calendar } from 'lucide-react';
import { getJobAds } from '@/lib/jobAds';
import type { JobAd } from '@/lib/types/job-ads';
import { useToast } from '@/lib/useToast';

export default function JobAdsPage() {
  const router = useRouter();
  const { error } = useToast();
  const [ads, setAds] = useState<JobAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredAds = ads.filter(ad => 
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.company_snapshot?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Gestión de Anuncios</h1>
          <p className="text-admin-text-secondary">Administra las ofertas de empleo publicadas en el portal</p>
        </div>
        <button
          onClick={() => router.push('/admin/job-ads/new')}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-accent text-white hover:bg-brand-accentDark transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Anuncio</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar anuncios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando anuncios...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAds.map((ad) => (
            <div
              key={ad.id}
              onClick={() => router.push(`/admin/job-ads/${ad.id}`)}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-brand-accent/50 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-brand-accent transition-colors">
                    {ad.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span>{ad.company_snapshot?.name || 'Empresa desconocida'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{ad.location || 'Sin ubicación'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Expira: {new Date(ad.expiration_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  ad.status === 'published' ? 'bg-green-100 text-green-800' :
                  ad.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {ad.status === 'published' ? 'Publicado' :
                   ad.status === 'draft' ? 'Borrador' : 'Archivado'}
                </span>
              </div>
            </div>
          ))}
          
          {filteredAds.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No se encontraron anuncios</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
