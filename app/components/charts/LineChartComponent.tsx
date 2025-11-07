
'use client'

import { useEffect, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

type LineChartData = {
  date: string
  value: number
}

type LineChartComponentProps = {
  data: LineChartData[]
  loading?: boolean
  color?: string
  dataKey?: string
  labelKey?: string
}

export function LineChartComponent({ data, loading = false, color = '#FF1556', dataKey = 'value', labelKey = 'date' }: LineChartComponentProps) {
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
        <LineChart
          width={dimensions.width}
          height={dimensions.height}
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" allowDecimals={false} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px' }} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color, r: 4 }} />
        </LineChart>
      )}
    </div>
  )
}
