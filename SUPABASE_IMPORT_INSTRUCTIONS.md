# SUPABASE WATER DATABASE IMPORT INSTRUCTIONS

## STEP 1: IMPORT THE COMPLETE DATABASE

1. **Open Supabase SQL Editor**
   - Go to your Supabase dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Run the Main Import**
   - Copy ALL content from `COMPLETE_WATER_DATABASE_IMPORT.sql`
   - Paste it into the SQL editor
   - Click "Run" button
   - This imports:
     - 1 Main Bulk (L1)
     - 7 Zone Bulks (L2)
     - 11 Direct Connections (DC)
     - 2 N/A meters
     - ALL L3 meters for all zones

3. **Run the L4 Apartments Import**
   - Clear the SQL editor
   - Copy ALL content from `COMPLETE_L4_APARTMENTS_IMPORT.sql`
   - Paste it into the SQL editor
   - Click "Run" button
   - This adds all L4 apartment meters

## STEP 2: VALIDATE THE DATA

After importing, run these validation queries in the SQL editor to ensure everything is correct:

### Check Total Meters Count
```sql
-- Should show 300+ meters total
SELECT 
    label,
    COUNT(*) as count
FROM water_meters
GROUP BY label
ORDER BY label;
```

Expected results:
- L1: 1 meter (Main Bulk)
- L2: 8 meters (7 Zone Bulks + 1 in Direct Connection)
- L3: ~170 meters
- L4: ~120 meters
- DC: 10 meters
- N/A: 2 meters

### Check All Zones Are Present
```sql
-- Should show all 7 zones + Direct Connection + N/A + Main Bulk
SELECT 
    zone,
    COUNT(*) as meter_count
FROM water_meters
GROUP BY zone
ORDER BY zone;
```

Expected zones:
- Direct Connection (11 meters)
- Main Bulk (1 meter)
- N/A (2 meters)
- Zone_01_(FM)
- Zone_03_(A)
- Zone_03_(B)
- Zone_05
- Zone_08
- Zone_SC
- Zone_VS

### Verify Zone_08 (Example)
```sql
-- Zone_08 should have 1 L2 bulk + 22 L3 villas
SELECT 
    label,
    type,
    COUNT(*) as count
FROM water_meters
WHERE zone = 'Zone_08'
GROUP BY label, type;
```

### Check Direct Connections
```sql
-- Should show all Direct Connection meters
SELECT 
    meter_label,
    type,
    jan_25 + feb_25 + mar_25 + apr_25 + may_25 + jun_25 as total_6month
FROM water_meters
WHERE zone = 'Direct Connection'
ORDER BY meter_label;
```

## STEP 3: RUN DATA VALIDATION (WHAT IT MEANS)

"Execute water_data_validation.sql" means:

1. **Copy the validation SQL**
   - Open `water_data_validation.sql`
   - This file contains SQL queries that:
     - Fix any incorrect parent references
     - Fix type naming issues
     - Check for data problems
     - Validate parent-child relationships

2. **Run it section by section**
   - Copy the UPDATE statements first (these fix issues)
   - Run them in SQL editor
   - Then run the SELECT validation queries
   - Review the results to see if there are any errors

### Example Validation Queries:
```sql
-- Check if all L3 meters have valid L2 parents
SELECT 
    m.zone,
    m.meter_label,
    m.parent_meter,
    CASE 
        WHEN p.meter_label IS NULL THEN 'ERROR: Parent not found'
        ELSE 'OK'
    END as status
FROM water_meters m
LEFT JOIN water_meters p ON m.parent_meter = p.meter_label
WHERE m.label = 'L3'
  AND p.meter_label IS NULL;
```

## STEP 4: VERIFY WATER LOSS CALCULATIONS

Run this to see water loss per zone:
```sql
WITH zone_loss AS (
    SELECT 
        zone,
        SUM(CASE WHEN label = 'L2' THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as bulk_total,
        SUM(CASE WHEN label IN ('L3', 'L4') THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as metered_total
    FROM water_meters
    WHERE zone LIKE 'Zone_%'
    GROUP BY zone
)
SELECT 
    zone,
    bulk_total as zone_input,
    metered_total as metered_consumption,
    (bulk_total - metered_total) as water_loss,
    ROUND(((bulk_total - metered_total)::numeric / bulk_total * 100), 2) as loss_percentage
FROM zone_loss
WHERE bulk_total IS NOT NULL
ORDER BY zone;
```

## TROUBLESHOOTING

If you see missing data:

1. **Zone_SC or Zone_VS missing?**
   - Make sure you ran BOTH import files
   - Check for any error messages

2. **Direct Connections missing?**
   - They should be in the first import file
   - Look for zone = 'Direct Connection'

3. **Low meter count?**
   - You may have only run part of the SQL
   - Re-run the complete import files

4. **Parent meter errors?**
   - Run the UPDATE statements in water_data_validation.sql
   - These fix the parent references

## FILES TO USE

1. `COMPLETE_WATER_DATABASE_IMPORT.sql` - Main import (L1, L2, L3, DC, N/A meters)
2. `COMPLETE_L4_APARTMENTS_IMPORT.sql` - All L4 apartment meters
3. `water_data_validation.sql` - Fixes and validates data
4. `water_system_analysis_queries.sql` - Analysis reports
5. `water_loss_analysis.sql` - Water loss calculations