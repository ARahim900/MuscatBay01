# STP DATABASE IMPORT AND USAGE INSTRUCTIONS

## OVERVIEW
This guide helps you import and maintain the Sewage Treatment Plant (STP) operational database in Supabase.

## FILES INCLUDED
1. `src/sql/STP_DATABASE_FIX.sql` - Complete database with all data from July 2024 to August 2025
2. `src/sql/STP_VALIDATION_QUERIES.sql` - Validation queries to check data integrity
3. `src/sql/STP_ANALYSIS_QUERIES.sql` - Operational analysis and monitoring queries

## STEP 1: IMPORT THE STP DATABASE

### 1.1 Open Supabase SQL Editor
- Go to your Supabase dashboard
- Click on "SQL Editor" in the left sidebar

### 1.2 Import the Complete Database
- Copy ALL content from `src/sql/STP_DATABASE_FIX.sql`
- Paste it into the SQL editor
- Click "Run" button
- This will:
  - Drop any existing STP table
  - Create new table with proper structure
  - Import all daily records from July 2024 to August 2025
  - Create performance indexes

## STEP 2: VALIDATE THE DATA

Run these queries from `STP_VALIDATION_QUERIES.sql` to ensure data integrity:

### Check for Missing Dates
```sql
-- This query identifies any missing dates in the sequence
-- Run Query #1 from STP_VALIDATION_QUERIES.sql
```

### Check for Duplicates
```sql
-- This query finds any duplicate date entries
-- Run Query #2 from STP_VALIDATION_QUERIES.sql
```

### Verify Data Calculations
```sql
-- This validates that all calculations are correct
-- Run Query #3 from STP_VALIDATION_QUERIES.sql
```

### Monthly Completeness Check
```sql
-- Shows how many days are recorded per month
-- Run Query #6 from STP_VALIDATION_QUERIES.sql
```

## STEP 3: ANALYZE OPERATIONAL PERFORMANCE

Use queries from `STP_ANALYSIS_QUERIES.sql` for operational insights:

### Executive Dashboard
```sql
-- Get current month KPIs and compare with previous month
-- Run Query #1 from STP_ANALYSIS_QUERIES.sql
```

### Financial Summary
```sql
-- Monthly revenue and savings analysis
-- Run Query #2 from STP_ANALYSIS_QUERIES.sql
```

### Treatment Efficiency
```sql
-- Monitor TSE recovery rates and treatment efficiency
-- Run Query #3 from STP_ANALYSIS_QUERIES.sql
```

## DATA STRUCTURE

The STP database tracks daily operations with these metrics:

### Input Metrics
- **tankers_discharged**: Number of tankers processed daily
- **expected_tanker_volume**: Volume from tankers (20 m³ per tanker)
- **direct_inline_sewage**: Direct sewage input from pipelines
- **total_inlet_received**: Total input (tankers + inline)

### Output Metrics
- **total_treated_water**: Total water treated
- **total_tse_output**: Treated Sewage Effluent produced

### Financial Metrics
- **income_from_tankers**: Revenue from tanker discharge (4.5 OMR per tanker)
- **saving_from_tse**: Savings from TSE reuse (1.32 OMR per m³)
- **total_saving_income**: Total financial benefit

## COMMON QUERIES

### Daily Average for Current Month
```sql
SELECT 
    ROUND(AVG(tankers_discharged), 1) AS avg_tankers,
    ROUND(AVG(total_inlet_received), 0) AS avg_inlet,
    ROUND(AVG(total_tse_output), 0) AS avg_tse,
    ROUND(AVG(total_saving_income), 0) AS avg_income
FROM stp_daily_records
WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE);
```

### Last 7 Days Performance
```sql
SELECT 
    date,
    tankers_discharged,
    total_inlet_received,
    total_tse_output,
    total_saving_income
FROM stp_daily_records
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

### TSE Recovery Rate by Month
```sql
SELECT 
    TO_CHAR(date, 'YYYY-MM') AS month,
    ROUND(AVG((total_tse_output::NUMERIC / total_treated_water) * 100), 1) AS tse_recovery_pct
FROM stp_daily_records
WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month;
```

## TROUBLESHOOTING

### If Import Fails
1. Check if the table already exists - the script drops it first
2. Ensure you're running the entire SQL file, not just parts
3. Check for any error messages in Supabase

### If Data Looks Wrong
1. Run validation Query #3 to identify calculation errors
2. Check for outliers using Query #7 in validation
3. Verify monthly totals match expected values

### Missing Dates
- The database should have continuous daily records
- Run validation Query #1 to identify gaps
- Missing dates may indicate operational shutdowns

## MAINTENANCE

### Adding New Daily Records
```sql
INSERT INTO stp_daily_records (
    date, tankers_discharged, expected_tanker_volume, 
    direct_inline_sewage, total_inlet_received, 
    total_treated_water, total_tse_output,
    income_from_tankers, saving_from_tse, total_saving_income
) VALUES (
    '2025-08-16', -- date
    24, -- tankers
    480, -- tanker volume (tankers * 20)
    1333, -- inline sewage
    1813, -- total inlet (tanker volume + inline)
    1833, -- treated water
    1620, -- TSE output
    108.0, -- income (tankers * 4.5)
    2138, -- TSE savings (TSE * 1.32)
    2246 -- total savings
);
```

### Updating Existing Records
```sql
UPDATE stp_daily_records 
SET 
    tankers_discharged = 25,
    expected_tanker_volume = 500,
    income_from_tankers = 112.5,
    updated_at = CURRENT_TIMESTAMP
WHERE date = '2025-08-15';
```

## KEY METRICS TO MONITOR

1. **TSE Recovery Rate**: Should be 85-90% of treated water
2. **Treatment Efficiency**: Should be 100-110% of inlet
3. **Daily Tankers**: Average 10-15 per day
4. **Financial Performance**: Track monthly revenue trends
5. **Capacity Utilization**: Monitor against design capacity

## INTEGRATION WITH APPLICATION

Your application should:
1. Display daily/monthly summaries
2. Show TSE recovery trends
3. Calculate financial metrics
4. Alert on anomalies or missing data
5. Generate monthly reports

## SUPPORT QUERIES

For any issues or questions about the STP database:
1. Check validation queries for data integrity
2. Review analysis queries for performance insights
3. Ensure all calculations follow the formulas:
   - Expected Volume = Tankers × 20
   - Total Inlet = Tanker Volume + Inline Sewage
   - Income = Tankers × 4.5
   - TSE Savings = TSE Output × 1.32