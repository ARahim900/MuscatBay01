import React, { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

interface DateRangeSliderProps {
  onRangeChange: (startMonth: number, endMonth: number) => void
  defaultStart?: number
  defaultEnd?: number
  className?: string
}

const months = [
  { label: 'Jan-25', value: 0 },
  { label: 'Feb-25', value: 1 },
  { label: 'Mar-25', value: 2 },
  { label: 'Apr-25', value: 3 },
  { label: 'May-25', value: 4 },
  { label: 'Jun-25', value: 5 },
  { label: 'Jul-25', value: 6 }
]

export const DateRangeSlider: React.FC<DateRangeSliderProps> = ({
  onRangeChange,
  defaultStart = 0,
  defaultEnd = 6,
  className = ''
}) => {
  const [startMonth, setStartMonth] = useState(defaultStart)
  const [endMonth, setEndMonth] = useState(defaultEnd)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onRangeChange(startMonth, endMonth)
      setIsAnimating(false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [startMonth, endMonth, onRangeChange])

  const handleStartChange = (value: number) => {
    setIsAnimating(true)
    setStartMonth(Math.min(value, endMonth))
  }

  const handleEndChange = (value: number) => {
    setIsAnimating(true)
    setEndMonth(Math.max(value, startMonth))
  }

  const resetRange = () => {
    setIsAnimating(true)
    setStartMonth(0)
    setEndMonth(6)
  }

  return (
    <div className={`bg-white dark:bg-[#2C2834] rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 p-2.5 transition-all duration-300 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
            Range:
          </span>
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
            {months[startMonth]?.label} - {months[endMonth]?.label}
          </span>
        </div>

        <div className="flex-1 relative">
          <div className="flex items-center gap-2">
            <select
              value={startMonth}
              onChange={(e) => handleStartChange(parseInt(e.target.value))}
              className="px-2 py-1 text-xs border rounded-md bg-gray-50 dark:bg-white/10 transition-all duration-200"
            >
              {months.slice(0, endMonth + 1).map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
            <span className="text-xs text-gray-500">to</span>
            <select
              value={endMonth}
              onChange={(e) => handleEndChange(parseInt(e.target.value))}
              className="px-2 py-1 text-xs border rounded-md bg-gray-50 dark:bg-white/10 transition-all duration-200"
            >
              {months.slice(startMonth).map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={resetRange}
          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-all duration-200 flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${isAnimating ? 'animate-spin' : ''}`} />
          Reset
        </button>

        {isAnimating && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <div className="w-2 h-2 border border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {/* Compact progress bar */}
      <div className="mt-2 relative h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-green-500 transition-all duration-300"
          style={{
            left: `${(startMonth / 6) * 100}%`,
            width: `${((endMonth - startMonth) / 6) * 100}%`
          }}
        />
      </div>
    </div>
  )
}