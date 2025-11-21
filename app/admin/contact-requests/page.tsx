'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Mail, Phone, Calendar, CheckCircle, Archive, MessageSquare, Trash2, Search, Inbox, AlertCircle } from 'lucide-react';
import { useToast } from '@/lib/useToast';
import { KPICard } from '@/app/components/KPICard';
import ConfirmModal from '@/app/components/ConfirmModal';
import { RequireRoleClient } from '@/app/components/RequireRole';

// Definición del tipo para las solicitudes
type ContactRequest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  status: 'new' | 'read' | 'archived';
  created_at: string;
};

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error: toastError } = useToast();
  
  // Estado para modal de confirmación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      toastError('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (id: string, newStatus: 'new' | 'read' | 'archived') => {
    try {
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setRequests(prev => 
        prev.map(req => req.id === id ? { ...req, status: newStatus } : req)
      );
      success('Estado actualizado correctamente');
    } catch (err) {
      console.error('Error updating status:', err);
      toastError('Error al actualizar el estado');
    }
  };

  const handleDeleteClick = (id: string) => {
    setRequestToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!requestToDelete) return;
    
    try {
      const { error } = await supabase
        .from('contact_requests')
        .delete()
        .eq('id', requestToDelete);

      if (error) throw error;

      setRequests(prev => prev.filter(req => req.id !== requestToDelete));
      success('Solicitud eliminada correctamente');
    } catch (err) {
      console.error('Error deleting request:', err);
      toastError('Error al eliminar la solicitud');
    } finally {
      setDeleteModalOpen(false);
      setRequestToDelete(null);
    }
  };

  // Filtrado y búsqueda
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesFilter = filter === 'all' || req.status === filter;
      const matchesSearch = 
        req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.message && req.message.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesFilter && matchesSearch;
    });
  }, [requests, filter, searchTerm]);

  // Estadísticas
  const stats = useMemo(() => {
    return {
      total: requests.length,
      new: requests.filter(r => r.status === 'new').length,
      read: requests.filter(r => r.status === 'read').length,
      archived: requests.filter(r => r.status === 'archived').length
    };
  }, [requests]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">Nuevo</span>;
      case 'read':
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">Leído</span>;
      case 'archived':
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">Archivado</span>;
      default:
        return null;
    }
  };

  return (
    <RequireRoleClient permission="manage_contact_requests">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Buzón Web</h1>
            <p className="text-gray-600 mt-1">Gestiona los mensajes recibidos desde el formulario de contacto público.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Inbox className="w-5 h-5 text-brand-accent" />
            <span className="text-sm text-gray-600">Mensajería</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Mensajes"
            value={stats.total}
            loading={loading}
            variant="dark"
            icon={<MessageSquare className="w-10 h-10" />}
          />
          <KPICard
            title="Nuevos"
            value={stats.new}
            loading={loading}
            variant="accent"
            icon={<Mail className="w-10 h-10" />}
            subtitle={stats.new > 0 ? 'Requieren atención' : 'Todo al día'}
          />
          <KPICard
            title="Leídos"
            value={stats.read}
            loading={loading}
            variant="green"
            icon={<CheckCircle className="w-10 h-10" />}
          />
          <KPICard
            title="Archivados"
            value={stats.archived}
            loading={loading}
            variant="neutral"
            icon={<Archive className="w-10 h-10" />}
          />
        </div>

        {/* Controles: Filtros y Búsqueda */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Filtros de estado */}
            <div className="flex bg-gray-100 rounded-lg p-1 w-full md:w-auto overflow-x-auto">
              {(['all', 'new', 'read', 'archived'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    filter === f 
                      ? 'bg-white text-brand-dark shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                >
                  {f === 'all' ? 'Todos' : 
                   f === 'new' ? 'Nuevos' : 
                   f === 'read' ? 'Leídos' : 'Archivados'}
                </button>
              ))}
            </div>

            {/* Barra de búsqueda */}
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-accent focus:border-brand-accent sm:text-sm transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* Lista de Mensajes */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No se encontraron mensajes</h3>
            <p className="text-gray-500 mt-2">Intenta ajustar los filtros o la búsqueda.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((req) => (
              <div 
                key={req.id} 
                className={`bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
                  req.status === 'new' ? 'border-l-4 border-l-brand-accent border-y-gray-200 border-r-gray-200' : 'border-gray-200'
                }`}
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2.5 rounded-full flex-shrink-0 ${
                        req.status === 'new' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900">{req.name}</h3>
                          {getStatusBadge(req.status)}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mt-2">
                          <a href={`mailto:${req.email}`} className="hover:text-brand-accent transition-colors flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" /> {req.email}
                          </a>
                          {req.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" /> {req.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(req.created_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-end md:self-start">
                      {req.status === 'new' && (
                        <button
                          onClick={() => updateStatus(req.id, 'read')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors tooltip-trigger"
                          title="Marcar como leído"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      {req.status !== 'archived' && (
                        <button
                          onClick={() => updateStatus(req.id, 'archived')}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Archivar"
                        >
                          <Archive className="h-5 w-5" />
                        </button>
                      )}
                      {req.status === 'archived' && (
                        <button
                          onClick={() => updateStatus(req.id, 'read')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Mover a leídos"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(req.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar permanentemente"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50/80 rounded-lg p-4 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed border border-gray-100">
                    {req.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Eliminar mensaje"
          message="¿Estás seguro de que deseas eliminar este mensaje permanentemente? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModalOpen(false)}
          type="danger"
        />
      </div>
    </RequireRoleClient>
  );
}

