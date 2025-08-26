import React, { useState, useEffect, useCallback } from 'react'
import { PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Tooltip, ReferenceLine, ReferenceArea } from 'recharts'
import { CheckCircle, RefreshCw, TrendingUp, Activity } from 'lucide-react'
import { fetchWaterMeters, getZoneData, getMonthlyBreakdown, filterByDateRange, monthLabels, type WaterMeter } from '../lib/waterData'

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-[#2C2834] rounded-xl shadow-md hover:shadow-xl border border-gray-200/80 dark:border-white/10 p-4 md:p-6 transition-all duration-300 hover:-translate-y-1 ${className}`}>
    {children}
  </div>
)

const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: any[], label?: string | number }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    const isHighlighted = data?.isHighlighted
    
    return (
      <div className={`bg-white/95 dark:bg-[#1A181F]/95 backdrop-blur-md p-4 rounded-lg shadow-xl border ${
        isHighlighted ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200 dark:border-white/20'
      }`}>
        <p className="label font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {`${label}`}
          {isHighlighted && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Selected Month</span>}
        </p>
        {payload.map((pld, index) => {
          // Skip opacity and highlight fields
          if (pld.dataKey === 'opacity' || pld.dataKey === 'isHighlighted' || pld.dataKey === 'monthIndex') return null
          
          return (
            <div key={index} className="flex items-center justify-between gap-4" style={{ color: pld.color }}>
              <span className="text-sm">{pld.name}:</span>
              <span className="font-medium">{pld.value.toLocaleString()} m³</span>
            </div>
          )
        }).filter(Boolean)}
      </div>
    )
  }
  return null
}

const DonutChart = ({ value, color, title, subtitle }: { value: number, color: string, title: string, subtitle: string }) => (
  <div className="flex flex-col items-center text-center transition-transform duration-300 hover:scale-105">
    <div className="relative w-36 h-36">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie 
            data={[{ name: 'value', value }]} 
            dataKey="value" 
            nameKey="name" 
            cx="50%" 
            cy="50%" 
            innerRadius="75%" 
            outerRadius="100%" 
            fill={color} 
            startAngle={90} 
            endAngle={90 + (value / 100) * 360} 
            paddingAngle={0}
          >
            <Cell fill={color} />
          </Pie>
          <Pie 
            data={[{ name: 'bg', value: 100 }]} 
            dataKey="value" 
            nameKey="name" 
            cx="50%" 
            cy="50%" 
            innerRadius="75%" 
            outerRadius="100%" 
            fill={`${color}20`} 
            startAngle={0} 
            endAngle={360} 
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-[#4E4456] dark:text-white">{title}</span>
      </div>
    </div>
    <div className="mt-3 text-center">
      <h3 className="font-semibold text-lg text-[#4E4456] dark:text-white">{subtitle}</h3>
    </div>
  </div>
)

// Zone mapping for dropdown options
const ZONE_OPTIONS = [
  { value: 'Main Bulk', label: 'Main Bulk Meter', dbValue: 'Main Bulk' },
  { value: 'Direct Connection', label: 'Direct Connections', dbValue: 'Direct Connection' },
  { value: 'Zone_01_(FM)', label: 'Zone 01(FM)', dbValue: 'Zone_01_(FM)' },
  { value: 'Zone_03_(A)', label: 'Zone 03(A)', dbValue: 'Zone_03_(A)' },
  { value: 'Zone_03_(B)', label: 'Zone 03(B)', dbValue: 'Zone_03_(B)' },
  { value: 'Zone_05', label: 'Zone 05', dbValue: 'Zone_05' },
  { value: 'Zone_08', label: 'Zone 08', dbValue: 'Zone_08_(North_Golf)' },
  { value: 'Zone_VS', label: 'Zone VS', dbValue: 'Zone_VS' },
  { value: 'Zone_SC', label: 'Zone SC', dbValue: 'Zone_SC' }
]

// Gauge component for zone metrics
const ZoneGauge = ({ title, value, maxValue, color, unit = 'm³', showDifference = false, difference = 0 }: {
  title: string
  value: number
  maxValue: number
  color: string
  unit?: string
  showDifference?: boolean
  difference?: number
}) => {
  const percentage = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0
  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#4E4456] dark:text-white">
            {value.toLocaleString()}
          </span>
          <span className="text-xs text-gray-500">{unit}</span>
          {showDifference && (
            <span className={`text-xs font-semibold ${difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {difference >= 0 ? '+' : ''}{difference.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <h3 className="mt-2 text-sm font-semibold text-center text-[#4E4456] dark:text-white">
        {title}
      </h3>
    </div>
  )
}

export const ZoneAnalysisTab = () => {
  const [waterMeters, setWaterMeters] = useState<WaterMeter[]>([])
  const [selectedMonth, setSelectedMonth] = useState(3) // Apr-25 (index 3)
  const [selectedZone, setSelectedZone] = useState('Zone_03_(A)')
  const [zoneMetrics, setZoneMetrics] = useState<any>({})
  const [zoneMeters, setZoneMeters] = useState<WaterMeter[]>([])
  const [loading, setLoading] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 Zone Analysis: Loading water meters data...')
        const meters = await fetchWaterMeters()
        setWaterMeters(meters)
        console.log(`📊 Zone Analysis: Loaded ${meters.length} meters`)
      } catch (error) {
        console.error('❌ Zone Analysis: Error loading water data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Calculate zone metrics
  const calculateZoneMetrics = useCallback(() => {
    if (waterMeters.length === 0) return
    
    // Get the database value for the selected zone
    const selectedZoneOption = ZONE_OPTIONS.find(opt => opt.value === selectedZone)
    const dbZoneValue = selectedZoneOption?.dbValue || selectedZone
    
    console.log(`🏗️ Calculating metrics for zone: ${selectedZone} (DB: ${dbZoneValue})`)
    
    // Filter meters for the selected zone
    const allZoneMeters = waterMeters.filter(meter => meter.zone === dbZoneValue)
    
    // Get L2 bulk meters for this zone (zone distribution)
    const zoneBulkMeters = allZoneMeters.filter(meter => meter.label === 'L2')
    
    // Get L3 individual connections for this zone (building level)
    const zoneIndividualL3Meters = allZoneMeters.filter(meter => meter.label === 'L3')
    
    // Calculate totals for selected month range
    const calculateConsumption = (meters: WaterMeter[]) => {
      return meters.reduce((total, meter) => {
        return total + (
          (meter.jan_25 || 0) + (meter.feb_25 || 0) + (meter.mar_25 || 0) +
          (meter.apr_25 || 0) + (meter.may_25 || 0) + (meter.jun_25 || 0)
        )
      }, 0)
    }
    
    const zoneBulkTotal = calculateConsumption(zoneBulkMeters)
    const zoneIndividualTotal = calculateConsumption(zoneIndividualL3Meters)
    const difference = zoneBulkTotal - zoneIndividualTotal
    
    // Calculate maximum value for gauges (for percentage calculation)
    const maxValue = Math.max(zoneBulkTotal, zoneIndividualTotal, Math.abs(difference)) || 1000
    
    console.log(`📊 Zone Metrics:`, {
      zoneBulkTotal,
      zoneIndividualTotal,
      difference,
      bulkMeters: zoneBulkMeters.length,
      individualMeters: zoneIndividualL3Meters.length,
      totalMeters: allZoneMeters.length
    })
    
    setZoneMetrics({
      zoneBulkTotal,
      zoneIndividualTotal,
      difference,
      maxValue,
      bulkMeters: zoneBulkMeters,
      individualMeters: zoneIndividualL3Meters,
      allMeters: allZoneMeters
    })
    
    setZoneMeters(allZoneMeters)
  }, [waterMeters, selectedZone])

  // Update data when filters change  
  useEffect(() => {
    calculateZoneMetrics()
  }, [calculateZoneMetrics])

  // Handle zone change
  const handleZoneChange = (newZone: string) => {
    setSelectedZone(newZone)
    setIsAnimating(true)
    setCurrentPage(1)
    setTimeout(() => setIsAnimating(false), 500)
  }

  // Get paginated meters for the table
  const paginatedMeters = zoneMeters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(zoneMeters.length / itemsPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-lg">Loading zone analysis...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Zone Selection */}
      <Card>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[#4E4456] dark:text-white mb-2">Zone Analysis Dashboard</h3>
            <p className="text-sm text-gray-500">Select a zone to view detailed consumption metrics and meter information</p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 mr-2">Select Zone</label>
              <select 
                value={selectedZone}
                onChange={(e) => handleZoneChange(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[200px]"
              >
                {ZONE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => handleZoneChange('Zone_03_(A)')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} /> Reset
            </button>
          </div>
        </div>
      </Card>

      {/* Zone Metrics with Gauges */}
      <Card className={`transition-all duration-500 ${isAnimating ? 'opacity-70' : 'opacity-100'}`}>
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-[#4E4456] dark:text-white mb-2">
            {ZONE_OPTIONS.find(opt => opt.value === selectedZone)?.label || selectedZone} Metrics
          </h3>
          <p className="text-sm text-gray-500">Zone bulk consumption vs individual L3 connections analysis</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ZoneGauge
            title="Zone Bulk Total"
            value={zoneMetrics.zoneBulkTotal || 0}
            maxValue={zoneMetrics.maxValue || 1000}
            color="#3B82F6"
            unit="m³"
          />
          
          <ZoneGauge
            title="Individual L3 Total"
            value={zoneMetrics.zoneIndividualTotal || 0}
            maxValue={zoneMetrics.maxValue || 1000}
            color="#10B981"
            unit="m³"
          />
          
          <ZoneGauge
            title="Difference"
            value={Math.abs(zoneMetrics.difference || 0)}
            maxValue={zoneMetrics.maxValue || 1000}
            color={zoneMetrics.difference >= 0 ? "#F59E0B" : "#EF4444"}
            unit="m³"
            showDifference={true}
            difference={zoneMetrics.difference || 0}
          />
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">L2 Bulk Meters</p>
            <p className="text-2xl font-bold text-blue-600">{zoneMetrics.bulkMeters?.length || 0}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">L3 Individual Meters</p>
            <p className="text-2xl font-bold text-green-600">{zoneMetrics.individualMeters?.length || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Total Zone Meters</p>
            <p className="text-2xl font-bold text-gray-600">{zoneMeters.length}</p>
          </div>
        </div>
      </Card>

      {/* Dynamic Zone Meters Table */}
      <Card className={`transition-all duration-500 ${isAnimating ? 'opacity-70' : 'opacity-100'}`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-[#4E4456] dark:text-white">
              {ZONE_OPTIONS.find(opt => opt.value === selectedZone)?.label || selectedZone} - All Meters
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Comprehensive meter information for the selected zone ({zoneMeters.length} meters)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <LineChart 
            data={monthlyTrend} 
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            key={`chart-${selectedMonth}-${selectedZone}`} // Force re-render on change
          >
            <defs>
              <linearGradient id="colorBulk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorIndividual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F94144" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#F94144" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.1)" />
            
            <XAxis 
              dataKey="month" 
              stroke="#9E9AA7" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tick={({ x, y, payload }) => {
                const isSelected = monthlyTrend.find(d => d.month === payload.value)?.isHighlighted
                return (
                  <text 
                    x={x} 
                    y={y} 
                    dy={16} 
                    textAnchor="middle" 
                    fill={isSelected ? '#3B82F6' : '#9E9AA7'}
                    fontSize={isSelected ? 13 : 12}
                    fontWeight={isSelected ? 600 : 400}
                  >
                    {payload.value}
                  </text>
                )
              }}
            />
            
            <YAxis 
              stroke="#9E9AA7" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              wrapperStyle={{fontSize: "14px"}}
              iconType="line"
            />
            
            {/* Highlight area for selected month */}
            {monthlyTrend.map((entry, index) => {
              if (entry.isHighlighted) {
                return (
                  <ReferenceArea
                    key={`ref-${index}`}
                    x1={index > 0 ? monthlyTrend[index - 1].month : entry.month}
                    x2={index < monthlyTrend.length - 1 ? monthlyTrend[index + 1].month : entry.month}
                    y1={0}
                    y2={Math.max(...monthlyTrend.map(d => Math.max(d['Zone Bulk'], d['Individual Total'], d['Water Loss'])))}
                    fill="#3B82F6"
                    fillOpacity={0.1}
                    strokeOpacity={0.3}
                  />
                )
              }
              return null
            })}
            
            {/* Zone Bulk Line with area */}
            <Area
              type="monotone"
              dataKey="Zone Bulk"
              stroke="#3B82F6"
              strokeWidth={3}
              fill="url(#colorBulk)"
              fillOpacity={0.3}
              animationDuration={1000}
              animationBegin={0}
              dot={(props) => {
                const { cx, cy, payload } = props
                if (payload.isHighlighted) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="#3B82F6"
                      stroke="#fff"
                      strokeWidth={2}
                      className="animate-pulse"
                    />
                  )
                }
                return <circle cx={cx} cy={cy} r={4} fill="#3B82F6" stroke="#fff" strokeWidth={1} />
              }}
            />
            
            {/* Individual Total Line */}
            <Line
              type="monotone"
              dataKey="Individual Total"
              stroke="#10B981"
              strokeWidth={3}
              strokeDasharray="5 5"
              animationDuration={1000}
              animationBegin={200}
              dot={(props) => {
                const { cx, cy, payload } = props
                if (payload.isHighlighted) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="#10B981"
                      stroke="#fff"
                      strokeWidth={2}
                      className="animate-pulse"
                    />
                  )
                }
                return <circle cx={cx} cy={cy} r={4} fill="#10B981" stroke="#fff" strokeWidth={1} />
              }}
            />
            
            {/* Water Loss Line */}
            <Line
              type="monotone"
              dataKey="Water Loss"
              stroke="#F94144"
              strokeWidth={2}
              strokeDasharray="2 2"
              animationDuration={1000}
              animationBegin={400}
              dot={(props) => {
                const { cx, cy, payload } = props
                if (payload.isHighlighted) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="#F94144"
                      stroke="#fff"
                      strokeWidth={2}
                      className="animate-pulse"
                    />
                  )
                }
                return <circle cx={cx} cy={cy} r={3} fill="#F94144" stroke="#fff" strokeWidth={1} />
              }}
            />
            
            {/* Reference line for selected month */}
            {monthlyTrend.map((entry, index) => {
              if (entry.isHighlighted) {
                return (
                  <ReferenceLine 
                    key={`line-${index}`}
                    x={entry.month} 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    strokeDasharray="8 8"
                    label={{
                      value: "Selected",
                      position: "top",
                      fill: "#3B82F6",
                      fontSize: 12
                    }}
                  />
                )
              }
              return null
            })}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Chart Legend with values */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {monthlyTrend.find(d => d.isHighlighted) && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Zone Bulk</span>
                </div>
                <span className="text-sm font-semibold">
                  {monthlyTrend.find(d => d.isHighlighted)?.['Zone Bulk'].toLocaleString()} m³
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Individual</span>
                </div>
                <span className="text-sm font-semibold">
                  {monthlyTrend.find(d => d.isHighlighted)?.['Individual Total'].toLocaleString()} m³
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Water Loss</span>
                </div>
                <span className="text-sm font-semibold">
                  {monthlyTrend.find(d => d.isHighlighted)?.['Water Loss'].toLocaleString()} m³
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.title} className="flex items-center gap-4">
            <CheckCircle className={`w-8 h-8 ${kpi.color}`} />
            <div>
              <p className="text-sm text-gray-500">{kpi.title}</p>
              <p className="font-bold text-xl text-[#4E4456] dark:text-white">{kpi.value}</p>
              <p className="text-xs text-gray-400">{kpi.subValue}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-[#4E4456] dark:text-white mb-4">Individual Meters - {selectedZone}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-white/5">
              <tr>
                {['Meter Label', 'Account #', 'Type', 'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Total', 'Status'].map(h => 
                  <th key={h} className="px-4 py-3">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {/* Zone bulk meter row - always show at top */}
              {zoneData.bulkMeters?.map((meter: WaterMeter) => (
                <tr key={meter.id} className="bg-blue-50 dark:bg-blue-500/10 font-semibold">
                  <td className="px-4 py-2">{meter.meter_label}</td>
                  <td className="px-4 py-2">{meter.account_number}</td>
                  <td className="px-4 py-2">{meter.type}</td>
                  <td className="px-4 py-2">{meter.jan_25?.toLocaleString()}</td>
                  <td className="px-4 py-2">{meter.feb_25?.toLocaleString()}</td>
                  <td className="px-4 py-2">{meter.mar_25?.toLocaleString()}</td>
                  <td className="px-4 py-2">{meter.apr_25?.toLocaleString()}</td>
                  <td className="px-4 py-2">{meter.may_25?.toLocaleString()}</td>
                  <td className="px-4 py-2">{meter.jun_25?.toLocaleString()}</td>
                  <td className="px-4 py-2">{meter.jul_25?.toLocaleString()}</td>
                  <td className="px-4 py-2">{(meter.jan_25 + meter.feb_25 + meter.mar_25 + meter.apr_25 + meter.may_25 + meter.jun_25 + meter.jul_25).toLocaleString()}</td>
                  <td className="px-4 py-2 text-blue-600">L2 - Zone Bulk</td>
                </tr>
              ))}
              
              {/* Individual meters with pagination */}
              {(() => {
                const individualMeters = zoneData.individualMeters || []
                const totalPages = Math.ceil(individualMeters.length / itemsPerPage)
                const startIndex = (currentPage - 1) * itemsPerPage
                const endIndex = startIndex + itemsPerPage
                const currentMeters = individualMeters.slice(startIndex, endIndex)
                
                return currentMeters.map((meter: WaterMeter) => {
                  const total = meter.jan_25 + meter.feb_25 + meter.mar_25 + meter.apr_25 + meter.may_25 + meter.jun_25 + meter.jul_25
                  const status = total > 10 ? 'Normal' : 'No Usage'
                  
                  return (
                    <tr key={meter.id} className="border-b dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="px-4 py-2 font-medium">{meter.meter_label}</td>
                      <td className="px-4 py-2">{meter.account_number}</td>
                      <td className="px-4 py-2">{meter.type}</td>
                      <td className="px-4 py-2">{meter.jan_25}</td>
                      <td className="px-4 py-2">{meter.feb_25}</td>
                      <td className="px-4 py-2">{meter.mar_25}</td>
                      <td className="px-4 py-2">{meter.apr_25}</td>
                      <td className="px-4 py-2">{meter.may_25}</td>
                      <td className="px-4 py-2">{meter.jun_25}</td>
                      <td className="px-4 py-2">{meter.jul_25}</td>
                      <td className="px-4 py-2 font-semibold">{total}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          status === 'Normal' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              })()}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {(() => {
          const individualMeters = zoneData.individualMeters || []
          const totalPages = Math.ceil(individualMeters.length / itemsPerPage)
          const startIndex = (currentPage - 1) * itemsPerPage
          const endIndex = Math.min(startIndex + itemsPerPage, individualMeters.length)
          
          return (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {individualMeters.length > 0 ? startIndex + 1 : 0} to {endIndex} of {individualMeters.length} individual meters
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1) // Reset to first page when changing items per page
                    }}
                    className="px-2 py-1 border rounded-md text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    {individualMeters.length > 50 && <option value={individualMeters.length}>All ({individualMeters.length})</option>}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {totalPages <= 5 ? (
                    // Show all pages if 5 or less
                    Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md transition-colors ${
                          currentPage === page 
                            ? 'bg-blue-500 text-white' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    ))
                  ) : (
                    // Show abbreviated page numbers for many pages
                    <>
                      {currentPage > 2 && (
                        <>
                          <button
                            onClick={() => setCurrentPage(1)}
                            className="px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            1
                          </button>
                          {currentPage > 3 && <span className="px-2">...</span>}
                        </>
                      )}
                      
                      {Array.from({ length: 3 }, (_, i) => {
                        const page = currentPage - 1 + i
                        if (page > 0 && page <= totalPages) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 rounded-md transition-colors ${
                                currentPage === page 
                                  ? 'bg-blue-500 text-white' 
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        }
                        return null
                      }).filter(Boolean)}
                      
                      {currentPage < totalPages - 1 && (
                        <>
                          {currentPage < totalPages - 2 && <span className="px-2">...</span>}
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className="px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
                
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )
        })()}
      </Card>
    </div>
  )
}