'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PublicNavbar } from '../../components/public/layout/PublicNavbar';
import { PublicFooter } from '../../components/public/layout/PublicFooter';
import { MapPin, Briefcase, DollarSign, Clock, Building, ArrowLeft, CheckCircle2, Calendar, Share2, Timer, Globe, Phone, Mail, ExternalLink } from 'lucide-react';
import { useToast } from '@/lib/useToast';
import { getJobAdBySlug, incrementJobAdView, incrementJobAdApplication } from '@/lib/jobAds';
import type { JobAd } from '@/lib/types/job-ads';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { success } = useToast();
  const [job, setJob] = useState<JobAd | null>(null);
  const [loading, setLoading] = useState(true);
  const viewIncremented = React.useRef(false);

  useEffect(() => {
    if (params.slug) {
      loadJob(params.slug as string);
    }
  }, [params.slug]);

  async function loadJob(slug: string) {
    try {
      setLoading(true);
      const data = await getJobAdBySlug(slug);
      setJob(data);
      if (data && !viewIncremented.current) {
        viewIncremented.current = true;
        incrementJobAdView(data.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleApply = async () => {
    if (!job) return;
    incrementJobAdApplication(job.id);
    router.push('/contact');
  };

  const handleShare = async () => {
    if (!job) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `Vacante de ${job.title} en ${job.company_snapshot?.name}`,
          url
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(url);
      success('Enlace copiado al portapapeles');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <PublicNavbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <PublicNavbar />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oferta no encontrada</h1>
          <button 
            onClick={() => router.push('/jobs')}
            className="text-brand-accent hover:underline"
          >
            Volver al listado
          </button>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const isExpired = job.expiration_date ? new Date(job.expiration_date) < new Date() : false;
  const company = job.company_snapshot || {};
  const isAnonymous = job.metadata?.is_anonymous;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <PublicNavbar />
      
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <button 
            onClick={() => router.push('/jobs')}
            className="flex items-center text-gray-500 hover:text-brand-accent mb-6 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a empleos
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">{job.title}</h1>
              <div className="flex items-center text-lg text-gray-600 mb-6">
                <Building className="w-5 h-5 mr-2 text-brand-accent" />
                <span className="font-medium">{isAnonymous ? 'Empresa Confidencial' : (job.company_snapshot?.name || 'Empresa Confidencial')}</span>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {job.location && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                    {job.location}
                  </span>
                )}
                {job.employment_type && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                    <Briefcase className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                    {job.employment_type}
                  </span>
                )}
                {job.salary_range && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
                    <DollarSign className="w-3.5 h-3.5 mr-1.5 text-green-500" />
                    {job.salary_range}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              <button 
                onClick={handleShare}
                className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </button>
              <button 
                onClick={handleApply}
                disabled={isExpired}
                className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-bold rounded-lg text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-all transform hover:-translate-y-0.5 ${
                  isExpired 
                    ? 'bg-gray-400 cursor-not-allowed hover:transform-none' 
                    : 'bg-brand-accent hover:bg-brand-accentDark hover:shadow-md'
                }`}
              >
                {isExpired ? 'Vacante Cerrada' : 'Aplicar Ahora'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Short Description Card */}
              {job.short_description && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 bg-gradient-to-r from-white to-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumen</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {job.short_description}
                  </p>
                </div>
              )}

              {/* Main Description */}
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-100">
                <div className="prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-brand-accent hover:prose-a:text-brand-accentDark">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Descripción del Puesto</h3>
                  <div dangerouslySetInnerHTML={{ __html: job.description || '' }} />
                </div>

                {/* Custom Fields */}
                {job.custom_fields?.fields.map((field, idx) => (
                  <div key={idx} className="mt-8 pt-8 border-t border-gray-100 prose prose-lg max-w-none text-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{field.label}</h3>
                    {field.type === 'list' && Array.isArray(field.value) ? (
                      <ul className="space-y-2 list-none pl-0 my-0">
                        {field.value.map((item: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle2 className="w-5 h-5 text-brand-accent mr-3 flex-shrink-0 mt-1" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : field.type === 'richtext' ? (
                      <div dangerouslySetInnerHTML={{ __html: field.value }} />
                    ) : (
                      <div className="whitespace-pre-wrap">{field.value}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Sidebar */}
            <div className="space-y-6">
              {/* Job Details Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-12 z-10">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-gray-900">Detalles de la Vacante</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Publicado</p>
                      <p className="text-gray-900">{new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {job.expiration_date && (
                    <div className="flex items-start">
                      <Timer className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Vence</p>
                        <p className={`text-gray-900 ${isExpired ? 'text-red-600 font-medium' : ''}`}>
                          {new Date(job.expiration_date).toLocaleDateString()}
                          {isExpired && ' (Cerrada)'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ubicación</p>
                      <p className="text-gray-900">{job.location || 'No especificada'}</p>
                    </div>
                  </div>

                  <div className="pt-6 mt-2">
                    <button 
                      onClick={handleApply}
                      disabled={isExpired}
                      className={`w-full py-3 px-4 rounded-lg font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 ${
                        isExpired 
                          ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                          : 'bg-brand-accent hover:bg-brand-accentDark hover:shadow-xl'
                      }`}
                    >
                      {isExpired ? 'Vacante Cerrada' : 'Aplicar a esta Vacante'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Company Details Card */}
              {!isAnonymous && (company.website || company.phone || company.email || company.address) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900">Sobre la Empresa</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {company.name && (
                      <div className="font-medium text-lg text-gray-900 mb-2">{company.name}</div>
                    )}
                    
                    {company.website && (
                      <div className="flex items-start">
                        <Globe className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Sitio Web</p>
                          <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline flex items-center gap-1 break-all">
                            Visitar sitio <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {company.email && (
                      <div className="flex items-start">
                        <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Contacto</p>
                          <a href={`mailto:${company.email}`} className="text-gray-900 hover:text-brand-accent transition-colors break-all">{company.email}</a>
                        </div>
                      </div>
                    )}

                    {company.phone && (
                      <div className="flex items-start">
                        <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Teléfono</p>
                          <p className="text-gray-900">{company.phone}</p>
                        </div>
                      </div>
                    )}

                    {company.address && (
                      <div className="flex items-start">
                        <Building className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Dirección</p>
                          <p className="text-gray-900">{company.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <button 
          onClick={handleApply}
          disabled={isExpired}
          className={`w-full py-3 rounded-lg font-bold text-white shadow-md ${
            isExpired ? 'bg-gray-400' : 'bg-brand-accent'
          }`}
        >
          {isExpired ? 'Vacante Cerrada' : 'Aplicar Ahora'}
        </button>
      </div>

      <PublicFooter />
    </div>
  );
}
