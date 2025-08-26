import { supabase } from '../lib/supabase'

// Test database connections for all modules
export const testDatabaseConnections = async () => {
  console.log('🔍 Testing Supabase Database Connections...')
  
  const results = {
    water: { connected: false, error: null, tableExists: false, recordCount: 0 },
    electricity: { connected: false, error: null, tableExists: false, recordCount: 0 },
    stp: { connected: false, error: null, tableExists: false, recordCount: 0 },
    hvac: { connected: false, error: null, tableExists: false, recordCount: 0 },
    firefighting: { connected: false, error: null, tableExists: false, recordCount: 0 }
  }

  // Test Water Meters Connection
  try {
    console.log('Testing water_meters table...')
    const { data: waterData, error: waterError } = await supabase
      .from('water_meters')
      .select('*')
      .limit(5)
    
    if (waterError) {
      results.water.error = waterError.message
      console.error('❌ Water meters error:', waterError)
    } else {
      results.water.connected = true
      results.water.tableExists = true
      results.water.recordCount = waterData?.length || 0
      console.log('✅ Water meters connected:', waterData?.length, 'sample records')
    }
  } catch (err) {
    results.water.error = err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ Water meters exception:', err)
  }

  // Test Electricity Meters Connection
  try {
    console.log('Testing electricity_meters table...')
    const { data: elecData, error: elecError } = await supabase
      .from('electricity_meters')
      .select('*')
      .limit(5)
    
    if (elecError) {
      results.electricity.error = elecError.message
      console.error('❌ Electricity meters error:', elecError)
      
      // Try fallback table
      console.log('Trying energy_meters fallback...')
      const { data: energyData, error: energyError } = await supabase
        .from('energy_meters')
        .select('*')
        .limit(5)
      
      if (!energyError && energyData) {
        results.electricity.connected = true
        results.electricity.tableExists = true
        results.electricity.recordCount = energyData.length
        console.log('✅ Energy meters (fallback) connected:', energyData.length, 'records')
      }
    } else {
      results.electricity.connected = true
      results.electricity.tableExists = true
      results.electricity.recordCount = elecData?.length || 0
      console.log('✅ Electricity meters connected:', elecData?.length, 'sample records')
    }
  } catch (err) {
    results.electricity.error = err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ Electricity meters exception:', err)
  }

  // Test STP Operations Connection
  try {
    console.log('Testing stp_operations table...')
    const { data: stpData, error: stpError } = await supabase
      .from('stp_operations')
      .select('*')
      .limit(5)
    
    if (stpError) {
      results.stp.error = stpError.message
      console.error('❌ STP operations error:', stpError)
    } else {
      results.stp.connected = true
      results.stp.tableExists = true
      results.stp.recordCount = stpData?.length || 0
      console.log('✅ STP operations connected:', stpData?.length, 'sample records')
    }
  } catch (err) {
    results.stp.error = err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ STP operations exception:', err)
  }

  // Test HVAC Issues Connection
  try {
    console.log('Testing hvac_issues table...')
    const { data: hvacData, error: hvacError } = await supabase
      .from('hvac_issues')
      .select('*')
      .limit(5)
    
    if (hvacError) {
      results.hvac.error = hvacError.message
      console.error('❌ HVAC issues error:', hvacError)
    } else {
      results.hvac.connected = true
      results.hvac.tableExists = true
      results.hvac.recordCount = hvacData?.length || 0
      console.log('✅ HVAC issues connected:', hvacData?.length, 'sample records')
    }
  } catch (err) {
    results.hvac.error = err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ HVAC issues exception:', err)
  }

  // Test Firefighting Equipment Connection
  try {
    console.log('Testing equipment table...')
    const { data: fireData, error: fireError } = await supabase
      .from('equipment')
      .select('*')
      .limit(5)
    
    if (fireError) {
      results.firefighting.error = fireError.message
      console.error('❌ Firefighting equipment error:', fireError)
    } else {
      results.firefighting.connected = true
      results.firefighting.tableExists = true
      results.firefighting.recordCount = fireData?.length || 0
      console.log('✅ Firefighting equipment connected:', fireData?.length, 'sample records')
    }
  } catch (err) {
    results.firefighting.error = err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ Firefighting equipment exception:', err)
  }

  // Summary
  console.log('\n🔍 DATABASE CONNECTION SUMMARY:')
  console.log('=====================================')
  Object.entries(results).forEach(([module, result]) => {
    const status = result.connected ? '✅ CONNECTED' : '❌ DISCONNECTED'
    console.log(`${module.toUpperCase()}: ${status}`)
    if (result.connected) {
      console.log(`  - Records found: ${result.recordCount}`)
    }
    if (result.error) {
      console.log(`  - Error: ${result.error}`)
    }
  })
  console.log('=====================================\n')

  return results
}

// Test specific Water Zone Analysis data
export const testZoneAnalysisData = async () => {
  console.log('🔍 Testing Zone Analysis Specific Data...')
  
  try {
    // Get all water meters
    const { data: allMeters, error: metersError } = await supabase
      .from('water_meters')
      .select('*')
    
    if (metersError) {
      console.error('❌ Error fetching water meters:', metersError)
      return { success: false, error: metersError.message }
    }

    console.log('✅ Total water meters found:', allMeters?.length || 0)

    // Analyze zones
    const zones = [...new Set(allMeters?.map(m => m.zone).filter(Boolean) || [])]
    console.log('🏗️ Available zones:', zones)

    // Check Zone_08 specifically (as mentioned in your concern)
    const zone08Meters = allMeters?.filter(m => m.zone === 'Zone_08') || []
    console.log('🎯 Zone_08 meters:', zone08Meters.length)
    
    if (zone08Meters.length > 0) {
      console.log('📊 Zone_08 meter types:')
      const zone08Types = [...new Set(zone08Meters.map(m => m.type).filter(Boolean))]
      zone08Types.forEach(type => {
        const count = zone08Meters.filter(m => m.type === type).length
        console.log(`  - ${type}: ${count} meters`)
      })
      
      console.log('📈 Zone_08 sample consumption data:')
      zone08Meters.slice(0, 3).forEach(meter => {
        console.log(`  - ${meter.meter_label}: Jan=${meter.jan_25}, Apr=${meter.apr_25}`)
      })
    } else {
      console.log('⚠️ No meters found for Zone_08')
      console.log('Available zones for comparison:', zones)
    }

    return { 
      success: true, 
      totalMeters: allMeters?.length || 0,
      zones,
      zone08Count: zone08Meters.length
    }
  } catch (err) {
    console.error('❌ Zone analysis test failed:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}