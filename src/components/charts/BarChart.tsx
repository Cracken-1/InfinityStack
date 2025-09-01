'use client'

interface DataPoint {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: DataPoint[]
  height?: number
}

export default function BarChart({ data, height = 200 }: BarChartProps) {
  if (!data.length) return <div className="animate-pulse bg-gray-200 rounded" style={{ height }} />

  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="flex items-end justify-between space-x-2" style={{ height }}>
      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * (height - 40)
        return (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="text-xs text-gray-600 mb-1">{item.value}</div>
            <div
              className={`w-full rounded-t ${item.color || 'bg-primary-500'}`}
              style={{ height: barHeight }}
            />
            <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
              {item.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}