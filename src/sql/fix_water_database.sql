-- =====================================================
-- WATER DATABASE FIX SCRIPT FOR SUPABASE
-- =====================================================
-- This script will fix common issues in the water_meters table
-- Run this in your Supabase SQL Editor

-- 1. First, let's check the current state of your data
SELECT 
    zone,
    label,
    type,
    COUNT(*) as meter_count
FROM water_meters
GROUP BY zone, label, type
ORDER BY zone, label;

-- 2. Fix zone naming issues (if zones don't have underscores)
-- UPDATE water_meters 
-- SET zone = CASE
--     WHEN zone = 'Zone 08' OR zone = 'Zone 8' THEN 'Zone_08'
--     WHEN zone = 'Zone 03 (A)' OR zone = 'Zone 3A' THEN 'Zone_03_(A)'
--     WHEN zone = 'Zone 03 (B)' OR zone = 'Zone 3B' THEN 'Zone_03_(B)'
--     WHEN zone = 'Zone 05' OR zone = 'Zone 5' THEN 'Zone_05'
--     WHEN zone = 'Zone 01 (FM)' OR zone = 'Zone FM' THEN 'Zone_01_(FM)'
--     WHEN zone = 'Zone SC' OR zone = 'Sales Center' THEN 'Zone_SC'
--     WHEN zone = 'Zone VS' OR zone = 'Village Square' THEN 'Zone_VS'
--     ELSE zone
-- END
-- WHERE zone IS NOT NULL;

-- 3. Fix meter type naming to match expected values
-- UPDATE water_meters
-- SET type = CASE
--     -- Irrigation types
--     WHEN LOWER(type) LIKE '%irrig%' THEN 'IRR_Services'
--     WHEN LOWER(type) LIKE '%garden%' THEN 'IRR_Services'
--     WHEN LOWER(type) LIKE '%landscape%' THEN 'IRR_Services'
--     
--     -- Residential types
--     WHEN LOWER(type) LIKE '%villa%' THEN 'Residential (Villa)'
--     WHEN LOWER(type) LIKE '%apartment%' THEN 'Residential (Apartment)'
--     WHEN LOWER(type) LIKE '%residential%' THEN 'Residential'
--     
--     -- Commercial types
--     WHEN LOWER(type) LIKE '%retail%' THEN 'Commercial (Retail)'
--     WHEN LOWER(type) LIKE '%commercial%' THEN 'Commercial'
--     WHEN LOWER(type) LIKE '%office%' THEN 'Commercial (Office)'
--     
--     -- Building types
--     WHEN LOWER(type) LIKE '%building bulk%' THEN 'D_Building_Bulk'
--     WHEN LOWER(type) LIKE '%building common%' THEN 'D_Building_Common'
--     WHEN LOWER(type) LIKE '%mb common%' THEN 'MB_Common'
--     
--     -- Zone bulk types
--     WHEN LOWER(type) LIKE '%zone bulk%' THEN 'Zone Bulk'
--     WHEN LOWER(type) LIKE '%main bulk%' THEN 'Main Bulk'
--     
--     ELSE type
-- END
-- WHERE type IS NOT NULL;

-- 4. Ensure label hierarchy is correct
-- UPDATE water_meters
-- SET label = CASE
--     WHEN type = 'Main Bulk' THEN 'L1'
--     WHEN type = 'Zone Bulk' THEN 'L2'
--     WHEN type IN ('D_Building_Bulk', 'Residential (Villa)') THEN 'L3'
--     WHEN type = 'Residential (Apartment)' THEN 'L4'
--     WHEN parent_meter IS NULL AND label IS NULL THEN 'DC'
--     ELSE label
-- END
-- WHERE label IS NULL OR label = '';

-- 5. Fix parent_meter relationships
-- UPDATE water_meters m1
-- SET parent_meter = (
--     SELECT meter_label 
--     FROM water_meters m2 
--     WHERE m2.zone = m1.zone 
--     AND m2.label = 'L2'
--     LIMIT 1
-- )
-- WHERE m1.label IN ('L3', 'L4') 
-- AND (m1.parent_meter IS NULL OR m1.parent_meter = '');

-- 6. Ensure consumption data is numeric and not NULL
-- UPDATE water_meters
-- SET 
--     jan_25 = COALESCE(jan_25, 0),
--     feb_25 = COALESCE(feb_25, 0),
--     mar_25 = COALESCE(mar_25, 0),
--     apr_25 = COALESCE(apr_25, 0),
--     may_25 = COALESCE(may_25, 0),
--     jun_25 = COALESCE(jun_25, 0),
--     jul_25 = COALESCE(jul_25, 0)
-- WHERE jan_25 IS NULL OR feb_25 IS NULL OR mar_25 IS NULL 
--    OR apr_25 IS NULL OR may_25 IS NULL OR jun_25 IS NULL OR jul_25 IS NULL;

-- 7. Add any missing Zone_08 meters if they don't exist
-- INSERT INTO water_meters (meter_label, account_number, label, zone, type, jan_25, feb_25, mar_25, apr_25, may_25, jun_25, jul_25)
-- VALUES 
-- ('ZONE 8 (Bulk Zone 8)', '4300342', 'L2', 'Zone_08', 'Zone Bulk', 1547, 1498, 2605, 3203, 2937, 3142, 0),
-- ('Z8-11', '4300023', 'L3', 'Zone_08', 'Residential (Villa)', 0, 1, 0, 0, 0, 0, 0),
-- ('Z8-13', '4300024', 'L3', 'Zone_08', 'Residential (Villa)', 0, 0, 0, 0, 0, 1, 0)
-- ON CONFLICT (account_number) DO NOTHING;

-- 8. Verify the fixes
SELECT 
    zone,
    label,
    type,
    COUNT(*) as count,
    SUM(jan_25 + feb_25 + mar_25 + apr_25 + may_25 + jun_25) as total_consumption
FROM water_meters
GROUP BY zone, label, type
ORDER BY zone, label;

-- 9. Check Zone_08 specifically
SELECT * FROM water_meters 
WHERE zone = 'Zone_08' 
ORDER BY label, meter_label;

-- =====================================================
-- IMPORTANT: Uncomment the UPDATE statements above 
-- after reviewing them to apply the fixes
-- =====================================================