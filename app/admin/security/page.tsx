"use client";

import { useState, useEffect } from "react";
import { Shield, Activity, Ban, CheckCircle, XCircle, Unlock } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type SecurityLog = {
  ip: string;
  timestamp: number;
  success: boolean;
  email?: string;
};

type SecurityStats = {
  last24Hours: {
    totalAttempts: number;
    failed: number;
    successful: number;
    uniqueIPs: number;
  };
  currentlyBlocked: number;
  totalLogs: number;
};

export default function SecurityMonitorPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblockIP, setUnblockIP] = useState("");
  const [unblocking, setUnblocking] = useState(false);

  // Verificar que el usuario sea superadmin
  useEffect(() => {
    if (!loading && profile) {
      const roleName = String(profile.roles?.name || "").toLowerCase();
      if (roleName !== "superadmin") {
        router.replace("/admin");
      }
    }
  }, [loading, profile, router]);

  // Cargar estadísticas de seguridad
  const loadStats = async () => {
    try {
      setRefreshing(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error("No hay sesión activa");
        return;
      }

      const response = await fetch("/api/admin/security-stats", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setLogs(data.recentLogs);
      } else {
        console.error("Error al cargar estadísticas:", await response.text());
      }
    } catch (error) {
      console.error("Error al cargar estadísticas de seguridad:", error);
    } finally {
      setStatsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!loading && profile?.roles?.name === "superadmin") {
      loadStats();
    }
  }, [loading, profile]);

  // Desbloquear IP
  const handleUnblockIP = async () => {
    if (!unblockIP.trim()) return;

    try {
      setUnblocking(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert("No hay sesión activa");
        return;
      }

      const response = await fetch("/api/admin/security-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ip: unblockIP }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setUnblockIP("");
        await loadStats();
      } else {
        const error = await response.json();
        alert(error.error || "Error al desbloquear IP");
      }
    } catch (error) {
      console.error("Error al desbloquear IP:", error);
      alert("Error al desbloquear IP");
    } finally {
      setUnblocking(false);
    }
  };

  if (loading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas de seguridad...</p>
        </div>
      </div>
    );
  }

  const roleName = String(profile?.roles?.name || "").toLowerCase();
  if (roleName !== "superadmin") {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-admin-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monitor de Seguridad</h1>
            <p className="text-sm text-gray-600">Sistema de protección contra ataques de fuerza bruta</p>
          </div>
        </div>
        <button
          onClick={loadStats}
          disabled={refreshing}
          className="px-4 py-2 bg-admin-primary text-white rounded-lg hover:bg-admin-accent transition-colors disabled:opacity-50"
        >
          {refreshing ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Intentos (24h)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.last24Hours.totalAttempts}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Intentos Fallidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.last24Hours.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Logins Exitosos</p>
                <p className="text-2xl font-bold text-green-600">{stats.last24Hours.successful}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">IPs Bloqueadas</p>
                <p className="text-2xl font-bold text-orange-600">{stats.currentlyBlocked}</p>
              </div>
              <Ban className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Desbloquear IP */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Unlock className="h-5 w-5" />
          Desbloquear IP
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={unblockIP}
            onChange={(e) => setUnblockIP(e.target.value)}
            placeholder="192.168.1.1"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
          />
          <button
            onClick={handleUnblockIP}
            disabled={unblocking || !unblockIP.trim()}
            className="px-6 py-2 bg-admin-primary text-white rounded-lg hover:bg-admin-accent transition-colors disabled:opacity-50"
          >
            {unblocking ? "Desbloqueando..." : "Desbloquear"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Ingresa la dirección IP que deseas desbloquear manualmente
        </p>
      </div>

      {/* Logs recientes */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log, index) => (
                <tr key={index} className={log.success ? "" : "bg-red-50"}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.timestamp).toLocaleString("es-MX")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700">
                    {log.ip}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {log.email || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.success ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Exitoso
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Fallido
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No hay actividad registrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
