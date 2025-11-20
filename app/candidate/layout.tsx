"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AvatarUpload from "../components/AvatarUpload";
import Header from "../components/Header";
import { FileText, User, Briefcase, Settings } from "lucide-react";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Cargar avatar
  useEffect(() => {
    const loadAvatar = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('user_metadata')
          .select('avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error('Error al cargar avatar:', error);
      }
    };
    loadAvatar();
  }, [user?.id]);

  // Verificar que el usuario sea candidato
  useEffect(() => {
    if (!loading && profile) {
      const roleName = profile?.roles?.name?.toLowerCase?.();
      if (roleName !== 'candidate' && roleName !== 'admin' && roleName !== 'superadmin') {
        router.push('/dashboard');
      }
    }
  }, [loading, profile, router]);

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (!newAvatarUrl || newAvatarUrl === '') {
      setAvatarUrl(null);
    } else {
      setAvatarUrl(newAvatarUrl);
    }
    window.dispatchEvent(new CustomEvent('avatar-updated', { 
      detail: { avatarUrl: newAvatarUrl } 
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuario';
  const roleName = profile?.roles?.name?.toLowerCase?.() || 'Usuario';

  const menuItems = [
    { id: 'profile', label: 'Mi Perfil', path: '/candidate/profile', icon: User },
    { id: 'resume', label: 'Mi CV', path: '/candidate/resume', icon: FileText },
    { id: 'jobs', label: 'Búsqueda de Empleos', path: '/candidate/jobs', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showNavigation={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ marginTop: 'var(--header-h, 64px)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Izquierdo */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Tarjeta de Identidad */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-brand-dark to-brand-accent h-24"></div>
                <div className="px-6 pb-6">
                  <div className="relative flex justify-center -mt-12 mb-4">
                    <div className="p-1 bg-white rounded-full">
                      <AvatarUpload 
                        user={user}
                        currentAvatarUrl={avatarUrl}
                        onAvatarUpdate={handleAvatarUpdate}
                        disabled={false}
                        size="lg"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h2 className="text-lg font-bold text-gray-900 truncate">
                      {fullName}
                    </h2>
                    <p className="text-sm text-gray-500 truncate mb-3">{user.email}</p>
                    
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-light text-brand-dark capitalize">
                      {roleName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menú de Navegación */}
              <nav className="bg-white shadow rounded-lg overflow-hidden">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => router.push(item.path)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium border-l-4 transition-colors ${
                        isActive
                          ? 'border-brand-accent bg-brand-light/10 text-brand-dark'
                          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-brand-accent' : 'text-gray-400'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Info adicional */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="text-blue-800 font-medium mb-1">💡 Consejo</p>
                <p className="text-blue-700 text-xs">
                  Mantén tu perfil actualizado para aumentar tus oportunidades de encontrar el trabajo ideal.
                </p>
              </div>
            </div>
          </div>

          {/* Área de Contenido */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
