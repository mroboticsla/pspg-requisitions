/**
 * Componente para mostrar el historial de sesiones del usuario
 * Útil para auditoría de seguridad
 */

import React from 'react';
import { Monitor, MapPin, Clock, Calendar, Globe } from 'lucide-react';
import { SessionInfo } from '../../lib/sessionTracking';

interface SessionHistoryProps {
  sessionHistory?: SessionInfo[];
  currentSession?: SessionInfo;
}

// Componente para mostrar la bandera del país
const CountryFlag = ({ countryCode, size = 'md' }: { countryCode?: string; size?: 'sm' | 'md' | 'lg' }) => {
  if (!countryCode || countryCode.length !== 2) {
    return <Globe className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-6' : 'w-6 h-4'} text-neutral-400`} />;
  }
  
  const flagUrl = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
  
  const sizeClasses = {
    sm: 'w-5 h-3.5',
    md: 'w-7 h-5',
    lg: 'w-9 h-6'
  };
  
  return (
    <img 
      src={flagUrl} 
      alt={`Bandera de ${countryCode}`}
      className={`${sizeClasses[size]} object-cover rounded-sm shadow-sm border border-neutral-200`}
      onError={(e) => {
        // Fallback a icono de globo si la imagen no carga
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};

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

  const getFlagEmoji = (countryCode?: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    
    // Convertir código de país a emoji de bandera
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const getLocationDisplay = (session: SessionInfo) => {
    if (session.city && session.country) {
      return `${session.city}, ${session.country}`;
    } else if (session.country) {
      return session.country;
    } else if (session.ip) {
      return `IP: ${session.ip}`;
    }
    return 'Ubicación desconocida';
  };

  // Mapeo de nombres de países completos a códigos ISO (para casos donde la API retorna nombres)
  const getCountryCode = (countryName?: string, countryCode?: string): string | undefined => {
    if (countryCode && countryCode.length === 2) return countryCode.toUpperCase();
    
    if (!countryName) return undefined;
    
    const countryMap: Record<string, string> = {
      // Países de América
      'mexico': 'MX',
      'méxico': 'MX',
      'united states': 'US',
      'estados unidos': 'US',
      'canada': 'CA',
      'canadá': 'CA',
      'argentina': 'AR',
      'brazil': 'BR',
      'brasil': 'BR',
      'chile': 'CL',
      'colombia': 'CO',
      'costa rica': 'CR',
      'ecuador': 'EC',
      'el salvador': 'SV',
      'guatemala': 'GT',
      'honduras': 'HN',
      'nicaragua': 'NI',
      'panama': 'PA',
      'panamá': 'PA',
      'paraguay': 'PY',
      'peru': 'PE',
      'perú': 'PE',
      'uruguay': 'UY',
      'venezuela': 'VE',
      // Países de Europa
      'spain': 'ES',
      'españa': 'ES',
      'france': 'FR',
      'francia': 'FR',
      'germany': 'DE',
      'alemania': 'DE',
      'italy': 'IT',
      'italia': 'IT',
      'united kingdom': 'GB',
      'reino unido': 'GB',
      'portugal': 'PT',
      'netherlands': 'NL',
      'holanda': 'NL',
      'belgium': 'BE',
      'bélgica': 'BE',
      'switzerland': 'CH',
      'suiza': 'CH',
      'austria': 'AT',
      'poland': 'PL',
      'polonia': 'PL',
      'sweden': 'SE',
      'suecia': 'SE',
      'norway': 'NO',
      'noruega': 'NO',
      'denmark': 'DK',
      'dinamarca': 'DK',
      'finland': 'FI',
      'finlandia': 'FI',
      'ireland': 'IE',
      'irlanda': 'IE',
      'greece': 'GR',
      'grecia': 'GR',
      'czech republic': 'CZ',
      'república checa': 'CZ',
      'hungary': 'HU',
      'hungría': 'HU',
      'romania': 'RO',
      'rumania': 'RO',
      'russia': 'RU',
      'rusia': 'RU',
      'ukraine': 'UA',
      'ucrania': 'UA',
      // Países de Asia
      'china': 'CN',
      'japan': 'JP',
      'japón': 'JP',
      'south korea': 'KR',
      'corea del sur': 'KR',
      'india': 'IN',
      'indonesia': 'ID',
      'thailand': 'TH',
      'tailandia': 'TH',
      'vietnam': 'VN',
      'philippines': 'PH',
      'filipinas': 'PH',
      'singapore': 'SG',
      'singapur': 'SG',
      'malaysia': 'MY',
      'malasia': 'MY',
      'taiwan': 'TW',
      'hong kong': 'HK',
      'israel': 'IL',
      'turkey': 'TR',
      'turquía': 'TR',
      'saudi arabia': 'SA',
      'arabia saudita': 'SA',
      'united arab emirates': 'AE',
      'emiratos árabes unidos': 'AE',
      // Países de Oceanía
      'australia': 'AU',
      'new zealand': 'NZ',
      'nueva zelanda': 'NZ',
      // Países de África
      'south africa': 'ZA',
      'sudáfrica': 'ZA',
      'egypt': 'EG',
      'egipto': 'EG',
      'nigeria': 'NG',
      'kenya': 'KE',
      'morocco': 'MA',
      'marruecos': 'MA',
      'algeria': 'DZ',
      'argelia': 'DZ',
    };
    
    const normalized = countryName.toLowerCase().trim();
    return countryMap[normalized];
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
              <Globe className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-green-600 font-medium">Ubicación</p>
                <div className="flex items-center space-x-2 mt-1">
                  <CountryFlag countryCode={getCountryCode(currentSession.country, currentSession.countryCode)} size="md" />
                  <p className="text-sm text-green-800 font-medium">{getLocationDisplay(currentSession)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Monitor className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-green-600 font-medium">Navegador</p>
                <p className="text-sm text-green-800">{currentSession.browser || 'Desconocido'} · {currentSession.os || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-green-600 font-medium">Dirección IP</p>
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
            <div className="flex items-start space-x-2 md:col-span-2">
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
                <div className="flex items-start space-x-2">
                  <div className="mt-0.5">
                    <CountryFlag countryCode={getCountryCode(session.country, session.countryCode)} size="md" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm font-medium text-brand-dark">
                        {session.browser || 'Desconocido'} · {session.os || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <Globe className="w-3 h-3 text-neutral-500" />
                      <span className="text-xs text-neutral-600">
                        {getLocationDisplay(session)}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-neutral-500">
                  {getTimeSince(session.loginAt)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-neutral-600 mt-2">
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
