/**
 * Componente para mostrar el historial de sesiones del usuario
 * Útil para auditoría de seguridad
 */

import React from 'react';
import { Monitor, MapPin, Clock, Calendar } from 'lucide-react';
import { SessionInfo } from '../../lib/sessionTracking';

interface SessionHistoryProps {
  sessionHistory?: SessionInfo[];
  currentSession?: SessionInfo;
}

export default function SessionHistory({ sessionHistory = [], currentSession }: SessionHistoryProps) {
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <div className="bg-surface-primary rounded-lg shadow-sm border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-brand-dark mb-4">
        Historial de Sesiones
      </h3>
      
      {currentSession && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="font-semibold text-green-800">Sesión Actual</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="flex items-start space-x-2">
              <Monitor className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-green-600 font-medium">Navegador</p>
                <p className="text-sm text-green-800">{currentSession.browser || 'Desconocido'}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-green-600 font-medium">IP</p>
                <p className="text-sm text-green-800 font-mono">{currentSession.ip || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Calendar className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-green-600 font-medium">Inicio de sesión</p>
                <p className="text-sm text-green-800">{formatDate(currentSession.loginAt)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-green-600 font-medium">Última actividad</p>
                <p className="text-sm text-green-800">{getTimeSince(currentSession.lastActionAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {sessionHistory.length === 0 ? (
        <p className="text-neutral-500 text-sm text-center py-4">
          No hay historial de sesiones previas
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-neutral-600 mb-3">
            Últimas {sessionHistory.length} sesiones
          </p>
          {sessionHistory.map((session, index) => (
            <div
              key={index}
              className="p-3 bg-surface-secondary rounded-lg border border-neutral-200 hover:border-brand-accent transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm font-medium text-brand-dark">
                    {session.browser || 'Desconocido'} · {session.os || 'N/A'}
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  {getTimeSince(session.loginAt)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-neutral-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span className="font-mono">{session.ip || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(session.loginAt)}</span>
                </div>
              </div>
              {session.lastActionAt && session.lastActionAt !== session.loginAt && (
                <div className="mt-2 pt-2 border-t border-neutral-200">
                  <div className="flex items-center space-x-1 text-xs text-neutral-500">
                    <Clock className="w-3 h-3" />
                    <span>Última actividad: {formatDate(session.lastActionAt)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Nota de seguridad:</strong> Si detectas actividad sospechosa o sesiones que no reconoces,
          cambia tu contraseña inmediatamente y contacta al administrador.
        </p>
      </div>
    </div>
  );
}
