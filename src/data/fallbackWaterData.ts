// Fallback water data for when Supabase connection fails
export const fallbackWaterMeters = [
  {
    id: 1,
    meter_label: 'Main Bulk (NAMA)',
    account_number: 'C43659',
    label: 'L1' as const,
    zone: 'Main Bulk',
    parent_meter: 'NAMA',
    type: 'Main Bulk',
    jan_25: 32580,
    feb_25: 44043,
    mar_25: 34915,
    apr_25: 46039,
    may_25: 58425,
    jun_25: 41840,
    jul_25: 41475,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    meter_label: 'ZONE 8 (Bulk Zone 8)',
    account_number: '4300342',
    label: 'L2' as const,
    zone: 'Zone_08',
    parent_meter: 'Main Bulk (NAMA)',
    type: 'Zone Bulk',
    jan_25: 1547,
    feb_25: 1498,
    mar_25: 2605,
    apr_25: 3203,
    may_25: 2937,
    jun_25: 3142,
    jul_25: 2800,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 3,
    meter_label: 'ZONE 3A (BULK Zone 3A)',
    account_number: '4300343',
    label: 'L2' as const,
    zone: 'Zone_03_(A)',
    parent_meter: 'Main Bulk (NAMA)',
    type: 'Zone Bulk',
    jan_25: 4235,
    feb_25: 4273,
    mar_25: 3591,
    apr_25: 4041,
    may_25: 4898,
    jun_25: 6484,
    jul_25: 5200,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 4,
    meter_label: 'ZONE 3B (BULK Zone 3B)',
    account_number: '4300344',
    label: 'L2' as const,
    zone: 'Zone_03_(B)',
    parent_meter: 'Main Bulk (NAMA)',
    type: 'Zone Bulk',
    jan_25: 3256,
    feb_25: 2962,
    mar_25: 3331,
    apr_25: 2157,
    may_25: 3093,
    jun_25: 2917,
    jul_25: 2800,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 5,
    meter_label: 'ZONE 5 (Bulk Zone 5)',
    account_number: '4300345',
    label: 'L2' as const,
    zone: 'Zone_05',
    parent_meter: 'Main Bulk (NAMA)',
    type: 'Zone Bulk',
    jan_25: 4267,
    feb_25: 4231,
    mar_25: 3862,
    apr_25: 3737,
    may_25: 3849,
    jun_25: 4113,
    jul_25: 3900,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 6,
    meter_label: 'Hotel Main Building',
    account_number: '4300334',
    label: 'DC' as const,
    zone: 'Direct Connection',
    parent_meter: 'Main Bulk (NAMA)',
    type: 'Retail',
    jan_25: 18048,
    feb_25: 19482,
    mar_25: 22151,
    apr_25: 27676,
    may_25: 26963,
    jun_25: 17379,
    jul_25: 14713,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 7,
    meter_label: 'Z8-1',
    account_number: '4300188',
    label: 'L3' as const,
    zone: 'Zone_08',
    parent_meter: 'ZONE 8 (Bulk Zone 8)',
    type: 'Residential (Villa)',
    jan_25: 1,
    feb_25: 2,
    mar_25: 3,
    apr_25: 16,
    may_25: 7,
    jun_25: 0,
    jul_25: 12,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 8,
    meter_label: 'Z8-11',
    account_number: '4300023',
    label: 'L3' as const,
    zone: 'Zone_08',
    parent_meter: 'ZONE 8 (Bulk Zone 8)',
    type: 'Residential (Villa)',
    jan_25: 0,
    feb_25: 1,
    mar_25: 0,
    apr_25: 0,
    may_25: 0,
    jun_25: 0,
    jul_25: 2,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 9,
    meter_label: 'Z8-13',
    account_number: '4300024',
    label: 'L3' as const,
    zone: 'Zone_08',
    parent_meter: 'ZONE 8 (Bulk Zone 8)',
    type: 'Residential (Villa)',
    jan_25: 0,
    feb_25: 0,
    mar_25: 0,
    apr_25: 0,
    may_25: 0,
    jun_25: 1,
    jul_25: 1,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 10,
    meter_label: 'Irrigation- Controller UP',
    account_number: '4300340',
    label: 'DC' as const,
    zone: 'Direct Connection',
    parent_meter: 'Main Bulk (NAMA)',
    type: 'IRR_Services',
    jan_25: 0,
    feb_25: 0,
    mar_25: 0,
    apr_25: 1000,
    may_25: 313,
    jun_25: 491,
    jul_25: 554,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

// Generate daily consumption data from monthly totals
export const generateFallbackDailyData = (dateRange: { start: string; end: string }) => {
  const dailyData = [];
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayOfMonth = d.getDate();
    
    fallbackWaterMeters.forEach(meter => {
      const julConsumption = meter.jul_25 || 0;
      const dailyAverage = julConsumption / 31;
      
      // Add realistic daily variation
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      let variation = 1.0;
      
      // Different patterns for different meter types
      if (meter.type?.includes('Retail') || meter.type?.includes('Commercial')) {
        variation = isWeekend ? 0.6 : 1.3; // Lower on weekends for commercial
      } else if (meter.type?.includes('Residential')) {
        variation = isWeekend ? 1.2 : 1.0; // Higher on weekends for residential
      } else if (meter.type?.includes('IRR')) {
        variation = 1.5; // Higher in summer for irrigation
      }
      
      // Add random daily variation (±25%)
      variation *= (0.75 + Math.random() * 0.5);
      
      const dailyConsumption = Math.max(0, Math.round(dailyAverage * variation));
      
      dailyData.push({
        id: parseInt(`${meter.id}${dayOfMonth.toString().padStart(2, '0')}`),
        date: dateStr,
        meter_id: meter.account_number,
        meter_label: meter.meter_label,
        account_number: meter.account_number,
        zone: meter.zone,
        level: meter.label,
        meter_type: meter.type,
        consumption: dailyConsumption
      });
    });
  }
  
  return dailyData;
};

export const fallbackConnectionMessage = `
🔄 Using Fallback Data

The system is currently using sample data because:
- Supabase connection could not be established
- Database table may not exist
- Network connectivity issues

To fix this:
1. Check your internet connection
2. Verify Supabase credentials in .env file
3. Ensure water_meters table exists in your database
4. Check Supabase project status

The dashboard will continue to work with sample data for demonstration purposes.
`;