
'use client'

import { useEffect, useRef, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'

type PieChartData = {
  name: string
  value: number
  color: string
}

type PieChartComponentProps = {
  data: PieChartData[]
  loading?: boolean
}

export function PieChartComponent({ data, loading = false }: PieChartComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 320 })
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateSize = () => {
      const width = element.clientWidth
      const height = element.clientHeight || 320
      if (width > 0) {
        setDimensions({ width, height })
        setIsReady(true)
      }
    }

    updateSize()

    // Re-render whenever the container is resized to avoid zero-width charts.
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateSize())
      observer.observe(element)
      return () => observer.disconnect()
    }

    const handleResize = () => updateSize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const hasData = Boolean(data && data.length > 0)
  const showSpinner = loading || !isReady

  return (
    <div ref={containerRef} className="w-full h-[320px]">
      {showSpinner && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {!showSpinner && !hasData && (
        <div className="w-full h-full flex items-center justify-center text-gray-500">
          <p>No hay datos disponibles</p>
        </div>
      )}

      {!showSpinner && hasData && (
        <PieChart width={dimensions.width} height={dimensions.height}>
          <Pie
            data={data}
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            labelLine={false}
            label={(entry: any) => `${entry.name}: ${entry.value}`}
            outerRadius={Math.min(dimensions.width, dimensions.height) / 2.2}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          />
        </PieChart>
      )}
    </div>
  )
}
