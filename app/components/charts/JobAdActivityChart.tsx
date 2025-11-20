'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { getJobAdMetrics } from '@/lib/jobAds';

type MetricData = {
  date: string;
  views_count: number;
  applications_count: number;
  rawDate?: string;
};

export function JobAdActivityChart({ jobAdId }: { jobAdId: string }) {
  const [data, setData] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ResizeObserver logic
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 250 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const width = element.clientWidth;
      const height = element.clientHeight || 250;
      if (width > 0) {
        setDimensions({ width, height });
        setIsReady(true);
      }
    };

    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateSize());
      observer.observe(element);
      return () => observer.disconnect();
    }

    const handleResize = () => updateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadMetrics = useCallback(async () => {
    // Generate last 14 days
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().split('T')[0];
    });

    // Prepare base data structure with zeros
    const baseData = last14Days.map(dateStr => {
      const dateObj = new Date(dateStr + 'T00:00:00');
      return {
        date: dateObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
        views_count: 0,
        applications_count: 0,
        rawDate: dateStr // Keep raw date for matching
      };
    });

    // Set initial data to ensure chart renders axes even if fetch fails
    setData(baseData);

    try {
      setLoading(true);
      const metrics = await getJobAdMetrics(jobAdId);
      
      // Merge with metrics
      const chartData = baseData.map(item => {
        const metric = metrics.find(m => m.date === item.rawDate);
        return {
          date: item.date,
          views_count: metric?.views_count || 0,
          applications_count: metric?.applications_count || 0
        };
      });

      setData(chartData);
    } catch (err) {
      console.error('Error loading metrics:', err);
      // Keep baseData (zeros) if error occurs
    } finally {
      setLoading(false);
    }
  }, [jobAdId]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const showSpinner = loading || !isReady;
  const hasData = data.length > 0;

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Actividad Reciente</h3>
      <div ref={containerRef} className="w-full h-[250px] min-h-[250px]">
        {showSpinner && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        {!showSpinner && hasData && (
          <AreaChart
            width={dimensions.width}
            height={dimensions.height}
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#6b7280' }} 
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#6b7280' }} 
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Area 
              type="monotone" 
              dataKey="views_count" 
              name="Visitas"
              stroke="#3b82f6" 
              fill="url(#colorViews)" 
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="applications_count" 
              name="Candidatos"
              stroke="#10b981" 
              fill="url(#colorApps)" 
              strokeWidth={2}
            />
          </AreaChart>
        )}
      </div>
    </div>
  );
}
