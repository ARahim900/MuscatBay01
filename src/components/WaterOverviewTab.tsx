import React, { useState, useEffect } from 'react'
import { Droplets, ChevronsRight, Home, User, Download } from 'lucide-react'
import { fetchWaterMeters, calculateWaterMetrics, type WaterMeter } from '../lib/waterData'

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-[#2C2834] rounded-xl shadow-md hover:shadow-xl border border-gray-200/80 dark:border-white/10 p-4 md:p-6 transition-all duration-300 hover:-translate-y-1 ${className}`}>
    {children}
  </div>
)

export const WaterOverviewTab = () => {
  const [waterMeters, setWaterMeters] = useState<WaterMeter[]>([])
  const [metrics, setMetrics] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const loadData = async () => {
      try {
        const meters = await fetchWaterMeters()
        const calculatedMetrics = calculateWaterMetrics(meters)
        setWaterMeters(meters)
        setMetrics(calculatedMetrics)
      } catch (error) {
        console.error('Error loading water data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const exportToCSV = () => {
    const headers = ['Meter Label', 'Account #', 'Zone', 'Type', 'Parent Meter', 'Level', 'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Total']
    const csvData = waterMeters.map(meter => [
      meter.meter_label,
      meter.account_number,
      meter.zone,
      meter.type,
      meter.parent_meter,
      meter.label,
      meter.jan_25,
      meter.feb_25,
      meter.mar_25,
      meter.apr_25,
      meter.may_25,
      meter.jun_25,
      meter.jan_25 + meter.feb_25 + meter.mar_25 + meter.apr_25 + meter.may_25 + meter.jun_25
    ])
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'water_meters_overview.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const paginatedMeters = waterMeters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(waterMeters.length / itemsPerPage)

  if (loading) {
    return <div className="text-center p-8">Loading water meter data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Meter Inventory */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#4E4456] dark:text-white">Meter Inventory</h3>
          <p className="text-sm text-gray-500">Total: {metrics.totalMeters} meters</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-lg bg-blue-100 dark:bg-white/5 flex items-center gap-4">
            <div className="bg-blue-500/20 p-2 rounded-full">
              <Droplets className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-xl text-[#4E4456] dark:text-white">{metrics.totalMeters}</p>
              <p className="text-xs text-gray-500">TOTAL</p>
              <p className="text-xs text-gray-400">All levels</p>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-purple-100 dark:bg-white/5 flex items-center gap-4">
            <div className="bg-purple-500/20 p-2 rounded-full">
              <Droplets className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="font-bold text-xl text-[#4E4456] dark:text-white">{metrics.l1Count}</p>
              <p className="text-xs text-gray-500">L1 NAMA</p>
              <p className="text-xs text-gray-400">Main source</p>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-indigo-100 dark:bg-white/5 flex items-center gap-4">
            <div className="bg-indigo-500/20 p-2 rounded-full">
              <Droplets className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="font-bold text-xl text-[#4E4456] dark:text-white">{metrics.l2Count}</p>
              <p className="text-xs text-gray-500">L2 ZONES</p>
              <p className="text-xs text-gray-400">Zone bulk</p>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-green-100 dark:bg-white/5 flex items-center gap-4">
            <div className="bg-green-500/20 p-2 rounded-full">
              <Droplets className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="font-bold text-xl text-[#4E4456] dark:text-white">{metrics.l3Count}</p>
              <p className="text-xs text-gray-500">L3 BUILDINGS</p>
              <p className="text-xs text-gray-400">Bulks/Villas</p>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-yellow-100 dark:bg-white/5 flex items-center gap-4">
            <div className="bg-yellow-500/20 p-2 rounded-full">
              <Droplets className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="font-bold text-xl text-[#4E4456] dark:text-white">{metrics.l4Count}</p>
              <p className="text-xs text-gray-500">L4 APARTMENTS</p>
              <p className="text-xs text-gray-400">Individual</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-orange-100 dark:bg-white/5 flex items-center gap-4">
            <div className="bg-orange-500/20 p-2 rounded-full">
              <Droplets className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-xl text-[#4E4456] dark:text-white">{metrics.dcCount}</p>
              <p className="text-xs text-gray-500">DC DIRECT</p>
              <p className="text-xs text-gray-400">Connections</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Water System Flow Analysis */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#4E4456] dark:text-white">Water System Flow Analysis</h3>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500">Live Data</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* A1 - NAMA Input */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500/20 p-3 rounded-full">
                <Home className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">A1</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">NAMA Input</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-[#4E4456] dark:text-white">{metrics.A1?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">m³ total consumption</p>
              <div className="text-xs text-purple-600 dark:text-purple-400">L1 Main Source</div>
            </div>
          </div>

          {/* A2 - Zone Distribution */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-indigo-500/20 p-3 rounded-full">
                <ChevronsRight className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">A2</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">Zone Distribution</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-[#4E4456] dark:text-white">{metrics.A2?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">m³ total consumption</p>
              <div className="text-xs text-indigo-600 dark:text-indigo-400">L2 Zones + DC</div>
            </div>
          </div>

          {/* A3 Bulk */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/20 p-3 rounded-full">
                <Droplets className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">A3</p>
                <p className="text-xs text-green-600 dark:text-green-400">Bulk Distribution</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-[#4E4456] dark:text-white">{metrics.A3_Bulk?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">m³ total consumption</p>
              <div className="text-xs text-green-600 dark:text-green-400">L3 Buildings + DC</div>
            </div>
          </div>

          {/* A3 Individual */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-500/20 p-3 rounded-full">
                <User className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">A3</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Individual</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-[#4E4456] dark:text-white">{metrics.A3_Individual?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">m³ total consumption</p>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">L4 + L3 + DC</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Loss Analysis */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#4E4456] dark:text-white">Loss Tracking Analysis</h3>
          <div className="text-sm text-gray-500">
            System Efficiency: <span className="font-semibold text-green-600">{metrics.System_Efficiency?.toFixed(1) || 0}%</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stage 1 Loss */}
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-700/30">
            <div className="text-center">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">Stage 1 Loss</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">A1 → A2 (Main Network)</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{metrics.Stage1_Loss?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-500">m³</p>
              <div className="mt-3 bg-red-100 dark:bg-red-800/30 rounded-full px-3 py-1">
                <span className="text-sm font-semibold text-red-700 dark:text-red-300">{metrics.Stage1_Loss_Percentage?.toFixed(1) || 0}%</span>
              </div>
            </div>
          </div>

          {/* Stage 2 Individual Loss */}
          <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-700/30">
            <div className="text-center">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2">Stage 2 Individual</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">A2 → A3 (Zone + Building)</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{metrics.Stage2_Loss_Individual?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-500">m³</p>
              <div className="mt-3 bg-orange-100 dark:bg-orange-800/30 rounded-full px-3 py-1">
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">{metrics.Stage2_Individual_Loss_Percentage?.toFixed(1) || 0}%</span>
              </div>
            </div>
          </div>

          {/* Stage 3 Loss */}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-200 dark:border-amber-700/30">
            <div className="text-center">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">Stage 3 Loss</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">A3 Bulk → Individual</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{metrics.Stage3_Loss?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-500">m³</p>
              <div className="mt-3 bg-amber-100 dark:bg-amber-800/30 rounded-full px-3 py-1">
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{metrics.Stage3_Loss_Percentage?.toFixed(1) || 0}%</span>
              </div>
            </div>
          </div>

          {/* Total Loss */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700/30">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Total System Loss</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">A1 → A3 Individual</p>
              <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">{metrics.Total_Loss?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-500">m³</p>
              <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{metrics.Total_Loss_Percentage?.toFixed(1) || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#4E4456] dark:text-white">Water System Database</h3>
          <button 
            onClick={exportToCSV}
            className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-green-600 transition-all active:scale-95"
          >
            <Download className="h-4 w-4" /> Export to CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-white/5">
              <tr>
                {['Meter Label', 'Account #', 'Zone', 'Type', 'Parent Meter', 'Level', 'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Total'].map(h => 
                  <th key={h} className="px-4 py-3">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedMeters.map((meter) => {
                const total = meter.jan_25 + meter.feb_25 + meter.mar_25 + meter.apr_25 + meter.may_25 + meter.jun_25
                return (
                  <tr key={meter.id} className="border-b dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-2 font-medium">{meter.meter_label}</td>
                    <td className="px-4 py-2">{meter.account_number}</td>
                    <td className="px-4 py-2">{meter.zone}</td>
                    <td className="px-4 py-2">{meter.type}</td>
                    <td className="px-4 py-2">{meter.parent_meter}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        meter.label === 'L1' ? 'bg-purple-100 text-purple-800' :
                        meter.label === 'L2' ? 'bg-blue-100 text-blue-800' :
                        meter.label === 'L3' ? 'bg-green-100 text-green-800' :
                        meter.label === 'L4' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {meter.label}
                      </span>
                    </td>
                    <td className="px-4 py-2">{meter.jan_25?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2">{meter.feb_25?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2">{meter.mar_25?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2">{meter.apr_25?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2">{meter.may_25?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2">{meter.jun_25?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 font-semibold">{total.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <p>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, waterMeters.length)} of {waterMeters.length} meters</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1">Page {currentPage} of {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}