import React, { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Tooltip } from 'recharts'
import { fetchWaterMeters, calculateWaterMetricsForRange, getMonthlyBreakdown, filterByDateRange, monthLabels, type WaterMeter } from '../lib/waterData'
import { ModernDateRangeSlider } from './ui/Slider'
import { KpiCard } from './ui/KpiCard'
import { Droplets, Layers, Building, Users, AlertTriangle, TrendingDown, Activity, Target } from 'lucide-react'

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-[#2C2834] rounded-xl shadow-md hover:shadow-xl border border-gray-200/80 dark:border-white/10 p-4 md:p-6 transition-all duration-300 hover:-translate-y-1 ${className}`}>
    {children}
  </div>
)

const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: any[], label?: string | number }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-[#1A181F]/80 backdrop-blur-md p-3 rounded-lg shadow-lg border border-gray-200 dark:border-white/20">
        <p className="label font-semibold text-gray-800 dark:text-gray-200">{`${label}`}</p>
        {payload.map((pld, index) => (
          <div key={index} style={{ color: pld.color }}>
            {`${pld.name}: ${pld.value.toLocaleString()}`}
          </div>
        ))}
      </div>
    )
  }
  return null
}

export const OverviewTab = () => {
  const [waterMeters, setWaterMeters] = useState<WaterMeter[]>([])
  const [metrics, setMetrics] = useState<any>({})
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [lossData, setLossData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [startMonth, setStartMonth] = useState(0) // Jan-25
  const [endMonth, setEndMonth] = useState(6) // Jul-25
  const [isAnimating, setIsAnimating] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const meters = await fetchWaterMeters()
        setWaterMeters(meters)
      } catch (error) {
        console.error('Error loading water data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Update data when filters change
  const updateFilteredData = useCallback(() => {
    if (waterMeters.length === 0) return

    setIsAnimating(true)
    
    setTimeout(() => {
      // Calculate metrics for selected date range
      const calculatedMetrics = calculateWaterMetricsForRange(waterMeters, startMonth, endMonth)
      
      // Get monthly breakdown for different levels
      const l1Data = getMonthlyBreakdown(waterMeters, startMonth, endMonth, { label: 'L1' })
      const l2Data = getMonthlyBreakdown(waterMeters, startMonth, endMonth, { label: 'L2' })
      const l3Data = getMonthlyBreakdown(waterMeters, startMonth, endMonth, { label: 'L3' })
      
      // Combine monthly data for consumption chart
      const { monthLabels: labels } = filterByDateRange(waterMeters, startMonth, endMonth)
      const monthlyConsumption = labels.map((month, index) => ({
        month,
        name: month, // Add name property for chart XAxis compatibility
        'L1 Main Source': l1Data[index]?.consumption || 0,
        'L2 Zone Bulk Meters': l2Data[index]?.consumption || 0,
        'L3 Building/Villa Meters': l3Data[index]?.consumption || 0
      }))
      
      // Calculate loss data for each month
      const lossDataCalculated = labels.map((month, index) => {
        const l1Value = l1Data[index]?.consumption || 0
        const l2Value = l2Data[index]?.consumption || 0
        const l3Value = l3Data[index]?.consumption || 0
        
        const stage1Loss = Math.max(0, l1Value - l2Value)
        const stage2Loss = Math.max(0, l2Value - l3Value)
        const stage3Loss = Math.max(0, l3Value * 0.003) // 0.3% loss at building level
        
        return {
          month,
          name: month, // Add name property for chart XAxis compatibility
          'Stage 1 Loss': stage1Loss,
          'Stage 2 Loss': stage2Loss,
          'Stage 3 Loss': stage3Loss
        }
      })
      
      setMetrics(calculatedMetrics)
      setMonthlyData(monthlyConsumption)
      setLossData(lossDataCalculated)
      setIsAnimating(false)
    }, 200)
  }, [waterMeters, startMonth, endMonth])

  useEffect(() => {
    updateFilteredData()
  }, [updateFilteredData])

  // Handle date range change
  const handleDateRangeChange = useCallback((newStartMonth: number, newEndMonth: number) => {
    setStartMonth(newStartMonth)
    setEndMonth(newEndMonth)
  }, [])

  if (loading) {
    return <div className="text-center p-8">Loading water loss analysis...</div>
  }

  return (
    <div className="space-y-4">
      {/* Compact Date Range Slider */}
      <ModernDateRangeSlider 
        onRangeChange={handleDateRangeChange}
        defaultStart={startMonth}
        defaultEnd={endMonth}
      />

      {/* 4-Level Water Distribution KPI Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 ${isAnimating ? 'opacity-70 scale-95' : 'opacity-100 scale-100'}`}>
        <KpiCard
          title="A1 - MAIN SOURCE"
          value={Math.round(metrics.A1).toLocaleString()}
          unit="m³"
          subtitle="Main Bulk (NAMA)"
          icon={Droplets}
          color="purple"
          variant="default"
          size="md"
        />
        
        <KpiCard
          title="A2 - ZONE DISTRIBUTION"
          value={Math.round(metrics.A2).toLocaleString()}
          unit="m³"
          subtitle="L2 Zone Bulk + Direct"
          icon={Layers}
          color="blue"
          variant="default"
          size="md"
        />
        
        <KpiCard
          title="A3 - BUILDING LEVEL"
          value={Math.round(metrics.A3_Individual).toLocaleString()}
          unit="m³"
          subtitle="L3 Buildings + Villas"
          icon={Building}
          color="green"
          variant="default"
          size="md"
        />
        
        <KpiCard
          title="A4 - END USERS"
          value={Math.round(metrics.A4).toLocaleString()}
          unit="m³"
          subtitle="L4 Apartments + L3 End"
          icon={Users}
          color="yellow"
          variant="default"
          size="md"
        />
      </div>

      {/* Multi-Stage Water Loss KPI Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 ${isAnimating ? 'opacity-70 scale-95' : 'opacity-100 scale-100'}`}>
        <KpiCard
          title="STAGE 1 LOSS"
          value={Math.round(metrics.Stage1_Loss).toLocaleString()}
          unit="m³"
          subtitle={`A1→A2: ${metrics.Stage1_Loss_Percentage?.toFixed(1)}%`}
          icon={AlertTriangle}
          color="orange"
          variant="default"
          size="md"
        />
        
        <KpiCard
          title="STAGE 2 LOSS"
          value={Math.round(metrics.Stage2_Loss).toLocaleString()}
          unit="m³"
          subtitle={`L2→L3: ${metrics.Stage2_Loss_Percentage?.toFixed(1)}%`}
          icon={TrendingDown}
          color="orange"
          variant="default"
          size="md"
        />
        
        <KpiCard
          title="STAGE 3 LOSS"
          value={Math.round(metrics.Stage3_Loss).toLocaleString()}
          unit="m³"
          subtitle={`A3→A4: ${metrics.Stage3_Loss_Percentage?.toFixed(1)}%`}
          icon={Activity}
          color="orange"
          variant="default"
          size="md"
        />
        
        <KpiCard
          title="TOTAL SYSTEM LOSS"
          value={Math.round(metrics.Total_Loss).toLocaleString()}
          unit="m³"
          subtitle={`Overall: ${metrics.Total_Loss_Percentage?.toFixed(1)}%`}
          icon={Target}
          color="pink"
          variant="default"
          size="md"
        />
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-500 ${isAnimating ? 'opacity-70 scale-95' : 'opacity-100 scale-100'}`}>
        <Card>
          <h3 className="text-lg font-semibold text-[#4E4456] dark:text-white mb-4">Monthly Consumption Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorA1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorA2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorA3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffc658" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.1)" />
              <XAxis dataKey="month" stroke="#9E9AA7" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9E9AA7" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{fontSize: "14px"}}/>
              <Area 
                type="monotone" 
                dataKey="L1 Main Source" 
                stroke="#8884d8" 
                strokeWidth={2} 
                fill="url(#colorA1)" 
                animationDuration={800}
                animationBegin={0}
              />
              <Area 
                type="monotone" 
                dataKey="L2 Zone Bulk Meters" 
                stroke="#82ca9d" 
                strokeWidth={2} 
                fill="url(#colorA2)" 
                animationDuration={800}
                animationBegin={100}
              />
              <Area 
                type="monotone" 
                dataKey="L3 Building/Villa Meters" 
                stroke="#ffc658" 
                strokeWidth={2} 
                fill="url(#colorA3)" 
                animationDuration={800}
                animationBegin={200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        
        <Card>
          <h3 className="text-lg font-semibold text-[#4E4456] dark:text-white mb-4">Monthly Water Loss Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={lossData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorStage1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F94144" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#F94144" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorStage2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F3722C" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#F3722C" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorStage3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F8961E" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#F8961E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.1)" />
              <XAxis dataKey="name" stroke="#9E9AA7" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9E9AA7" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{fontSize: "14px"}}/>
              <Area 
                type="natural" 
                dataKey="Stage 1 Loss" 
                stroke="#F94144" 
                strokeWidth={2} 
                fill="url(#colorStage1)" 
                animationDuration={800}
                animationBegin={0}
              />
              <Area 
                type="natural" 
                dataKey="Stage 2 Loss" 
                stroke="#F3722C" 
                strokeWidth={2} 
                fill="url(#colorStage2)" 
                animationDuration={800}
                animationBegin={100}
              />
              <Area 
                type="natural" 
                dataKey="Stage 3 Loss" 
                stroke="#F8961E" 
                strokeWidth={2} 
                fill="url(#colorStage3)" 
                animationDuration={800}
                animationBegin={200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}