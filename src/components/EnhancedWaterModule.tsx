import React, { useState } from 'react'
import { LayoutDashboard, MapPin, PieChart as PieIcon, Database } from 'lucide-react'
import { OverviewTab } from './OverviewTab'
import { EnhancedZoneAnalysisTab } from './EnhancedZoneAnalysisTab'
import { ConsumptionByTypeTab } from './ConsumptionByTypeTab'
import { MainDatabaseTab } from './MainDatabaseTab'
import { MenuBar } from './ui/glow-menu'

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-[#2C2834] rounded-xl shadow-md hover:shadow-lg border border-gray-200/80 dark:border-white/10 p-4 md:p-6 transition-all duration-150 hover:-translate-y-0.5 ${className}`}>
    {children}
  </div>
)

export const EnhancedWaterModule = () => {
  const [activeSubModule, setActiveSubModule] = useState('Overview')
  
  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Overview', 
      href: '#',
      gradient: "radial-gradient(circle, rgba(45,156,219,0.15) 0%, rgba(45,156,219,0.06) 50%, rgba(45,156,219,0) 100%)",
      iconColor: "text-blue-500"
    },
    { 
      icon: MapPin, 
      label: 'Zone Analysis', 
      href: '#',
      gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.06) 50%, rgba(34,197,94,0) 100%)",
      iconColor: "text-green-500"
    },
    { 
      icon: PieIcon, 
      label: 'Consumption by Type', 
      href: '#',
      gradient: "radial-gradient(circle, rgba(247,198,4,0.15) 0%, rgba(247,198,4,0.06) 50%, rgba(247,198,4,0) 100%)",
      iconColor: "text-yellow-500"
    },
    { 
      icon: Database, 
      label: 'Main Database', 
      href: '#',
      gradient: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.06) 50%, rgba(139,92,246,0) 100%)",
      iconColor: "text-purple-500"
    },
  ]

  const renderSubModule = () => {
    switch (activeSubModule) {
      case 'Overview': 
        return <OverviewTab />
      case 'Zone Analysis': 
        return <EnhancedZoneAnalysisTab />
      case 'Consumption by Type': 
        return <ConsumptionByTypeTab />
      case 'Main Database': 
        return <MainDatabaseTab />
      default: 
        return <div className="text-center p-8 bg-gray-100 dark:bg-white/5 rounded-lg">Component for "{activeSubModule}" is under construction.</div>
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-[#4E4456] dark:text-white">Water System Analysis</h2>
        <p className="text-xs sm:text-sm text-gray-500">Muscat Bay Resource Management</p>
      </div>
      
      <div className="mb-4 sm:mb-6 flex justify-center overflow-x-auto">
        <MenuBar
          items={menuItems}
          activeItem={activeSubModule}
          onItemClick={(label) => setActiveSubModule(label)}
          className="w-fit min-w-max"
        />
      </div>
      
      {renderSubModule()}
    </div>
  )
}