'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Mail, Phone, Building, Calendar, CheckCircle, Archive, MessageSquare, AlertCircle } from 'lucide-react';
import { useToast } from '@/lib/useToast';

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
  const { success, error: toastError } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      toastError('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Nuevo</span>;
      case 'read':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Leído</span>;
      case 'archived':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Archivado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buzón de Contacto Web</h1>
          <p className="text-gray-500 mt-1">Gestiona los mensajes recibidos desde el formulario de contacto público.</p>
        </div>
        
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'new' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Nuevos
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'read' ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Leídos
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'archived' ? 'bg-gray-50 text-gray-700' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Archivados
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <MessageSquare className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No hay mensajes</h3>
          <p className="text-gray-500 mt-2">No se encontraron solicitudes de contacto con el filtro actual.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((req) => (
            <div 
              key={req.id} 
              className={`bg-white rounded-xl shadow-sm border transition-all duration-200 ${req.status === 'new' ? 'border-blue-200 shadow-md ring-1 ring-blue-100' : 'border-gray-200'}`}
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-2 rounded-full ${req.status === 'new' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{req.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                        <a href={`mailto:${req.email}`} className="hover:text-brand-primary flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {req.email}
                        </a>
                        {req.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {req.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(req.created_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed border border-gray-100">
                  {req.message}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  {req.status === 'new' && (
                    <button
                      onClick={() => updateStatus(req.id, 'read')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 rounded-md transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Marcar como leído
                    </button>
                  )}
                  {req.status !== 'archived' && (
                    <button
                      onClick={() => updateStatus(req.id, 'archived')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Archive className="h-4 w-4" />
                      Archivar
                    </button>
                  )}
                  {req.status === 'archived' && (
                    <button
                      onClick={() => updateStatus(req.id, 'read')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mover a leídos
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
