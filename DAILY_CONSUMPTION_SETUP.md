# Daily Water Consumption Setup Guide

This guide explains how to set up and use the Daily Water Consumption feature in your Muscat Bay Utilities Management Dashboard.

## 🎯 Overview

The Daily Consumption feature provides:
- Real-time daily water consumption tracking
- Zone-based consumption analysis
- Anomaly detection and alerts
- Hourly consumption patterns
- Top consumers identification
- Trend analysis and reporting

## 🗄️ Database Setup

### Option 1: Create Daily Consumption Table (Recommended)

Create a dedicated table for daily consumption data in your Supabase database:

```sql
-- Create the daily consumption table
CREATE TABLE july25_daily_water_consumption_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    meter_id VARCHAR(20) NOT NULL,
    meter_label VARCHAR(100),
    account_number VARCHAR(20),
    zone VARCHAR(50),
    level VARCHAR(10), -- L1, L2, L3, L4, DC
    meter_type VARCHAR(50),
    consumption DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_daily_consumption_date ON july25_daily_water_consumption_data(date);
CREATE INDEX idx_daily_consumption_meter ON july25_daily_water_consumption_data(meter_id);
CREATE INDEX idx_daily_consumption_zone ON july25_daily_water_consumption_data(zone);
CREATE INDEX idx_daily_consumption_level ON july25_daily_water_consumption_data(level);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_daily_consumption_updated_at 
    BEFORE UPDATE ON july25_daily_water_consumption_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Option 2: Use Monthly Data (Automatic Fallback)

If no daily consumption table exists, the system will automatically:
1. Fetch data from the existing `water_meters` table
2. Generate realistic daily consumption patterns from monthly totals
3. Apply variations based on meter type and day of week

## 📊 Data Import

### Sample Data Format

Your daily consumption data should follow this format:

```csv
date,meter_id,meter_label,account_number,zone,level,meter_type,consumption
2025-07-01,4300023,Z8-11,4300023,Zone_08,L3,Residential (Villa),15.5
2025-07-01,4300024,Z8-13,4300024,Zone_08,L3,Residential (Villa),22.3
2025-07-01,C43659,Main Bulk (NAMA),C43659,Main Bulk,L1,Main Bulk,1250.0
```

### Import Methods

1. **CSV Import via Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to Table Editor
   - Select your daily consumption table
   - Click "Insert" → "Import data from CSV"

2. **Bulk Insert via SQL:**
   ```sql
   INSERT INTO july25_daily_water_consumption_data 
   (date, meter_id, meter_label, account_number, zone, level, meter_type, consumption)
   VALUES 
   ('2025-07-01', '4300023', 'Z8-11', '4300023', 'Zone_08', 'L3', 'Residential (Villa)', 15.5),
   ('2025-07-01', '4300024', 'Z8-13', '4300024', 'Zone_08', 'L3', 'Residential (Villa)', 22.3);
   ```

## 🔧 Configuration

### Environment Variables

Ensure your `.env` file contains:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Table Permissions

Set up Row Level Security (RLS) policies in Supabase:

```sql
-- Enable RLS
ALTER TABLE july25_daily_water_consumption_data ENABLE ROW LEVEL SECURITY;

-- Allow read access (adjust based on your auth requirements)
CREATE POLICY "Allow read access" ON july25_daily_water_consumption_data
    FOR SELECT USING (true);

-- Allow insert access (for data imports)
CREATE POLICY "Allow insert access" ON july25_daily_water_consumption_data
    FOR INSERT WITH CHECK (true);
```

## 🚀 Usage

### Accessing Daily Consumption

1. Navigate to the **Water** module
2. Click on the **Daily Consumption** tab
3. Use the date range picker to select your desired period
4. Apply zone and level filters as needed

### Key Features

#### 📈 KPI Dashboard
- **Total Consumption**: Sum of all consumption for selected period
- **Daily Average**: Average daily consumption
- **Active Meters**: Number of meters with consumption > 0
- **Peak Day**: Highest consumption day with date

#### 📊 Charts and Analytics
- **Daily Trend Chart**: Line chart showing consumption over time
- **Hourly Pattern**: Bar chart showing consumption by hour of day
- **Zone Breakdown**: Pie chart showing consumption by zone
- **Top Consumers**: Table of highest consuming meters

#### 🔍 Filtering Options
- **Date Range**: Select start and end dates
- **Zone Filter**: Filter by specific zones
- **Level Filter**: Filter by meter levels (L1, L2, L3, L4, DC)

#### 🚨 Anomaly Detection
- **Critical Alerts**: Consumption >300% of average
- **Warnings**: Consumption >200% of average
- **Continuous Flow**: Potential leaks or continuous usage
- **Estimated Loss**: Calculated potential water wastage

## 🔧 Testing Your Setup

### Connection Test

1. Go to the Water module
2. Click "Test Connection" button
3. Review the connection status and any errors
4. Check if daily consumption table is detected

### Test Results Interpretation

- ✅ **Green**: Connection successful, daily table found
- ⚠️ **Yellow**: Connection successful, using monthly data fallback
- ❌ **Red**: Connection failed, check credentials and network

## 📱 API Usage

### Custom Hook

Use the `useDailyWaterData` hook in your components:

```typescript
import { useDailyWaterData } from '../hooks/useDailyWaterData';

const MyComponent = () => {
  const { 
    data, 
    metrics, 
    loading, 
    error, 
    uniqueZones, 
    refresh 
  } = useDailyWaterData(
    { start: '2025-07-01', end: '2025-07-31' }, // date range
    'Zone_08', // zone filter
    'L3' // level filter
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Total Consumption: {metrics?.totalConsumption} m³</h3>
      <p>Records: {data.length}</p>
    </div>
  );
};
```

### Helper Functions

```typescript
import { 
  getDailyConsumptionTrend, 
  getZoneBreakdown, 
  getTopConsumers 
} from '../hooks/useDailyWaterData';

// Get chart data
const chartData = getDailyConsumptionTrend(dailyData);

// Get zone analysis
const zoneData = getZoneBreakdown(dailyData);

// Get top 10 consumers
const topConsumers = getTopConsumers(dailyData, 10);
```

## 🐛 Troubleshooting

### Common Issues

1. **"Table doesn't exist" error**
   - Create the daily consumption table using the SQL above
   - Check table name matches exactly: `july25_daily_water_consumption_data`

2. **No data showing**
   - Verify data exists in your table
   - Check date range filters
   - Ensure RLS policies allow read access

3. **Connection timeout**
   - Check your internet connection
   - Verify Supabase project is active
   - Check environment variables

4. **Permission denied**
   - Review RLS policies
   - Check API key permissions
   - Verify project settings

### Debug Mode

Enable debug logging by opening browser console:
- All database queries are logged with `===` prefixes
- Connection attempts show detailed status
- Data processing steps are tracked

## 📈 Performance Optimization

### Recommended Practices

1. **Use Date Indexes**: Always filter by date for better performance
2. **Limit Results**: Use pagination for large datasets
3. **Cache Results**: Consider caching frequently accessed data
4. **Batch Operations**: Group multiple operations when possible

### Query Optimization

```sql
-- Good: Uses date index
SELECT * FROM july25_daily_water_consumption_data 
WHERE date BETWEEN '2025-07-01' AND '2025-07-31'
AND zone = 'Zone_08';

-- Avoid: Full table scan
SELECT * FROM july25_daily_water_consumption_data 
WHERE consumption > 100;
```

## 🔄 Data Maintenance

### Regular Tasks

1. **Daily Data Import**: Automate daily consumption data imports
2. **Data Validation**: Check for missing or anomalous readings
3. **Archive Old Data**: Move old data to archive tables
4. **Update Indexes**: Maintain database performance

### Backup Strategy

```sql
-- Create backup table
CREATE TABLE july25_daily_water_consumption_data_backup AS 
SELECT * FROM july25_daily_water_consumption_data;

-- Export data
COPY july25_daily_water_consumption_data TO '/path/to/backup.csv' CSV HEADER;
```

## 📞 Support

If you encounter issues:

1. Check the browser console for error messages
2. Use the connection test feature
3. Verify your Supabase project status
4. Review the troubleshooting section above

## 🔮 Future Enhancements

Planned features:
- Real-time data streaming
- Advanced anomaly detection algorithms
- Predictive consumption modeling
- Mobile app integration
- Automated reporting
- Integration with IoT sensors

---

**Note**: Remove the "Test Connection" button from the Water module once your setup is complete and working properly.