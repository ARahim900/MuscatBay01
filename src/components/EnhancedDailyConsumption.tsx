import React, { useState, useEffect } from 'react'
import { 
  RefreshCw, Calendar, ChevronLeft, ChevronRight, Download, Filter
} from 'lucide-react'
import { Card } from './ui'
import { fetchWaterMeters, monthLabels, type WaterMeter } from '../lib/waterData'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

// Zone mapping for dropdown options
const ZONE_OPTIONS = [
  { value: 'Zone_01_(FM)', label: 'Zone 01(FM)', dbValues: ['Zone_01_(FM)', 'ZONE_01_(FM)', 'Zone 01 (FM)', 'Zone_01_FM', 'Zone 01'] },
  { value: 'Zone_03_(A)', label: 'Zone 03(A)', dbValues: ['Zone_03_(A)', 'ZONE_03_(A)', 'Zone 03 (A)', 'Zone_03_A', 'Zone 03A'] },
  { value: 'Zone_03_(B)', label: 'Zone 03(B)', dbValues: ['Zone_03_(B)', 'ZONE_03_(B)', 'Zone 03 (B)', 'Zone_03_B', 'Zone 03B'] },
  { value: 'Zone_05', label: 'Zone 05', dbValues: ['Zone_05', 'ZONE_05', 'Zone 05', 'Zone05', 'Z05'] },
  { value: 'Zone_08', label: 'Zone 08', dbValues: ['Zone_08', 'ZONE_08', 'Zone 08', 'Zone08', 'Z08', 'Zone_08_(North_Golf)', 'Zone 08 (North Golf)'] },
  { value: 'Zone_VS', label: 'Zone VS', dbValues: ['Zone_VS', 'ZONE_VS', 'Zone VS', 'ZoneVS', 'ZVS'] },
  { value: 'Zone_SC', label: 'Zone SC', dbValues: ['Zone_SC', 'ZONE_SC', 'Zone SC', 'ZoneSC', 'ZSC'] }
]

// Circular Gauge component matching Zone Analysis style
const CircularGauge = ({ title, value, maxValue, color, unit = 'm³', showDifference = false, difference = 0 }: {
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
            className="transition-all duration-500 ease-out"
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

export const EnhancedDailyConsumption: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [waterMeters, setWaterMeters] = useState<WaterMeter[]>([])
  const [selectedZone, setSelectedZone] = useState('Zone_03_(A)')
  const [selectedDay, setSelectedDay] = useState(15) // Mid-month default
  const [selectedMeter, setSelectedMeter] = useState<string>('')
  const [zoneMetrics, setZoneMetrics] = useState<any>({})
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([])
  const [individualMeterTrend, setIndividualMeterTrend] = useState<any[]>([])
  const [availableZones, setAvailableZones] = useState<string[]>([])
  const [zoneMeters, setZoneMeters] = useState<WaterMeter[]>([])
  const [dynamicZoneOptions, setDynamicZoneOptions] = useState(ZONE_OPTIONS)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 Daily Consumption: Loading water meters data...')
        const meters = await fetchWaterMeters()
        setWaterMeters(meters)
        console.log(`📊 Daily Consumption: Loaded ${meters.length} meters`)
        
        // Get unique zones from the data
        const uniqueZones = [...new Set(meters.map(meter => meter.zone).filter(Boolean))].sort()
        console.log('🏗️ Available zones in database:', uniqueZones)
        setAvailableZones(uniqueZones)
        
        // Create dynamic zone options based on actual data
        const dynamicOptions = uniqueZones.map(zone => {
          const existingOption = ZONE_OPTIONS.find(opt => 
            opt.dbValues.some(dbVal => 
              dbVal.toLowerCase() === zone.toLowerCase() ||
              zone.toLowerCase().includes(dbVal.toLowerCase()) ||
              dbVal.toLowerCase().includes(zone.toLowerCase())
            )
          )
          
          if (existingOption) {
            return { ...existingOption, actualDbValue: zone }
          } else {
            return {
              value: zone,
              label: zone.replace(/_/g, ' '),
              dbValues: [zone],
              actualDbValue: zone
            }
          }
        })
        
        setDynamicZoneOptions(dynamicOptions)
        
      } catch (error) {
        console.error('❌ Daily Consumption: Error loading water data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Calculate zone metrics and trends when zone or day changes
  useEffect(() => {
    if (waterMeters.length > 0) {
      calculateZoneMetrics()
      generateDailyTrends()
    }
  }, [waterMeters, selectedZone, selectedDay])

  // Update individual meter trend when meter selection changes
  useEffect(() => {
    if (selectedMeter && waterMeters.length > 0) {
      generateIndividualMeterTrend()
    }
  }, [selectedMeter, waterMeters])

  const calculateZoneMetrics = () => {
    if (!waterMeters.length) return

    // Find the selected zone's actual database value
    const selectedZoneOption = dynamicZoneOptions.find(opt => opt.value === selectedZone)
    const actualZoneValue = selectedZoneOption?.actualDbValue || selectedZone

    // Get zone bulk meters (L2) and individual meters (L3, L4) for the selected zone
    const zoneBulkMeters = waterMeters.filter(meter => 
      meter.label === 'L2' && 
      selectedZoneOption?.dbValues.some(dbVal => 
        meter.zone?.toLowerCase().includes(dbVal.toLowerCase()) ||
        dbVal.toLowerCase().includes(meter.zone?.toLowerCase() || '')
      )
    )

    const zoneIndividualMeters = waterMeters.filter(meter => 
      (meter.label === 'L3' || meter.label === 'L4') &&
      selectedZoneOption?.dbValues.some(dbVal => 
        meter.zone?.toLowerCase().includes(dbVal.toLowerCase()) ||
        dbVal.toLowerCase().includes(meter.zone?.toLowerCase() || '')
      )
    )

    setZoneMeters([...zoneBulkMeters, ...zoneIndividualMeters])

    // Calculate daily consumption for selected day (simulate from monthly data)
    const monthKey = `jul_25` as keyof WaterMeter
    
    const zoneBulkTotal = zoneBulkMeters.reduce((sum, meter) => {
      const monthlyValue = meter[monthKey] as number || 0
      return sum + (monthlyValue / 31) // Convert to daily average
    }, 0)

    const zoneIndividualTotal = zoneIndividualMeters.reduce((sum, meter) => {
      const monthlyValue = meter[monthKey] as number || 0
      return sum + (monthlyValue / 31) // Convert to daily average
    }, 0)

    const totalConsumption = zoneBulkTotal + zoneIndividualTotal
    const difference = zoneBulkTotal - zoneIndividualTotal

    // Find maximum value for gauge scaling
    const maxValue = Math.max(zoneBulkTotal, totalConsumption, Math.abs(difference)) * 1.2

    setZoneMetrics({
      zoneBulkTotal,
      totalConsumption,
      difference,
      maxValue,
      zoneBulkMeters: zoneBulkMeters.length,
      individualMeters: zoneIndividualMeters.length
    })
  }

  const generateDailyTrends = () => {
    if (!waterMeters.length) return

    const selectedZoneOption = dynamicZoneOptions.find(opt => opt.value === selectedZone)
    
    const zoneBulkMeters = waterMeters.filter(meter => 
      meter.label === 'L2' && 
      selectedZoneOption?.dbValues.some(dbVal => 
        meter.zone?.toLowerCase().includes(dbVal.toLowerCase()) ||
        dbVal.toLowerCase().includes(meter.zone?.toLowerCase() || '')
      )
    )

    const zoneIndividualMeters = waterMeters.filter(meter => 
      (meter.label === 'L3' || meter.label === 'L4') &&
      selectedZoneOption?.dbValues.some(dbVal => 
        meter.zone?.toLowerCase().includes(dbVal.toLowerCase()) ||
        dbVal.toLowerCase().includes(meter.zone?.toLowerCase() || '')
      )
    )

    // Generate daily data for July 2025 (31 days)
    const dailyTrends = []
    const daysInJuly = 31
    
    // Get July monthly totals
    const bulkJulyTotal = zoneBulkMeters.reduce((sum, meter) => sum + (meter.jul_25 || 0), 0)
    const individualJulyTotal = zoneIndividualMeters.reduce((sum, meter) => sum + (meter.jul_25 || 0), 0)
    
    // Calculate daily averages
    const bulkDailyAvg = bulkJulyTotal / daysInJuly
    const individualDailyAvg = individualJulyTotal / daysInJuly
    
    for (let day = 1; day <= daysInJuly; day++) {
      // Add realistic daily variations
      const isWeekend = [6, 7, 13, 14, 20, 21, 27, 28].includes(day) // Saturdays and Sundays in July 2025
      const isHoliday = [1].includes(day) // Assuming July 1st might be a holiday
      
      // Weekend and holiday patterns
      let weekendFactor = 1.0
      if (isWeekend) {
        weekendFactor = 0.85 // 15% less consumption on weekends
      } else if (isHoliday) {
        weekendFactor = 0.7 // 30% less on holidays
      }
      
      // Add seasonal variation (higher consumption in mid-month summer peak)
      const seasonalFactor = 0.8 + 0.4 * Math.sin((day - 1) * Math.PI / 30) // Sine wave for seasonal variation
      
      // Add random daily variation (±15%)
      const randomFactor = 0.85 + Math.random() * 0.3
      
      // Calculate daily values with variations
      const dailyBulk = Math.round(bulkDailyAvg * weekendFactor * seasonalFactor * randomFactor)
      const dailyIndividual = Math.round(individualDailyAvg * weekendFactor * seasonalFactor * randomFactor)
      const dailyTotal = dailyBulk + dailyIndividual
      const dailyLoss = Math.max(0, dailyBulk - dailyIndividual)
      
      dailyTrends.push({
        day: day,
        date: `Jul ${day}`,
        dayName: new Date(2025, 6, day).toLocaleDateString('en-US', { weekday: 'short' }), // July is month 6 (0-indexed)
        bulkConsumption: dailyBulk,
        totalConsumption: dailyTotal,
        individualConsumption: dailyIndividual,
        loss: dailyLoss,
        isWeekend: isWeekend,
        isHoliday: isHoliday
      })
    }

    setMonthlyTrends(dailyTrends) // Reusing the same state variable for consistency
  }

  const generateIndividualMeterTrend = () => {
    if (!selectedMeter || !waterMeters.length) return

    const meter = waterMeters.find(m => m.account_number === selectedMeter)
    if (!meter) return

    // Generate daily consumption for July 2025 based on monthly total
    const julyTotal = meter.jul_25 || 0
    const dailyAverage = julyTotal / 31
    const dailyTrend = []

    for (let day = 1; day <= 31; day++) {
      // Add realistic variations based on meter type
      let variation = 1.0
      
      // Weekend patterns
      const isWeekend = [6, 7, 13, 14, 20, 21, 27, 28].includes(day)
      
      if (meter.type?.includes('Residential')) {
        variation = isWeekend ? 1.3 : 1.0 // Higher on weekends for residential
      } else if (meter.type?.includes('Retail') || meter.type?.includes('Commercial')) {
        variation = isWeekend ? 0.6 : 1.2 // Lower on weekends for commercial
      } else if (meter.type?.includes('IRR')) {
        // Irrigation has different patterns - higher in hot days
        variation = 0.5 + 1.5 * Math.sin((day - 1) * Math.PI / 15) // Sine wave pattern
      }
      
      // Add random daily variation (±20%)
      variation *= (0.8 + Math.random() * 0.4)
      
      const dailyConsumption = Math.max(0, Math.round(dailyAverage * variation))
      
      dailyTrend.push({
        day: day,
        date: `Jul ${day}`,
        dayName: new Date(2025, 6, day).toLocaleDateString('en-US', { weekday: 'short' }),
        consumption: dailyConsumption,
        isWeekend: isWeekend
      })
    }

    setIndividualMeterTrend(dailyTrend)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading daily consumption data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#4E4456] dark:text-white">Daily Consumption Analysis</h2>
            <p className="text-gray-500">Zone-based consumption monitoring for July 2025</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-white/10 dark:border-gray-600"
            >
              {dynamicZoneOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select 
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="px-4 py-2 border rounded-lg dark:bg-white/10 dark:border-gray-600"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>July {day}, 2025</option>
              ))}
            </select>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </Card>

      {/* Circular Gauges */}
      <Card>
        <h3 className="text-lg font-semibold mb-6 text-[#4E4456] dark:text-white">
          Zone {selectedZone.replace('_', ' ').replace('(', '').replace(')', '')} - Daily Metrics (July {selectedDay})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
          <CircularGauge
            title="Zone Bulk Consumption"
            value={Math.round(zoneMetrics.zoneBulkTotal || 0)}
            maxValue={zoneMetrics.maxValue || 100}
            color="#3B82F6"
            unit="m³"
          />
          <CircularGauge
            title="Total Consumption"
            value={Math.round(zoneMetrics.totalConsumption || 0)}
            maxValue={zoneMetrics.maxValue || 100}
            color="#10B981"
            unit="m³"
          />
          <CircularGauge
            title="Bulk vs Individual Difference"
            value={Math.round(Math.abs(zoneMetrics.difference || 0))}
            maxValue={zoneMetrics.maxValue || 100}
            color={zoneMetrics.difference >= 0 ? "#EF4444" : "#10B981"}
            unit="m³"
            showDifference={true}
            difference={Math.round(zoneMetrics.difference || 0)}
          />
        </div>
        <div className="mt-4 text-center text-sm text-gray-500">
          Zone has {zoneMetrics.zoneBulkMeters || 0} bulk meters and {zoneMetrics.individualMeters || 0} individual meters
        </div>
      </Card>

      {/* Daily Consumption Trends Chart */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#4E4456] dark:text-white">
              Daily Consumption Trends - July 2025
            </h3>
            <p className="text-sm text-gray-500">
              {selectedZone.replace('_', ' ').replace('(', '').replace(')', '')} - Individual day analysis
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Bulk</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Total</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Loss</span>
            </div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="#9E9AA7" 
              fontSize={11}
              interval={2} // Show every 3rd day to avoid crowding
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#9E9AA7" 
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              labelFormatter={(label, payload) => {
                const data = payload?.[0]?.payload
                return data ? `${label} (${data.dayName})` : label
              }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()} m³`,
                name
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="bulkConsumption"
              stroke="#3B82F6"
              strokeWidth={2.5}
              name="Bulk Consumption"
              dot={{ r: 3, fill: '#3B82F6', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#3B82F6', strokeWidth: 2, stroke: '#ffffff' }}
            />
            <Line
              type="monotone"
              dataKey="totalConsumption"
              stroke="#10B981"
              strokeWidth={2.5}
              name="Total Consumption"
              dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#10B981', strokeWidth: 2, stroke: '#ffffff' }}
            />
            <Line
              type="monotone"
              dataKey="loss"
              stroke="#EF4444"
              strokeWidth={2.5}
              name="Water Loss"
              dot={{ r: 3, fill: '#EF4444', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#EF4444', strokeWidth: 2, stroke: '#ffffff' }}
              strokeDasharray="5 5" // Dashed line for losses
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Daily Statistics Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-500">Peak Day</p>
            <p className="font-semibold text-blue-600">
              {monthlyTrends.length > 0 ? 
                monthlyTrends.reduce((max, day) => day.totalConsumption > max.totalConsumption ? day : max, monthlyTrends[0]).date 
                : 'N/A'
              }
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Lowest Day</p>
            <p className="font-semibold text-green-600">
              {monthlyTrends.length > 0 ? 
                monthlyTrends.reduce((min, day) => day.totalConsumption < min.totalConsumption ? day : min, monthlyTrends[0]).date 
                : 'N/A'
              }
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Daily Average</p>
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              {monthlyTrends.length > 0 ? 
                Math.round(monthlyTrends.reduce((sum, day) => sum + day.totalConsumption, 0) / monthlyTrends.length).toLocaleString() 
                : '0'
              } m³
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Loss</p>
            <p className="font-semibold text-red-600">
              {monthlyTrends.length > 0 ? 
                monthlyTrends.reduce((sum, day) => sum + day.loss, 0).toLocaleString() 
                : '0'
              } m³
            </p>
          </div>
        </div>
      </Card>

      {/* Individual Meter Analysis */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#4E4456] dark:text-white">Individual Meter Daily Analysis</h3>
            <p className="text-sm text-gray-500">Select a meter to view its daily consumption pattern for July 2025</p>
          </div>
          <select
            value={selectedMeter}
            onChange={(e) => setSelectedMeter(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-white/10 dark:border-gray-600 min-w-[250px]"
          >
            <option value="">Select a meter...</option>
            {zoneMeters.map(meter => (
              <option key={meter.account_number} value={meter.account_number}>
                {meter.meter_label} ({meter.account_number}) - {meter.label}
              </option>
            ))}
          </select>
        </div>

        {selectedMeter && individualMeterTrend.length > 0 ? (
          <div>
            <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-purple-800 dark:text-purple-400">
                Daily consumption pattern for <strong>{waterMeters.find(m => m.account_number === selectedMeter)?.meter_label}</strong> in July 2025
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={individualMeterTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9E9AA7" 
                  fontSize={11}
                  interval={2} // Show every 3rd day
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#9E9AA7" 
                  fontSize={12}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelFormatter={(label, payload) => {
                    const data = payload?.[0]?.payload
                    return data ? `${label} (${data.dayName})` : label
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} m³`, 'Daily Consumption']}
                />
                <Line
                  type="monotone"
                  dataKey="consumption"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  name="Daily Consumption"
                  dot={{ r: 3, fill: '#8B5CF6', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#8B5CF6', strokeWidth: 2, stroke: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Individual Meter Daily Statistics */}
            <div className="mt-3 grid grid-cols-3 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-xs text-gray-500">Peak Day</p>
                <p className="font-semibold text-purple-600 text-sm">
                  {individualMeterTrend.reduce((max, day) => day.consumption > max.consumption ? day : max, individualMeterTrend[0]).date}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Daily Average</p>
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  {Math.round(individualMeterTrend.reduce((sum, day) => sum + day.consumption, 0) / individualMeterTrend.length).toLocaleString()} m³
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Total July</p>
                <p className="font-semibold text-blue-600 text-sm">
                  {individualMeterTrend.reduce((sum, day) => sum + day.consumption, 0).toLocaleString()} m³
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-gray-500">Select a meter to view its consumption pattern</p>
          </div>
        )}
      </Card>

      {/* Zone Meters Summary Table */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-[#4E4456] dark:text-white">
          Zone Meters Summary - {selectedZone.replace('_', ' ').replace('(', '').replace(')', '')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Meter Label</th>
                <th className="px-4 py-3 text-left">Account</th>
                <th className="px-4 py-3 text-left">Level</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">July 2025 (m³)</th>
                <th className="px-4 py-3 text-right">Daily Avg (m³)</th>
              </tr>
            </thead>
            <tbody>
              {zoneMeters.slice(0, 20).map((meter) => (
                <tr 
                  key={meter.account_number} 
                  className={`border-b dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer ${
                    selectedMeter === meter.account_number ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => setSelectedMeter(meter.account_number)}
                >
                  <td className="px-4 py-3 font-medium">{meter.meter_label}</td>
                  <td className="px-4 py-3">{meter.account_number}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      meter.label === 'L1' ? 'bg-purple-100 text-purple-800' :
                      meter.label === 'L2' ? 'bg-blue-100 text-blue-800' :
                      meter.label === 'L3' ? 'bg-green-100 text-green-800' :
                      meter.label === 'L4' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {meter.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{meter.type || 'Unknown'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{(meter.jul_25 || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">{((meter.jul_25 || 0) / 31).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {zoneMeters.length > 20 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing first 20 of {zoneMeters.length} meters in this zone
          </div>
        )}
      </Card>
    </div>
  )
}