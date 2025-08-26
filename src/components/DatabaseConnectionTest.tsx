import React, { useEffect, useState } from 'react'
import { testDatabaseConnections, testZoneAnalysisData } from '../utils/databaseTest'

interface ConnectionResult {
  connected: boolean
  error: string | null
  tableExists: boolean
  recordCount: number
}

interface TestResults {
  water: ConnectionResult
  electricity: ConnectionResult
  stp: ConnectionResult
  hvac: ConnectionResult
  firefighting: ConnectionResult
}

export const DatabaseConnectionTest: React.FC = () => {
  const [results, setResults] = useState<TestResults | null>(null)
  const [zoneResults, setZoneResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    try {
      console.log('🚀 Starting database connection tests...')
      const connectionResults = await testDatabaseConnections()
      const zoneAnalysisResults = await testZoneAnalysisData()
      
      setResults(connectionResults)
      setZoneResults(zoneAnalysisResults)
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (connected: boolean) => connected ? '✅' : '❌'
  const getStatusColor = (connected: boolean) => connected ? 'text-green-600' : 'text-red-600'

  if (loading) {
    return (
      <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50 max-w-sm">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm">Testing database connections...</span>
        </div>
      </div>
    )
  }

  if (!results) return null

  return (
    <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50 max-w-md border border-gray-200 dark:border-gray-700">
      <div className="mb-3">
        <h3 className="font-semibold text-sm mb-2">Database Connection Status</h3>
        <div className="space-y-1">
          {Object.entries(results).map(([module, result]) => (
            <div key={module} className="flex items-center justify-between text-xs">
              <span className="font-medium capitalize">{module}:</span>
              <div className="flex items-center gap-1">
                <span className={getStatusColor(result.connected)}>
                  {getStatusIcon(result.connected)} {result.connected ? 'Connected' : 'Failed'}
                </span>
                {result.connected && (
                  <span className="text-gray-500">({result.recordCount} records)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {zoneResults && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
          <h4 className="font-semibold text-sm mb-2">Zone Analysis Data</h4>
          <div className="text-xs space-y-1">
            <div>Total Meters: {zoneResults.totalMeters}</div>
            <div>Available Zones: {zoneResults.zones?.length || 0}</div>
            <div className={`${zoneResults.zone08Count > 0 ? 'text-green-600' : 'text-orange-600'}`}>
              Zone_08 Meters: {zoneResults.zone08Count}
            </div>
            {zoneResults.zones && zoneResults.zones.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                  View all zones ({zoneResults.zones.length})
                </summary>
                <div className="mt-1 ml-2 text-gray-600 max-h-20 overflow-y-auto">
                  {zoneResults.zones.map((zone: string, index: number) => (
                    <div key={index} className="text-xs">{zone}</div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      <button 
        onClick={runTests}
        className="mt-3 w-full bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600 transition-colors"
      >
        Refresh Tests
      </button>
    </div>
  )
}

export default DatabaseConnectionTest