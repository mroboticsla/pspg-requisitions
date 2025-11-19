'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { getJobAdMetrics } from '@/lib/jobAds';

type MetricData = {
  date: string;
  views_count: number;
  applications_count: number;
};

export function JobAdActivityChart({ jobAdId }: { jobAdId: string }) {
  const [data, setData] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [jobAdId]);

  async function loadMetrics() {
    try {
      setLoading(true);
      const metrics = await getJobAdMetrics(jobAdId);
      
      // Fill in missing dates for the last 7 days if needed, or just show what we have
      // For now, let's just show the data we have.
      // Ideally we should fill gaps with 0.
      
      const formattedData = metrics.map(m => ({
        date: new Date(m.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
        views_count: m.views_count,
        applications_count: m.applications_count
      }));

      setData(formattedData);
    } catch (err) {
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-100 text-gray-500">
        <p>No hay datos de actividad recientes</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Actividad Reciente</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="views_count" 
            name="Visitas"
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.1} 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="applications_count" 
            name="Candidatos"
            stroke="#10b981" 
            fill="#10b981" 
            fillOpacity={0.1} 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
