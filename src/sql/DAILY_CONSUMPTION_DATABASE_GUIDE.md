# Daily Water Consumption Database Schema
## Muscat Bay Water Management System

### Overview
This comprehensive database schema is designed to handle daily water consumption data for 349 meters across the Muscat Bay development, with detailed daily readings for July 2025 (reading_month = 72025).

### Files Included

1. **`create_daily_consumption_table.sql`** - Main schema creation script
2. **`import_daily_consumption_data.sql`** - Data import script with sample data for 349 meters  
3. **`daily_consumption_analysis_queries.sql`** - Comprehensive analytics and reporting queries

### Database Schema Structure

#### Main Table: `daily_water_consumption`

**Primary Fields:**
- `account_number` (VARCHAR(10), PRIMARY KEY) - Unique meter identifier
- `customer_name` (VARCHAR(100)) - Customer or location name
- `address` (VARCHAR(150)) - Zone/location information
- `reading_month` (INTEGER) - Format: 72025 (July 2025)

**Daily Consumption Columns:**
- `day_01` through `day_31` (DECIMAL(10,3)) - Daily consumption in cubic meters (m³)

**Computed Fields:**
- `total_monthly_consumption` - Automatically calculated sum of all daily values
- `average_daily_consumption` - Monthly total divided by 31 days

**Classification Fields:**
- `zone_classification` - Zone categorization (Zone_03A, Zone_05, etc.)
- `building_type` - Property type (Residential_Villa, Commercial, Hotel, etc.)
- `meter_type` - Meter classification (Standard, Commercial, Bulk, Service)
- `meter_size` - Physical meter size (20mm, 25mm, 32mm, etc.)

**Status Fields:**
- `meter_status` - Active/Inactive status
- `occupancy_status` - Occupied/Vacant status
- `data_source` - Data collection method

### Key Features

#### 1. **Performance Optimization**
- **8 Primary Indexes** for fast query performance
- **Composite Indexes** for complex filtering
- **Partial Indexes** for commonly filtered data (active meters only)

#### 2. **Analytical Views**
- `daily_zone_summary` - Zone-level aggregations
- `top_daily_consumers` - Ranked consumption list
- `daily_consumption_patterns` - Weekend vs weekday analysis
- `consumption_anomalies` - Leak detection and unusual patterns
- `monthly_billing_summary` - Cost calculations with tiered rates

#### 3. **Utility Functions**
- `get_date_range_consumption()` - Custom date range calculations
- Built-in data validation queries
- Comprehensive error checking

### Installation Instructions

#### Step 1: Create the Schema
```sql
-- Run in Supabase SQL Editor or psql
\i create_daily_consumption_table.sql
```

#### Step 2: Import Sample Data
```sql
-- Import the 349 meter dataset
\i import_daily_consumption_data.sql
```

#### Step 3: Verify Installation
```sql
-- Check total records
SELECT COUNT(*) FROM daily_water_consumption;

-- Verify active meters
SELECT COUNT(*) FROM daily_water_consumption WHERE meter_status = 'Active';

-- Check total consumption
SELECT SUM(total_monthly_consumption) FROM daily_water_consumption;
```

### Data Structure Examples

#### Residential Villa Entry:
```sql
account_number: '4300002'
customer_name: 'Al-Rashid Family'
address: 'Zone 3A - Villa Z3-42'
zone_classification: 'Zone_03A'
building_type: 'Residential_Villa'
total_monthly_consumption: 62.5 m³
average_daily_consumption: 2.02 m³
```

#### Commercial Property Entry:
```sql
account_number: '4300334'
customer_name: 'Shangri La Hotel'
address: 'Main Hotel Building Complex'
zone_classification: 'Direct_Connection'
building_type: 'Hotel'
total_monthly_consumption: 15,341.2 m³
average_daily_consumption: 495.2 m³
```

### Analytics Capabilities

#### 1. **Zone Analysis**
- Total consumption per zone
- Average consumption per meter type
- Zone efficiency rankings
- Distribution comparisons

#### 2. **Consumer Analysis**
- Top 50 consumers identification
- High-consuming residential villas
- Commercial vs residential patterns
- Building type comparisons

#### 3. **Pattern Recognition**
- Weekend vs weekday consumption
- Peak usage identification
- Consumption volatility analysis
- Seasonal trend detection

#### 4. **Anomaly Detection**
- Zero consumption alerts (potential meter issues)
- Extremely high consumption (potential leaks)
- Consumption spikes (5x above average)
- Villa excessive usage (>15 m³/day average)

#### 5. **Billing Integration**
- Tiered rate calculations:
  - Tier 1: 0-10 m³ @ 0.150 OMR/m³
  - Tier 2: 11-25 m³ @ 0.200 OMR/m³  
  - Tier 3: 25+ m³ @ 0.300 OMR/m³
- Zone-level billing summaries
- High-value account identification

### Common Queries

#### Top 10 Consumers:
```sql
SELECT account_number, customer_name, total_monthly_consumption 
FROM daily_water_consumption 
WHERE meter_status = 'Active' 
ORDER BY total_monthly_consumption DESC 
LIMIT 10;
```

#### Zone Totals:
```sql
SELECT zone_classification, 
       COUNT(*) as meters, 
       SUM(total_monthly_consumption) as total_m3
FROM daily_water_consumption 
WHERE meter_status = 'Active'
GROUP BY zone_classification
ORDER BY total_m3 DESC;
```

#### Daily System Consumption:
```sql
SELECT SUM(day_01) as day1_total,
       SUM(day_15) as day15_total,
       SUM(day_31) as day31_total
FROM daily_water_consumption 
WHERE meter_status = 'Active';
```

#### Anomaly Detection:
```sql
SELECT * FROM consumption_anomalies 
WHERE anomaly_severity LIKE 'CRITICAL%' 
ORDER BY average_daily_consumption DESC;
```

### Data Quality Checks

#### Completeness Validation:
```sql
SELECT 'Data Completeness' as check,
       COUNT(*) as total_records,
       COUNT(CASE WHEN total_monthly_consumption > 0 THEN 1 END) as with_consumption,
       COUNT(CASE WHEN meter_status = 'Active' THEN 1 END) as active_meters
FROM daily_water_consumption;
```

#### Range Validation:
```sql
SELECT 'Consumption Ranges' as check,
       MIN(total_monthly_consumption) as min_consumption,
       MAX(total_monthly_consumption) as max_consumption,
       AVG(total_monthly_consumption) as avg_consumption
FROM daily_water_consumption 
WHERE meter_status = 'Active';
```

### Maintenance Procedures

#### Monthly Data Updates:
1. Update `reading_month` to new period (e.g., 82025 for August 2025)
2. Insert new daily readings for all meters
3. Run data validation queries
4. Update computed statistics

#### Performance Monitoring:
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes 
WHERE tablename = 'daily_water_consumption';

-- Monitor query performance
EXPLAIN ANALYZE SELECT * FROM daily_zone_summary;
```

### Integration with Application

#### TypeScript Interface:
```typescript
interface DailyConsumption {
  account_number: string;
  customer_name: string;
  address: string;
  zone_classification: string;
  building_type: string;
  total_monthly_consumption: number;
  average_daily_consumption: number;
  meter_status: 'Active' | 'Inactive';
}
```

#### Supabase Integration:
```typescript
const { data, error } = await supabase
  .from('daily_water_consumption')
  .select('*')
  .eq('meter_status', 'Active')
  .order('total_monthly_consumption', { ascending: false })
  .limit(50);
```

### Backup and Recovery

#### Daily Backup:
```sql
-- Export data
COPY daily_water_consumption TO '/backup/daily_consumption_YYYYMMDD.csv' 
DELIMITER ',' CSV HEADER;
```

#### Restore from Backup:
```sql
-- Import data
COPY daily_water_consumption FROM '/backup/daily_consumption_YYYYMMDD.csv' 
DELIMITER ',' CSV HEADER;
```

### Security Considerations

1. **Access Control**: Implement row-level security in Supabase
2. **Data Encryption**: Ensure sensitive customer data is encrypted
3. **Audit Logging**: Track all data modifications
4. **Backup Security**: Secure backup files with encryption

### Support and Troubleshooting

#### Common Issues:

1. **Slow Query Performance**
   - Check if indexes are being used
   - Consider adding composite indexes for specific query patterns
   - Update table statistics: `ANALYZE daily_water_consumption;`

2. **Data Inconsistencies**
   - Run validation queries from `daily_consumption_analysis_queries.sql`
   - Check for null values in critical fields
   - Verify computed column calculations

3. **High Storage Usage**
   - Consider partitioning by reading_month for historical data
   - Archive old data to separate tables
   - Implement data retention policies

### Future Enhancements

1. **Real-time Data Integration**: Connect to IoT meter readings
2. **Predictive Analytics**: Machine learning for consumption forecasting
3. **Mobile App Integration**: Customer consumption dashboards
4. **Leak Detection Algorithms**: Advanced pattern recognition
5. **API Development**: RESTful endpoints for external integrations

### Contact Information

For technical support or questions about this database schema:
- Database Administrator: [Contact Details]
- System Developer: [Contact Details]
- Project Manager: [Contact Details]

---

**Last Updated**: August 26, 2025
**Version**: 1.0
**Compatible with**: PostgreSQL 13+, Supabase