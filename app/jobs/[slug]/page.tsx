'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PublicNavbar } from '../../components/public/layout/PublicNavbar';
import { PublicFooter } from '../../components/public/layout/PublicFooter';
import { MapPin, Briefcase, DollarSign, Clock, Building, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getJobAdBySlug } from '@/lib/jobAds';
import type { JobAd } from '@/lib/types/job-ads';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobAd | null>(null);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicNavbar />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.push('/jobs')}
            className="flex items-center text-gray-600 hover:text-brand-accent mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a empleos
          </button>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-brand-accent">
            {/* Header */}
            <div className="p-8 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  <div className="flex items-center text-lg text-gray-600 mb-4">
                    <Building className="w-5 h-5 mr-2 text-brand-accent" />
                    <span className="font-medium">{job.company_snapshot?.name || 'Empresa Confidencial'}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    {job.location && (
                      <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <MapPin className="w-4 h-4 mr-2 text-brand-accent" />
                        <span className="text-sm font-medium">{job.location}</span>
                      </div>
                    )}
                    {job.employment_type && (
                      <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Briefcase className="w-4 h-4 mr-2 text-brand-accent" />
                        <span className="text-sm font-medium">{job.employment_type}</span>
                      </div>
                    )}
                    {job.salary_range && (
                      <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <DollarSign className="w-4 h-4 mr-2 text-brand-accent" />
                        <span className="text-sm font-medium">{job.salary_range}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <Clock className="w-4 h-4 mr-2 text-brand-accent" />
                      <span className="text-sm font-medium">Publicado: {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => router.push('/contact')}
                  className="bg-brand-accent text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-accentDark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  Aplicar Ahora
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Description */}
              <div className="prose max-w-none text-gray-700">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Descripción del Puesto</h3>
                <div className="whitespace-pre-wrap">{job.description}</div>
              </div>

              {/* Custom Fields */}
              {job.custom_fields?.fields.map((field, idx) => (
                <div key={idx} className="prose max-w-none text-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{field.label}</h3>
                  {field.type === 'list' && Array.isArray(field.value) ? (
                    <ul className="space-y-2 list-none pl-0">
                      {field.value.map((item: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle2 className="w-5 h-5 text-brand-accent mr-3 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="whitespace-pre-wrap">{field.value}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer CTA */}
            <div className="bg-gray-50 p-8 text-center border-t border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">¿Te interesa esta posición?</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Si cumples con los requisitos y buscas un nuevo reto profesional, nos encantaría conocerte.
              </p>
              <button 
                onClick={() => router.push('/contact')}
                className="bg-brand-accent text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-brand-accentDark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Aplicar a esta Vacante
              </button>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
