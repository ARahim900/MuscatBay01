import React from 'react';
import { EnhancedDailyConsumption } from './EnhancedDailyConsumption';

// This component now wraps the enhanced version with Supabase integration
export const DailyConsumptionDashboard: React.FC = () => {
  return <EnhancedDailyConsumption />;
};
