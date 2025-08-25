import React, { useState, useEffect } from 'react';
import { Flame, AlertTriangle, CheckCircle, XCircle, TrendingUp, Calendar, MapPin, Settings, RefreshCw, Bell, Download, LayoutDashboard, Database, PieChart } from 'lucide-react';
import { MenuBar } from './ui/glow-menu';
import { FirefightingAPI } from '../lib/firefighting-api';
import type { FirefightingDashboardStats, PPMFinding, Equipment, FirefightingAlert } from '../types/firefighting';
import { SystemHealthIndicator } from './firefighting/SystemHealthIndicator';
import { EquipmentStatusOverview } from './firefighting/EquipmentStatusOverview';
import { FindingsTable } from './firefighting/FindingsTable';
import { UpcomingPPMCalendar } from './firefighting/UpcomingPPMCalendar';
import { MetricCard } from './firefighting/MetricCard';
import { EquipmentManagement } from './firefighting/EquipmentManagement';
import { PPMManagement } from './firefighting/PPMManagement';

// Card Component matching the existing design
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), Math.random() * 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`bg-white dark:bg-[#2C2834] rounded-xl shadow-md hover:shadow-xl border border-gray-200/80 dark:border-white/10 p-4 md:p-6 transition-all duration-300 hover:-translate-y-1 ${isMounted ? 'fade-in-up' : 'opacity-0 translate-y-4'} ${className}`}>
      {children}
    </div>
  );
};

// Button Component matching the existing design
const Button = ({ children, onClick, variant = 'default', size = 'default', className = '', ...props }: any) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200';
  const variants = {
    default: 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg active:scale-95',
    outline: 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg active:scale-95'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    default: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const FirefightingDashboard: React.FC = () => {
  const [activeSubModule, setActiveSubModule] = useState('Dashboard');
  const [stats, setStats] = useState<FirefightingDashboardStats>({
    totalEquipment: 0,
    activeEquipment: 0,
    faultyEquipment: 0,
    criticalFindings: 0,
    pendingPPMs: 0,
    complianceRate: 0,
    monthlyPPMCost: 0,
    upcomingInspections: 0
  });
  
  const [findings, setFindings] = useState<PPMFinding[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [alerts, setAlerts] = useState<FirefightingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    initializeDashboard();
    subscribeToUpdates();
    
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      await fetchDashboardData();
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [dashboardStats, criticalFindings, equipmentData, activeAlerts] = await Promise.all([
        FirefightingAPI.getDashboardStats(),
        FirefightingAPI.getCriticalFindings(),
        FirefightingAPI.getEquipment(),
        FirefightingAPI.getActiveAlerts()
      ]);

      setStats(dashboardStats);
      setFindings(criticalFindings);
      setEquipment(equipmentData);
      setAlerts(activeAlerts);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
    }
  };

  const subscribeToUpdates = () => {
    const unsubscribe = FirefightingAPI.subscribeToRealTimeUpdates((payload) => {
      console.log('Real-time update received:', payload);
      
      if (payload.eventType === 'INSERT' && payload.table === 'ppm_findings') {
        const newFinding = payload.new as PPMFinding;
        if (newFinding.severity === 'Critical') {
          setFindings(prev => [newFinding, ...prev]);
          
          const newAlert: FirefightingAlert = {
            id: Date.now(),
            alert_type: 'Critical Finding',
            severity: 'Critical',
            message: `Critical finding detected: ${newFinding.finding_description}`,
            created_at: new Date().toISOString(),
            acknowledged: false,
            resolved: false
          };
          setAlerts(prev => [newAlert, ...prev]);
        }
      }
    });

    return unsubscribe;
  };

  const handleRefresh = async () => {
    await fetchDashboardData();
  };

  const handleExportReport = async () => {
    try {
      const report = await FirefightingAPI.generateComplianceReport({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      });
      
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `firefighting-compliance-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#1A181F] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading firefighting system data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#1A181F] flex items-center justify-center">
        <Card className="max-w-md">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} className="bg-red-500 hover:bg-red-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Menu items matching the existing pattern
  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      href: '#',
      gradient: "radial-gradient(circle, rgba(220,38,38,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(220,38,38,0) 100%)",
      iconColor: "text-red-500"
    },
    { 
      icon: Settings, 
      label: 'Equipment', 
      href: '#',
      gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.06) 50%, rgba(59,130,246,0) 100%)",
      iconColor: "text-blue-500"
    },
    { 
      icon: Calendar, 
      label: 'PPM Management', 
      href: '#',
      gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.06) 50%, rgba(34,197,94,0) 100%)",
      iconColor: "text-green-500"
    },
    { 
      icon: AlertTriangle, 
      label: 'Findings', 
      href: '#',
      gradient: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.06) 50%, rgba(245,158,11,0) 100%)",
      iconColor: "text-amber-500"
    },
    { 
      icon: PieChart, 
      label: 'Reports', 
      href: '#',
      gradient: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.06) 50%, rgba(139,92,246,0) 100%)",
      iconColor: "text-purple-500"
    },
  ];

  const renderSubModule = () => {
    switch (activeSubModule) {
      case 'Dashboard':
        return renderDashboard();
      case 'Equipment':
        return <EquipmentManagement />;
      case 'PPM Management':
        return <PPMManagement />;
      case 'Findings':
        return <FindingsTable findings={findings} showPagination={true} compact={false} />;
      case 'Reports':
        return (
          <Card>
            <div className="text-center p-8">
              <PieChart className="h-16 w-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Reports Module</h3>
              <p className="text-gray-600 dark:text-gray-300">Advanced reporting and analytics coming soon...</p>
            </div>
          </Card>
        );
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <>
      {/* System Health Overview */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <SystemHealthIndicator score={stats.complianceRate} />
              <div className="absolute -top-1 -right-1">
                {stats.complianceRate >= 95 ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : stats.complianceRate >= 80 ? (
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">System Health Status</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Overall compliance: <span className="font-semibold text-red-600">{stats.complianceRate.toFixed(1)}%</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
          
          {alerts.length > 0 && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
                <Bell className="h-6 w-6 animate-pulse" />
                <span className="text-2xl font-bold">{alerts.length}</span>
              </div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Active Alerts</p>
              <Button 
                variant="danger" 
                size="sm" 
                className="mt-2"
                onClick={() => setActiveSubModule('Findings')}
              >
                View Details
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Enhanced KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">PPM COMPLIANCE</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.complianceRate.toFixed(1)}%</p>
              <p className="text-sm text-green-600 font-medium">+5% from last month</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-800/30 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">OPEN FINDINGS</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{findings.length}</p>
              <p className="text-sm text-amber-600 font-medium">{stats.criticalFindings} Critical</p>
            </div>
          </div>
        </Card>
        
        <Card className={`${stats.faultyEquipment > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'} hover:shadow-lg transition-all duration-300`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 ${stats.faultyEquipment > 0 ? 'bg-red-100 dark:bg-red-800/30' : 'bg-green-100 dark:bg-green-800/30'} rounded-xl`}>
              {stats.faultyEquipment > 0 ? (
                <XCircle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">EQUIPMENT HEALTH</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {((stats.activeEquipment / stats.totalEquipment) * 100).toFixed(1)}%
              </p>
              <p className={`text-sm font-medium ${stats.faultyEquipment > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.faultyEquipment} Faulty Units
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">MONTHLY COST</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">OMR {stats.monthlyPPMCost.toLocaleString()}</p>
              <p className="text-sm text-blue-600 font-medium">+12% from last month</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Visual Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-xl transition-all duration-300">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              Equipment Status Overview
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Real-time equipment health and risk assessment by building
            </p>
          </div>
          <EquipmentStatusOverview findings={findings} equipment={equipment} />
        </Card>
        
        <Card className="hover:shadow-xl transition-all duration-300">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Upcoming Inspections
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Scheduled PPM activities and maintenance tasks
            </p>
          </div>
          <UpcomingPPMCalendar upcomingCount={stats.upcomingInspections} />
        </Card>
      </div>

      {/* Enhanced Critical Findings Section */}
      <Card className="border-red-200 dark:border-red-800 hover:shadow-xl transition-all duration-300">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Critical Findings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                High-priority issues requiring immediate attention
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                {findings.length} Total
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveSubModule('Findings')}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                View All
              </Button>
            </div>
          </div>
        </div>
        <FindingsTable 
          findings={findings.slice(0, 5)} 
          showPagination={false}
          compact={true}
        />
      </Card>

      {/* Enhanced Active Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 hover:shadow-xl transition-all duration-300">
          <div className="border-b border-red-200 dark:border-red-700 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 flex items-center gap-2">
                  <Bell className="h-5 w-5 animate-pulse" />
                  Active Alerts
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  Real-time system alerts requiring immediate attention
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">{alerts.length}</div>
                <div className="text-xs text-red-600 dark:text-red-300">Total Alerts</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <div 
                key={alert.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-700 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-4 h-4 rounded-full ${
                      alert.severity === 'Critical' ? 'bg-red-500' :
                      alert.severity === 'High' ? 'bg-orange-500' :
                      alert.severity === 'Medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    } animate-pulse`} />
                    <div className={`absolute inset-0 w-4 h-4 rounded-full ${
                      alert.severity === 'Critical' ? 'bg-red-500' :
                      alert.severity === 'High' ? 'bg-orange-500' :
                      alert.severity === 'Medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    } animate-ping opacity-75`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{alert.alert_type}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.severity === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        alert.severity === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        alert.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{alert.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Acknowledge
                </Button>
              </div>
            ))}
            {alerts.length > 3 && (
              <div className="text-center pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  View {alerts.length - 3} More Alerts
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A181F]">
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-[#2C2834] border-b border-gray-200 dark:border-white/10 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
              <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
              <span className="leading-tight">Firefighting & Alarm System</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Muscat Bay Safety Management & Compliance</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-500">System Status</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {stats.complianceRate.toFixed(1)}% Compliant
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button onClick={handleExportReport} size="sm">
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Export Report</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        {/* Enhanced Menu Bar */}
        <div className="mb-4 sm:mb-6 flex justify-center overflow-x-auto">
          <MenuBar
            items={menuItems}
            activeItem={activeSubModule}
            onItemClick={(label) => {
              setIsAnimating(true);
              setTimeout(() => {
                setActiveSubModule(label);
                setIsAnimating(false);
              }, 150);
            }}
            className="w-fit min-w-max"
          />
        </div>
        
        {/* Content with animation */}
        <div className={`transition-all duration-300 ${isAnimating ? 'opacity-70 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="space-y-6">
            {renderSubModule()}
          </div>
        </div>
      </div>
    </div>
  );
};