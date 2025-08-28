import React, { useState } from 'react';
import { Card, KpiCard, Button } from '../src/components/ui';
import { ModernAreaChart, ModernBarChart, ModernDonutChart } from '../src/components/ui';
import {
    Droplets,
    Calendar,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Download,
    Filter,
    AlertTriangle,
    CheckCircle,
    Clock,
    Activity,
    Target
} from 'lucide-react';
import { theme } from '../src/lib/theme';
import { useDailyWaterData, getDailyConsumptionTrend, getZoneBreakdown, getTopConsumers } from '../hooks/useDailyWaterData';

export const DailyConsumptionPage: React.FC = () => {
    const [selectedZone, setSelectedZone] = useState<string>('all');
    const [selectedLevel, setSelectedLevel] = useState<string>('all');
    const [dateRange, setDateRange] = useState({
        start: '2025-07-01',
        end: '2025-07-31'
    });

    // Use the custom hook for data fetching
    const {
        data: dailyData,
        metrics,
        loading,
        error,
        uniqueZones,
        uniqueLevels,
        refresh
    } = useDailyWaterData(dateRange, selectedZone, selectedLevel);



    // Prepare chart data using helper functions
    const chartData = React.useMemo(() => getDailyConsumptionTrend(dailyData), [dailyData]);
    const zoneBreakdown = React.useMemo(() => getZoneBreakdown(dailyData), [dailyData]);
    const topConsumers = React.useMemo(() => getTopConsumers(dailyData, 10), [dailyData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading daily consumption data...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="p-6">
                <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Error: {error}</span>
                </div>
                <Button onClick={fetchDailyData} className="mt-4">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                </Button>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <Card>
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="p-2 border rounded-md text-sm"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="p-2 border rounded-md text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(e.target.value)}
                                className="p-2 border rounded-md text-sm"
                            >
                                <option value="all">All Zones</option>
                                {uniqueZones.map(zone => (
                                    <option key={zone} value={zone}>{zone}</option>
                                ))}
                            </select>

                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="p-2 border rounded-md text-sm"
                            >
                                <option value="all">All Levels</option>
                                {uniqueLevels.map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button onClick={refresh} variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </Card>

            {/* KPI Cards */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        title="Total Consumption"
                        value={`${metrics.totalConsumption.toLocaleString()} m³`}
                        subtitle="Selected period"
                        icon={Droplets}
                        color="blue"
                    />
                    <KpiCard
                        title="Daily Average"
                        value={`${Math.round(metrics.averageDaily).toLocaleString()} m³`}
                        subtitle="Per day"
                        icon={Calendar}
                        color="green"
                    />
                    <KpiCard
                        title="Active Meters"
                        value={`${metrics.activeMeters}`}
                        subtitle={`of ${metrics.totalMeters} total`}
                        icon={Activity}
                        color="blue"
                    />
                    <KpiCard
                        title="Peak Day"
                        value={`${metrics.peakDay.consumption.toLocaleString()} m³`}
                        subtitle={new Date(metrics.peakDay.date).toLocaleDateString()}
                        icon={TrendingUp}
                        color="red"
                    />
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ModernAreaChart
                    data={chartData}
                    config={{
                        consumption: { label: 'Daily Consumption (m³)', color: theme.colors.primary }
                    }}
                    title="Daily Consumption Trend"
                    height="h-[300px]"
                    showLegend={false}
                    curved={true}
                />

                <ModernBarChart
                    data={zoneBreakdown.slice(0, 10)}
                    config={{
                        consumption: { label: 'Consumption (m³)', color: theme.colors.secondary }
                    }}
                    title="Top 10 Zones by Consumption"
                    height="h-[300px]"
                    showLegend={false}
                />
            </div>

            {/* Data Table */}
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Daily Consumption Records</h3>
                    <div className="text-sm text-gray-500">
                        Showing {dailyData.length} records
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Meter</th>
                                <th className="px-4 py-3">Zone</th>
                                <th className="px-4 py-3">Level</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Consumption (m³)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyData.slice(0, 50).map((record) => (
                                <tr key={`${record.meter_id}-${record.date}`} className="border-b dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                                    <td className="px-4 py-2">{new Date(record.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 font-medium">{record.meter_label}</td>
                                    <td className="px-4 py-2">{record.zone}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${record.level === 'L1' ? 'bg-purple-100 text-purple-800' :
                                            record.level === 'L2' ? 'bg-blue-100 text-blue-800' :
                                                record.level === 'L3' ? 'bg-green-100 text-green-800' :
                                                    record.level === 'L4' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {record.level}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">{record.meter_type}</td>
                                    <td className="px-4 py-2 font-semibold">{record.consumption.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {dailyData.length > 50 && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                        Showing first 50 records of {dailyData.length} total
                    </div>
                )}
            </Card>
        </div>
    );
};