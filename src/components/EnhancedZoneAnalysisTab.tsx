import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Activity, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchWaterMeters, monthLabels, type WaterMeter } from '../lib/waterData'

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-[#2C2834] rounded-xl shadow-md hover:shadow-lg border border-gray-200/80 dark:border-white/10 p-4 md:p-6 transition-all duration-200 hover:-translate-y-0.5 ${className}`}>
    {children}
  </div>
)

// Zone mapping for dropdown options - Multiple possible database values for each zone
const ZONE_OPTIONS = [
  { value: 'Main Bulk', label: 'Main Bulk Meter', dbValues: ['Main Bulk', 'MAIN BULK', 'main_bulk'] },
  { value: 'Direct Connection', label: 'Direct Connections', dbValues: ['Direct Connection', 'DIRECT CONNECTION', 'direct_connection'] },
  { value: 'Zone_01_(FM)', label: 'Zone 01(FM)', dbValues: ['Zone_01_(FM)', 'ZONE_01_(FM)', 'Zone 01 (FM)', 'Zone_01_FM', 'Zone 01'] },
  { value: 'Zone_03_(A)', label: 'Zone 03(A)', dbValues: ['Zone_03_(A)', 'ZONE_03_(A)', 'Zone 03 (A)', 'Zone_03_A', 'Zone 03A'] },
  { value: 'Zone_03_(B)', label: 'Zone 03(B)', dbValues: ['Zone_03_(B)', 'ZONE_03_(B)', 'Zone 03 (B)', 'Zone_03_B', 'Zone 03B'] },
  { value: 'Zone_05', label: 'Zone 05', dbValues: ['Zone_05', 'ZONE_05', 'Zone 05', 'Zone05', 'Z05'] },
  { value: 'Zone_08', label: 'Zone 08', dbValues: ['Zone_08', 'ZONE_08', 'Zone 08', 'Zone08', 'Z08', 'Zone_08_(North_Golf)', 'Zone 08 (North Golf)'] },
  { value: 'Zone_VS', label: 'Zone VS', dbValues: ['Zone_VS', 'ZONE_VS', 'Zone VS', 'ZoneVS', 'ZVS'] },
  { value: 'Zone_SC', label: 'Zone SC', dbValues: ['Zone_SC', 'ZONE_SC', 'Zone SC', 'ZoneSC', 'ZSC'] }
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

// Month range slider component
const MonthRangeSelector = ({ startMonth, endMonth, onRangeChange }: {
  startMonth: number
  endMonth: number
  onRangeChange: (start: number, end: number) => void
}) => {
  return (
    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
      <Calendar className="w-4 h-4 text-gray-500" />
      <button
        onClick={() => onRangeChange(Math.max(0, startMonth - 1), endMonth)}
        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors duration-150"
        disabled={startMonth === 0}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2">
        <select
          value={startMonth}
          onChange={(e) => onRangeChange(parseInt(e.target.value), endMonth)}
          className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 transition-colors duration-150"
        >
          {monthLabels.map((month, idx) => (
            <option key={idx} value={idx}>{month}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">to</span>
        <select
          value={endMonth}
          onChange={(e) => onRangeChange(startMonth, parseInt(e.target.value))}
          className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 transition-colors duration-150"
        >
          {monthLabels.map((month, idx) => (
            <option key={idx} value={idx} disabled={idx < startMonth}>{month}</option>
          ))}
        </select>
      </div>
      <button
        onClick={() => onRangeChange(startMonth, Math.min(6, endMonth + 1))}
        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors duration-150"
        disabled={endMonth === 6}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export const EnhancedZoneAnalysisTab = () => {
  const [waterMeters, setWaterMeters] = useState<WaterMeter[]>([])
  const [selectedZone, setSelectedZone] = useState('Zone_03_(A)')
  const [zoneMetrics, setZoneMetrics] = useState<any>({})
  const [zoneMeters, setZoneMeters] = useState<WaterMeter[]>([])
  const [loading, setLoading] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [startMonth, setStartMonth] = useState(0) // Jan-25
  const [endMonth, setEndMonth] = useState(6) // Jul-25
  const [availableZones, setAvailableZones] = useState<string[]>([])
  const [dynamicZoneOptions, setDynamicZoneOptions] = useState(ZONE_OPTIONS)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 Zone Analysis: Loading water meters data...')
        const meters = await fetchWaterMeters()
        setWaterMeters(meters)
        console.log(`📊 Zone Analysis: Loaded ${meters.length} meters`)
        
        // Debug: Show all unique zones in the data
        const uniqueZones = [...new Set(meters.map(meter => meter.zone).filter(Boolean))].sort()
        console.log('🏗️ Available zones in database:', uniqueZones)
        setAvailableZones(uniqueZones)
        
        // Create dynamic zone options based on actual data
        const dynamicOptions = uniqueZones.map(zone => {
          // Try to find matching predefined option
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
            // Create new option for unknown zones
            return {
              value: zone,
              label: zone.replace(/_/g, ' '),
              dbValues: [zone],
              actualDbValue: zone
            }
          }
        })
        
        console.log('🎯 Dynamic zone options created:', dynamicOptions)
        setDynamicZoneOptions(dynamicOptions)
        
        // Debug: Show all labels
        const uniqueLabels = [...new Set(meters.map(meter => meter.label).filter(Boolean))].sort()
        console.log('🏷️ Available labels in database:', uniqueLabels)
        
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
    
    // Get the database values for the selected zone from dynamic options
    const selectedZoneOption = dynamicZoneOptions.find(opt => opt.value === selectedZone)
    const dbZoneValues = selectedZoneOption?.dbValues || [selectedZone]
    const actualDbValue = selectedZoneOption?.actualDbValue
    
    console.log(`🏗️ Calculating metrics for zone: ${selectedZone} (DB: ${dbZoneValues.join(', ')})`)
    
    // Debug: Show available zones and find matches
    const availableZones = waterMeters.map(m => m.zone).filter(Boolean)
    console.log('Available zone values:', [...new Set(availableZones)])
    console.log('Looking for matches:', dbZoneValues)
    
    // Filter meters for the selected zone - use actual database value if available
    let allZoneMeters = []
    
    if (actualDbValue) {
      // Use the actual database value we found during data loading
      allZoneMeters = waterMeters.filter(meter => meter.zone === actualDbValue)
      console.log(`Using actual DB value '${actualDbValue}' - found ${allZoneMeters.length} meters`)
    } else {
      // Fallback to the original matching logic
      allZoneMeters = waterMeters.filter(meter => {
        if (!meter.zone) return false
        
        // Check exact matches first
        if (dbZoneValues.includes(meter.zone)) {
          return true
        }
        
        // Try case-insensitive partial matching
        const meterZone = meter.zone.toLowerCase()
        return dbZoneValues.some(dbValue => {
          const searchZone = dbValue.toLowerCase()
          return meterZone.includes(searchZone) || 
                 searchZone.includes(meterZone) ||
                 meterZone.replace(/[^a-z0-9]/g, '') === searchZone.replace(/[^a-z0-9]/g, '') ||
                 meterZone.includes(searchZone.replace('_', ' ')) ||
                 meterZone.includes(searchZone.replace(' ', '_'))
        })
      })
      console.log(`Using fallback matching - found ${allZoneMeters.length} meters`)
    }
    
    console.log(`Found ${allZoneMeters.length} meters for zone ${selectedZone}:`, allZoneMeters.map(m => ({ meter: m.meter_label, zone: m.zone, label: m.label })))
    
    // Get L2 bulk meters for this zone (zone distribution)
    const zoneBulkMeters = allZoneMeters.filter(meter => meter.label === 'L2')
    
    // Get L3 individual connections for this zone (building level)
    const zoneIndividualL3Meters = allZoneMeters.filter(meter => meter.label === 'L3')
    
    // Calculate totals for selected month range
    const calculateConsumption = (meters: WaterMeter[]) => {
      const monthKeys = ['jan_25', 'feb_25', 'mar_25', 'apr_25', 'may_25', 'jun_25', 'jul_25']
      const selectedMonths = monthKeys.slice(startMonth, endMonth + 1)
      
      return meters.reduce((total, meter) => {
        const monthTotal = selectedMonths.reduce((sum, monthKey) => {
          return sum + ((meter as any)[monthKey] || 0)
        }, 0)
        return total + monthTotal
      }, 0)
    }
    
    const zoneBulkTotal = calculateConsumption(zoneBulkMeters)
    const zoneIndividualTotal = calculateConsumption(zoneIndividualL3Meters)
    const difference = zoneBulkTotal - zoneIndividualTotal
    
    // Calculate maximum value for gauges (for percentage calculation)
    const maxValue = Math.max(zoneBulkTotal, zoneIndividualTotal, Math.abs(difference)) || 1000
    
    console.log(`📊 Zone Metrics for ${selectedZone}:`, {
      zoneBulkTotal,
      zoneIndividualTotal,
      difference,
      bulkMeters: zoneBulkMeters.length,
      individualMeters: zoneIndividualL3Meters.length,
      totalMeters: allZoneMeters.length,
      bulkMeterDetails: zoneBulkMeters.map(m => ({ meter: m.meter_label, consumption: calculateConsumption([m]) })),
      individualMeterDetails: zoneIndividualL3Meters.map(m => ({ meter: m.meter_label, consumption: calculateConsumption([m]) }))
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
  }, [waterMeters, selectedZone, startMonth, endMonth, dynamicZoneOptions])

  // Update data when filters change  
  useEffect(() => {
    calculateZoneMetrics()
  }, [calculateZoneMetrics])

  // Handle zone change
  const handleZoneChange = (newZone: string) => {
    setSelectedZone(newZone)
    setIsAnimating(true)
    setCurrentPage(1)
    setTimeout(() => setIsAnimating(false), 150)
  }
  
  // Handle month range change
  const handleRangeChange = useCallback((newStartMonth: number, newEndMonth: number) => {
    setStartMonth(newStartMonth)
    setEndMonth(newEndMonth)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 150)
  }, [])

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 mr-2">Select Zone</label>
              <select 
                value={selectedZone}
                onChange={(e) => handleZoneChange(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[200px]"
              >
                {dynamicZoneOptions.map(option => {
                  const meterCount = waterMeters.filter(m => 
                    option.dbValues?.some(dbVal => 
                      m.zone?.toLowerCase() === dbVal.toLowerCase() ||
                      m.zone?.toLowerCase().includes(dbVal.toLowerCase())
                    ) || m.zone === option.actualDbValue
                  ).length
                  
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label} ({meterCount} meters)
                    </option>
                  )
                })}
              </select>
            </div>
            <MonthRangeSelector
              startMonth={startMonth}
              endMonth={endMonth}
              onRangeChange={handleRangeChange}
            />
            <button 
              onClick={() => handleZoneChange('Zone_03_(A)')}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 transition-colors duration-150 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} /> Reset
            </button>
          </div>
        </div>
      </Card>

      {/* Zone Metrics with Gauges */}
      <Card className={`transition-opacity duration-200 ${isAnimating ? 'opacity-70' : 'opacity-100'}`}>
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-[#4E4456] dark:text-white mb-2">
            {dynamicZoneOptions.find(opt => opt.value === selectedZone)?.label || selectedZone} Metrics
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
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-white/5">
              <tr>
                {['Meter Label', 'Account Number', 'Zone', 'Type', 'Label', 'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 'Total', 'Status'].map(h => 
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedMeters.map((meter) => {
                const total = (meter.jan_25 || 0) + (meter.feb_25 || 0) + (meter.mar_25 || 0) + (meter.apr_25 || 0) + (meter.may_25 || 0) + (meter.jun_25 || 0)
                const isL2 = meter.label === 'L2'
                const isL3 = meter.label === 'L3'
                const isDC = meter.label === 'DC'
                
                return (
                  <tr 
                    key={meter.id} 
                    className={`border-b dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                      isL2 ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' :
                      isL3 ? 'bg-green-50 dark:bg-green-900/20' :
                      isDC ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{meter.meter_label}</td>
                    <td className="px-4 py-3">{meter.account_number || 'N/A'}</td>
                    <td className="px-4 py-3">{meter.zone}</td>
                    <td className="px-4 py-3">{meter.type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        meter.label === 'L1' ? 'bg-purple-100 text-purple-800' :
                        meter.label === 'L2' ? 'bg-blue-100 text-blue-800' :
                        meter.label === 'L3' ? 'bg-green-100 text-green-800' :
                        meter.label === 'L4' ? 'bg-yellow-100 text-yellow-800' :
                        meter.label === 'DC' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {meter.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">{(meter.jan_25 || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{(meter.feb_25 || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{(meter.mar_25 || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{(meter.apr_25 || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{(meter.may_25 || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{(meter.jun_25 || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold">{total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        total > 100 ? 'bg-green-100 text-green-800' : 
                        total > 0 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {total > 100 ? 'Active' : total > 0 ? 'Low Usage' : 'No Usage'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {/* Enhanced Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, zoneMeters.length)} of {zoneMeters.length} meters
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}