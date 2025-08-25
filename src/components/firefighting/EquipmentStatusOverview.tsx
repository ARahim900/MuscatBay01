import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, MapPin, Settings, Eye } from 'lucide-react';
import type { PPMFinding, Equipment } from '../../types/firefighting';

interface EquipmentStatusOverviewProps {
  findings: PPMFinding[];
  equipment: Equipment[];
}

interface BuildingData {
  id: string;
  name: string;
  totalEquipment: number;
  activeEquipment: number;
  faultyEquipment: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lastInspection: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export const EquipmentStatusOverview: React.FC<EquipmentStatusOverviewProps> = ({ 
  findings, 
  equipment 
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  // Mock building data - in real app this would come from props or API
  const buildings: BuildingData[] = [
    {
      id: 'B1',
      name: 'Building 1',
      totalEquipment: 24,
      activeEquipment: 22,
      faultyEquipment: 2,
      criticalFindings: 1,
      highFindings: 2,
      mediumFindings: 3,
      lastInspection: '2024-01-15',
      riskLevel: 'critical'
    },
    {
      id: 'B2',
      name: 'Building 2',
      totalEquipment: 18,
      activeEquipment: 17,
      faultyEquipment: 1,
      criticalFindings: 0,
      highFindings: 1,
      mediumFindings: 2,
      lastInspection: '2024-01-20',
      riskLevel: 'high'
    },
    {
      id: 'B5',
      name: 'Building 5',
      totalEquipment: 32,
      activeEquipment: 30,
      faultyEquipment: 2,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 1,
      lastInspection: '2024-01-25',
      riskLevel: 'medium'
    },
    {
      id: 'D44',
      name: 'D44 Block',
      totalEquipment: 16,
      activeEquipment: 16,
      faultyEquipment: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lastInspection: '2024-01-28',
      riskLevel: 'low'
    },
    {
      id: 'D45',
      name: 'D45 Block',
      totalEquipment: 14,
      activeEquipment: 14,
      faultyEquipment: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 1,
      lastInspection: '2024-01-22',
      riskLevel: 'medium'
    },
    {
      id: 'FM',
      name: 'FM Building',
      totalEquipment: 28,
      activeEquipment: 26,
      faultyEquipment: 2,
      criticalFindings: 0,
      highFindings: 1,
      mediumFindings: 1,
      lastInspection: '2024-01-18',
      riskLevel: 'high'
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getStatusIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Settings className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const selectedBuildingData = selectedBuilding 
    ? buildings.find(b => b.id === selectedBuilding)
    : null;

  return (
    <div className="space-y-4">
      {/* Building Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {buildings.map((building) => (
          <div
            key={building.id}
            onClick={() => setSelectedBuilding(
              selectedBuilding === building.id ? null : building.id
            )}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
              getRiskBgColor(building.riskLevel)
            } ${
              selectedBuilding === building.id 
                ? 'ring-2 ring-blue-500 ring-offset-2' 
                : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {building.name}
                </h3>
              </div>
              {getStatusIcon(building.riskLevel)}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Equipment</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {building.activeEquipment}/{building.totalEquipment}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Findings</span>
                <div className="flex items-center gap-1">
                  {building.criticalFindings > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                      {building.criticalFindings}C
                    </span>
                  )}
                  {building.highFindings > 0 && (
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                      {building.highFindings}H
                    </span>
                  )}
                  {building.mediumFindings > 0 && (
                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                      {building.mediumFindings}M
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Last Check</span>
                <span className="text-xs text-gray-500">
                  {formatDate(building.lastInspection)}
                </span>
              </div>

              {/* Equipment Health Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Health</span>
                  <span>{Math.round((building.activeEquipment / building.totalEquipment) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      building.faultyEquipment === 0 ? 'bg-green-500' :
                      building.faultyEquipment <= 2 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${(building.activeEquipment / building.totalEquipment) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed View for Selected Building */}
      {selectedBuildingData && (
        <div className={`p-4 rounded-lg border-2 ${getRiskBgColor(selectedBuildingData.riskLevel)}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {selectedBuildingData.name} - Detailed View
            </h3>
            <button
              onClick={() => setSelectedBuilding(null)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {selectedBuildingData.totalEquipment}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Equipment</div>
            </div>

            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {selectedBuildingData.activeEquipment}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Active</div>
            </div>

            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {selectedBuildingData.faultyEquipment}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Faulty</div>
            </div>

            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {selectedBuildingData.criticalFindings + selectedBuildingData.highFindings}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Priority Issues</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Risk Assessment</h4>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${getRiskColor(selectedBuildingData.riskLevel)}`} />
              <span className="text-sm capitalize font-medium">
                {selectedBuildingData.riskLevel} Risk Level
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Last inspection: {formatDate(selectedBuildingData.lastInspection)} • 
              Next due: {formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-gray-600 dark:text-gray-300">Low Risk</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-yellow-500" />
          <span className="text-gray-600 dark:text-gray-300">Medium Risk</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span className="text-gray-600 dark:text-gray-300">High Risk</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-gray-600 dark:text-gray-300">Critical</span>
        </div>
      </div>
    </div>
  );
};