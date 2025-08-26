import { supabase, type WaterMeter } from './supabase'

export const fetchWaterMeters = async (): Promise<WaterMeter[]> => {
  console.log('=== SUPABASE CONNECTION TEST ===')
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('Supabase Key (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
  
  const { data, error } = await supabase
    .from('water_meters')
    .select('*')
    .order('id')

  if (error) {
    console.error('=== SUPABASE ERROR ===')
    console.error('Error details:', error)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    throw error
  }

  console.log('=== SUPABASE SUCCESS ===')
  console.log('Data fetched successfully, total records:', data?.length || 0)

  // Debug: Log sample data to understand structure
  if (data && data.length > 0) {
    console.log('=== WATER METER DEBUG INFO ===')
    console.log('Total Records:', data.length)
    console.log('Sample Record:', data[0])
    
    const uniqueTypes = [...new Set(data.map(m => m.type).filter(Boolean))]
    console.log('All Unique Types:', uniqueTypes)
    
    const typeCounts = data.reduce((acc, meter) => {
      const type = meter.type || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log('Type Counts:', typeCounts)
    
    // Check for irrigation meters with various possible names
    const irrigationMeters = data.filter(m => {
      if (!m.type) return false
      const type = m.type.toLowerCase()
      return type.includes('irrigation') || 
             type.includes('irrigat') || 
             type.includes('garden') ||
             type.includes('landscape') ||
             type.includes('irrig')
    })
    console.log('Irrigation Meters Found:', irrigationMeters.length)
    if (irrigationMeters.length > 0) {
      console.log('Irrigation Sample:', irrigationMeters[0])
      console.log('Irrigation Jan-25 values:', irrigationMeters.map(m => ({
        label: m.meter_label,
        type: m.type,
        jan25: m.jan_25
      })))
    } else {
      console.log('NO IRRIGATION METERS FOUND - Available types:', uniqueTypes)
    }
    
    // Check for any meters with consumption data
    const metersWithData = data.filter(m => 
      (m.jan_25 && m.jan_25 > 0) || 
      (m.feb_25 && m.feb_25 > 0) || 
      (m.mar_25 && m.mar_25 > 0)
    )
    console.log('Meters with consumption data:', metersWithData.length)
    console.log('=== END DEBUG INFO ===')
  }

  return data || []
}

export const calculateWaterMetrics = (meters: WaterMeter[]) => {
  console.log('=== WATER METRICS CALCULATION ===')
  
  // Filter meters by level 
  const l1Meters = meters.filter(m => m.label === 'L1') // NAMA Main source
  const l2Meters = meters.filter(m => m.label === 'L2') // Zone Bulks
  const l3Meters = meters.filter(m => m.label === 'L3') // Building Bulks + Villas  
  const l4Meters = meters.filter(m => m.label === 'L4') // Apartments
  const dcMeters = meters.filter(m => m.label === 'DC') // Direct Connections
  
  console.log('Meter distribution:', {
    L1: l1Meters.length,
    L2: l2Meters.length, 
    L3: l3Meters.length,
    L4: l4Meters.length,
    DC: dcMeters.length
  })

  // Helper function to calculate total consumption for a set of meters
  const calculateTotal = (meterArray: WaterMeter[]) => {
    return meterArray.reduce((sum, meter) => 
      sum + (meter.jan_25 + meter.feb_25 + meter.mar_25 + meter.apr_25 + meter.may_25 + meter.jun_25), 0)
  }

  // === DATA FLOW CALCULATIONS PER YOUR ARCHITECTURE ===
  
  // A1 = L1 (NAMA) - Main water input to system
  const A1 = calculateTotal(l1Meters)
  
  // A2 = L2 (Zone Bulks) + DC (Direct Connections) - After main distribution network
  const A2 = calculateTotal(l2Meters) + calculateTotal(dcMeters)
  
  // A3 (Bulk) = L3 (Building Bulks + Villas) + DC - Zone network distribution only
  const A3_Bulk = calculateTotal(l3Meters) + calculateTotal(dcMeters)
  
  // A3 (Individual) = L4 (Apartments) + L3 Villas + DC - Total individual consumption
  const A3_Individual = calculateTotal(l4Meters) + calculateTotal(l3Meters) + calculateTotal(dcMeters)

  // === LOSS TRACKING COMPONENTS PER YOUR SPECIFICATIONS ===
  
  // Stage 1: Main distribution network loss (A1 → A2)
  const Stage1_Loss = A1 - A2
  
  // Stage 2 (Bulk): Zone network losses only (A2 → A3 Bulk) 
  const Stage2_Loss_Bulk = A2 - A3_Bulk
  
  // Stage 2 (Individual): Total zone + building losses (A2 → A3 Individual)
  const Stage2_Loss_Individual = A2 - A3_Individual
  
  // Stage 3: Building internal losses (A3 Bulk → A3 Individual)
  const Stage3_Loss = A3_Bulk - A3_Individual

  // Total system losses
  const Total_Loss = Stage1_Loss + Stage2_Loss_Individual

  // === EFFICIENCY CALCULATIONS ===
  
  const Stage1_Loss_Percentage = A1 > 0 ? (Stage1_Loss / A1) * 100 : 0
  const Stage2_Bulk_Loss_Percentage = A2 > 0 ? (Stage2_Loss_Bulk / A2) * 100 : 0
  const Stage2_Individual_Loss_Percentage = A2 > 0 ? (Stage2_Loss_Individual / A2) * 100 : 0
  const Stage3_Loss_Percentage = A3_Bulk > 0 ? (Stage3_Loss / A3_Bulk) * 100 : 0
  const Total_Loss_Percentage = A1 > 0 ? (Total_Loss / A1) * 100 : 0
  const System_Efficiency = A1 > 0 ? (A3_Individual / A1) * 100 : 0

  // Log calculations for debugging
  console.log('=== CALCULATED VALUES ===')
  console.log(`A1 (NAMA): ${A1.toLocaleString()} m³`)
  console.log(`A2 (L2 + DC): ${A2.toLocaleString()} m³`)
  console.log(`A3 Bulk (L3 + DC): ${A3_Bulk.toLocaleString()} m³`)
  console.log(`A3 Individual (L4 + L3 + DC): ${A3_Individual.toLocaleString()} m³`)
  console.log('=== LOSSES ===')
  console.log(`Stage 1 Loss: ${Stage1_Loss.toLocaleString()} m³ (${Stage1_Loss_Percentage.toFixed(1)}%)`)
  console.log(`Stage 2 Bulk Loss: ${Stage2_Loss_Bulk.toLocaleString()} m³ (${Stage2_Bulk_Loss_Percentage.toFixed(1)}%)`)
  console.log(`Stage 2 Individual Loss: ${Stage2_Loss_Individual.toLocaleString()} m³ (${Stage2_Individual_Loss_Percentage.toFixed(1)}%)`)
  console.log(`Stage 3 Loss: ${Stage3_Loss.toLocaleString()} m³ (${Stage3_Loss_Percentage.toFixed(1)}%)`)
  console.log(`Total Loss: ${Total_Loss.toLocaleString()} m³ (${Total_Loss_Percentage.toFixed(1)}%)`)
  console.log(`System Efficiency: ${System_Efficiency.toFixed(1)}%`)

  return {
    // Basic counts
    totalMeters: meters.length,
    l1Count: l1Meters.length,
    l2Count: l2Meters.length,
    l3Count: l3Meters.length,
    l4Count: l4Meters.length,
    dcCount: dcMeters.length,
    
    // Flow values (your architecture)
    A1,                    // L1 NAMA
    A2,                    // L2 + DC
    A3_Bulk,              // L3 + DC (zone network)
    A3_Individual,        // L4 + L3 + DC (individual consumption)
    
    // Loss tracking (your specifications)
    Stage1_Loss,                    // A1 → A2
    Stage2_Loss_Bulk,              // A2 → A3 Bulk
    Stage2_Loss_Individual,        // A2 → A3 Individual
    Stage3_Loss,                   // A3 Bulk → A3 Individual
    Total_Loss,                    // Total system loss
    
    // Percentages
    Stage1_Loss_Percentage,
    Stage2_Bulk_Loss_Percentage,
    Stage2_Individual_Loss_Percentage, 
    Stage3_Loss_Percentage,
    Total_Loss_Percentage,
    System_Efficiency
  }
}

export const getMonthlyData = (meters: WaterMeter[], months: string[]) => {
  return months.map(month => {
    const monthKey = month.toLowerCase().replace('-', '_') as keyof WaterMeter
    const total = meters.reduce((sum, meter) => {
      const value = meter[monthKey]
      return sum + (typeof value === 'number' ? value : 0)
    }, 0)
    return { month, name: month, total } // Add name property for chart XAxis compatibility
  })
}

export const getConsumptionByType = (meters: WaterMeter[]) => {
  const types = [...new Set(meters.map(m => m.type).filter(Boolean))]
  return types.map(type => {
    const typeMeters = meters.filter(m => m.type === type)
    const total = typeMeters.reduce((sum, meter) => 
      sum + (meter.jan_25 + meter.feb_25 + meter.mar_25 + meter.apr_25 + meter.may_25 + meter.jun_25), 0
    )
    return { type, total, count: typeMeters.length }
  })
}

// Month mapping for filtering
export const monthMapping = [
  'jan_25', 'feb_25', 'mar_25', 'apr_25', 'may_25', 'jun_25', 'jul_25'
] as const

export const monthLabels = [
  'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25'
] as const

// Filter data by date range
export const filterByDateRange = (meters: WaterMeter[], startMonth: number, endMonth: number) => {
  const selectedMonths = monthMapping.slice(startMonth, endMonth + 1)
  return {
    filteredMeters: meters,
    selectedMonths: selectedMonths as (keyof WaterMeter)[],
    monthLabels: monthLabels.slice(startMonth, endMonth + 1)
  }
}

// Calculate total consumption for selected months
export const calculateTotalForMonths = (meter: WaterMeter, monthKeys: (keyof WaterMeter)[]) => {
  return monthKeys.reduce((sum, monthKey) => {
    const value = meter[monthKey]
    return sum + (typeof value === 'number' ? value : 0)
  }, 0)
}

// Get monthly breakdown for charts
export const getMonthlyBreakdown = (meters: WaterMeter[], startMonth: number, endMonth: number, filterBy?: { type?: string, zone?: string, label?: string }) => {
  const { selectedMonths, monthLabels: labels } = filterByDateRange(meters, startMonth, endMonth)
  
  let filteredMeters = meters
  if (filterBy?.type) {
    const searchType = filterBy.type.toLowerCase()
    filteredMeters = filteredMeters.filter(m => {
      if (!m.type) return false
      
      const meterType = m.type.toLowerCase()
      
      // Handle different possible type names (matches database types)
      if (searchType === 'irrigation') {
        return meterType.includes('irr_servies') || 
               meterType.includes('irrigation') || 
               meterType.includes('irrigat') || 
               meterType.includes('garden') ||
               meterType.includes('landscape')
      }
      
      if (searchType === 'commercial') {
        return meterType.includes('retail') ||
               meterType.includes('commercial') || 
               meterType.includes('business') ||
               meterType.includes('office')
      }
      
      if (searchType === 'residential') {
        return meterType.includes('residential') || 
               meterType.includes('villa') ||
               meterType.includes('apart') ||
               meterType.includes('house') ||
               meterType.includes('home')
      }
      
      if (searchType === 'common') {
        return meterType.includes('mb_common') ||
               meterType.includes('d_building_common') ||
               meterType.includes('common') || 
               meterType.includes('shared') ||
               meterType.includes('community')
      }
      
      if (searchType === 'building') {
        return meterType.includes('building') ||
               meterType.includes('d_building') ||
               meterType.includes('structure')
      }
      
      if (searchType === 'bulk') {
        return meterType.includes('bulk') ||
               meterType.includes('main bulk') ||
               meterType.includes('zone bulk')
      }
      
      // Fallback to partial match
      return meterType.includes(searchType)
    })
    console.log(`getMonthlyBreakdown: Found ${filteredMeters.length} meters for type: ${filterBy.type}`)
  }
  if (filterBy?.zone) {
    filteredMeters = filteredMeters.filter(m => m.zone === filterBy.zone)
  }
  if (filterBy?.label) {
    filteredMeters = filteredMeters.filter(m => m.label === filterBy.label)
  }

  return selectedMonths.map((monthKey, index) => ({
    month: labels[index],
    name: labels[index], // Add name property for chart XAxis compatibility
    consumption: filteredMeters.reduce((sum, meter) => {
      const value = meter[monthKey]
      return sum + (typeof value === 'number' ? value : 0)
    }, 0)
  }))
}

export const getZoneData = (meters: WaterMeter[], zone: string, startMonth: number = 0, endMonth: number = 6) => {
  const { selectedMonths } = filterByDateRange(meters, startMonth, endMonth)
  const zoneMeters = meters.filter(m => m.zone === zone)
  const zoneBulkMeters = zoneMeters.filter(m => m.label === 'L2')
  const individualMeters = zoneMeters.filter(m => m.label !== 'L2')
  
  const bulkTotal = zoneBulkMeters.reduce((sum, meter) => 
    sum + calculateTotalForMonths(meter, selectedMonths), 0
  )
  
  const individualTotal = individualMeters.reduce((sum, meter) => 
    sum + calculateTotalForMonths(meter, selectedMonths), 0
  )
  
  const waterLoss = bulkTotal - individualTotal
  const efficiency = bulkTotal > 0 ? (individualTotal / bulkTotal) * 100 : 0
  const lossPercentage = bulkTotal > 0 ? (waterLoss / bulkTotal) * 100 : 0
  
  return {
    bulkTotal,
    individualTotal,
    waterLoss,
    efficiency,
    lossPercentage,
    bulkMeters: zoneBulkMeters,
    individualMeters
  }
}

// Enhanced water metrics calculation with date filtering
export const calculateWaterMetricsForRange = (meters: WaterMeter[], startMonth: number, endMonth: number) => {
  const { selectedMonths } = filterByDateRange(meters, startMonth, endMonth)
  
  const l1Meters = meters.filter(m => m.label === 'L1')
  const l2Meters = meters.filter(m => m.label === 'L2')
  const l3Meters = meters.filter(m => m.label === 'L3')
  const l4Meters = meters.filter(m => m.label === 'L4')
  const dcMeters = meters.filter(m => m.label === 'DC')

  // Calculate totals for selected date range
  const A1 = l1Meters.reduce((sum, meter) => sum + calculateTotalForMonths(meter, selectedMonths), 0)
  const A2 = l2Meters.reduce((sum, meter) => sum + calculateTotalForMonths(meter, selectedMonths), 0) +
             dcMeters.reduce((sum, meter) => sum + calculateTotalForMonths(meter, selectedMonths), 0)
  const A3_Individual = l3Meters.reduce((sum, meter) => sum + calculateTotalForMonths(meter, selectedMonths), 0) +
                        l4Meters.reduce((sum, meter) => sum + calculateTotalForMonths(meter, selectedMonths), 0) +
                        dcMeters.reduce((sum, meter) => sum + calculateTotalForMonths(meter, selectedMonths), 0)
  const A4 = l4Meters.reduce((sum, meter) => sum + calculateTotalForMonths(meter, selectedMonths), 0) +
             l3Meters.filter(m => m.type?.toLowerCase().includes('end')).reduce((sum, meter) => sum + calculateTotalForMonths(meter, selectedMonths), 0)

  // Loss calculations
  const Stage1_Loss = A1 - A2
  const Stage2_Loss = A2 - A3_Individual
  const L3_Building_Bulks_Total = l3Meters.filter(m => !m.type?.toLowerCase().includes('end')).reduce((sum, meter) => sum + calculateTotalForMonths(meter, selectedMonths), 0)
  const L4_Total = l4Meters.reduce((sum, meter) => sum + calculateTotalForMonths(meter, selectedMonths), 0)
  const Stage3_Loss = L3_Building_Bulks_Total - L4_Total
  const Total_Loss = Stage1_Loss + Stage2_Loss

  // Percentages
  const Stage1_Loss_Percentage = A1 > 0 ? (Stage1_Loss / A1) * 100 : 0
  const Stage2_Loss_Percentage = A2 > 0 ? (Stage2_Loss / A2) * 100 : 0
  const Stage3_Loss_Percentage = L3_Building_Bulks_Total > 0 ? (Stage3_Loss / L3_Building_Bulks_Total) * 100 : 0
  const Total_Loss_Percentage = A1 > 0 ? (Total_Loss / A1) * 100 : 0

  return {
    totalMeters: meters.length,
    l1Count: l1Meters.length,
    l2Count: l2Meters.length,
    l3Count: l3Meters.length,
    l4Count: l4Meters.length,
    dcCount: dcMeters.length,
    A1,
    A2,
    A3_Individual,
    A4,
    Stage1_Loss,
    Stage2_Loss,
    Stage3_Loss,
    Total_Loss,
    Stage1_Loss_Percentage,
    Stage2_Loss_Percentage,
    Stage3_Loss_Percentage,
    Total_Loss_Percentage
  }
}