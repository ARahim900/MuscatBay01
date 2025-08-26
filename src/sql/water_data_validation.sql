-- =====================================================
-- WATER DATABASE VALIDATION & INTEGRITY CHECKS
-- Run after importing data to ensure correctness
-- =====================================================

-- ========== CRITICAL DATA FIXES ==========

-- Fix parent meter references for all zones
UPDATE water_meters 
SET parent_meter = CASE
    -- Zone_08 fixes
    WHEN zone = 'Zone_08' AND label = 'L3' AND parent_meter = 'BULK ZONE 8' 
        THEN 'ZONE 8 (Bulk Zone 8)'
    
    -- Zone_03_(A) fixes
    WHEN zone = 'Zone_03_(A)' AND label IN ('L3', 'L4') AND parent_meter = 'ZONE 3A (BULK ZONE 3A)'
        THEN 'ZONE 3A (Bulk Zone 3A)'
    
    -- Zone_03_(B) fixes
    WHEN zone = 'Zone_03_(B)' AND label IN ('L3', 'L4') AND parent_meter = 'ZONE 3B (BULK ZONE 3B)'
        THEN 'ZONE 3B (Bulk Zone 3B)'
    
    -- Zone_SC fixes
    WHEN zone = 'Zone_SC' AND parent_meter = 'Sale Centre (Zone Bulk)'
        THEN 'Sales Center Common Building'
    
    -- Zone_01_(FM) fixes
    WHEN zone = 'Zone_01_(FM)' AND label = 'L3' AND parent_meter = 'ZONE FM (BULK ZONE FM)'
        THEN 'ZONE FM ( BULK ZONE FM )'
    
    -- Zone_05 fixes
    WHEN zone = 'Zone_05' AND label = 'L3' AND parent_meter = 'BULK ZONE 5'
        THEN 'ZONE 5 (Bulk Zone 5)'
    
    ELSE parent_meter
END
WHERE parent_meter IN (
    'BULK ZONE 8', 
    'ZONE 3A (BULK ZONE 3A)', 
    'ZONE 3B (BULK ZONE 3B)',
    'Sale Centre (Zone Bulk)',
    'ZONE FM (BULK ZONE FM)',
    'BULK ZONE 5'
);

-- Fix type naming inconsistencies
UPDATE water_meters 
SET type = CASE
    WHEN type = 'IRR_Servies' THEN 'IRR_Services'
    WHEN type = 'Main BULK' THEN 'Main Bulk'
    WHEN type = 'Residential (Apart)' THEN 'Residential (Apartment)'
    WHEN type = 'Building' THEN 'D_Building_Bulk'
    ELSE type
END
WHERE type IN ('IRR_Servies', 'Main BULK', 'Residential (Apart)', 'Building');

-- ========== VALIDATION REPORT ==========

-- 1. Check zone structure is correct
WITH zone_structure AS (
    SELECT 
        zone,
        SUM(CASE WHEN label = 'L2' THEN 1 ELSE 0 END) as l2_count,
        SUM(CASE WHEN label = 'L3' THEN 1 ELSE 0 END) as l3_count,
        SUM(CASE WHEN label = 'L4' THEN 1 ELSE 0 END) as l4_count
    FROM water_meters
    WHERE zone LIKE 'Zone_%'
    GROUP BY zone
)
SELECT 
    'ZONE STRUCTURE CHECK' as validation,
    zone,
    CASE 
        WHEN l2_count = 0 THEN 'ERROR: Missing L2 bulk meter'
        WHEN l2_count > 1 THEN 'WARNING: Multiple L2 meters'
        WHEN l3_count = 0 THEN 'ERROR: No L3 meters'
        ELSE 'OK'
    END as status,
    l2_count as bulk_meters,
    l3_count as building_meters,
    l4_count as apartment_meters
FROM zone_structure
ORDER BY zone;

-- 2. Validate parent-child relationships
WITH parent_check AS (
    SELECT 
        m.zone,
        m.label,
        m.meter_label,
        m.parent_meter,
        p.meter_label as parent_exists,
        p.label as parent_label,
        p.zone as parent_zone
    FROM water_meters m
    LEFT JOIN water_meters p ON m.parent_meter = p.meter_label
    WHERE m.label IN ('L2', 'L3', 'L4', 'DC')
      AND m.parent_meter NOT IN ('NAMA', 'N/A')
)
SELECT 
    'PARENT VALIDATION' as check_type,
    zone,
    label,
    meter_label,
    parent_meter,
    CASE 
        WHEN parent_exists IS NULL THEN 'ERROR: Parent not found'
        WHEN label = 'L2' AND parent_label != 'L1' THEN 'ERROR: L2 parent should be L1'
        WHEN label = 'L3' AND parent_label NOT IN ('L2') THEN 'ERROR: L3 parent should be L2'
        WHEN label = 'L4' AND parent_label NOT IN ('L3') THEN 'ERROR: L4 parent should be L3'
        ELSE 'OK'
    END as validation_status
FROM parent_check
WHERE parent_exists IS NULL 
   OR (label = 'L2' AND parent_label != 'L1')
   OR (label = 'L3' AND parent_label NOT IN ('L2'))
   OR (label = 'L4' AND parent_label NOT IN ('L3'));

-- 3. Check for data anomalies
SELECT 'DATA ANOMALIES CHECK' as check_type;

-- Negative consumption values
SELECT 
    'Negative Values' as anomaly_type,
    meter_label,
    zone,
    type,
    'Jan=' || jan_25 as jan,
    'Feb=' || feb_25 as feb,
    'Mar=' || mar_25 as mar,
    'Apr=' || apr_25 as apr,
    'May=' || may_25 as may,
    'Jun=' || jun_25 as jun,
    'Jul=' || jul_25 as jul
FROM water_meters
WHERE jan_25 < 0 OR feb_25 < 0 OR mar_25 < 0 OR apr_25 < 0 
   OR may_25 < 0 OR jun_25 < 0 OR jul_25 < 0;

-- Duplicate account numbers
SELECT 
    'Duplicate Accounts' as anomaly_type,
    account_number,
    COUNT(*) as occurrences,
    STRING_AGG(meter_label || ' (' || zone || ')', ', ') as meters
FROM water_meters
GROUP BY account_number
HAVING COUNT(*) > 1;

-- 4. Zone-specific validations
SELECT 'ZONE-SPECIFIC VALIDATION' as check_type;

-- Zone_08 should have exactly 1 L2 and 22 L3 meters
SELECT 
    'Zone_08' as zone,
    CASE 
        WHEN (SELECT COUNT(*) FROM water_meters WHERE zone = 'Zone_08' AND label = 'L2') != 1 
            THEN 'ERROR: Should have exactly 1 L2 meter'
        WHEN (SELECT COUNT(*) FROM water_meters WHERE zone = 'Zone_08' AND label = 'L3') != 22 
            THEN 'ERROR: Should have exactly 22 L3 meters (villas)'
        ELSE 'OK: 1 L2 bulk + 22 L3 villas'
    END as validation;

-- Zone_03_(A) should have exactly 1 L2, 22 villas, and building bulks
SELECT 
    'Zone_03_(A)' as zone,
    'L2=' || (SELECT COUNT(*) FROM water_meters WHERE zone = 'Zone_03_(A)' AND label = 'L2') ||
    ', Villas=' || (SELECT COUNT(*) FROM water_meters WHERE zone = 'Zone_03_(A)' AND label = 'L3' AND type = 'Residential (Villa)') ||
    ', Buildings=' || (SELECT COUNT(*) FROM water_meters WHERE zone = 'Zone_03_(A)' AND label = 'L3' AND type = 'D_Building_Bulk') as structure;

-- Zone_03_(B) should have exactly 1 L2, 22 villas, and building bulks  
SELECT 
    'Zone_03_(B)' as zone,
    'L2=' || (SELECT COUNT(*) FROM water_meters WHERE zone = 'Zone_03_(B)' AND label = 'L2') ||
    ', Villas=' || (SELECT COUNT(*) FROM water_meters WHERE zone = 'Zone_03_(B)' AND label = 'L3' AND type = 'Residential (Villa)') ||
    ', Buildings=' || (SELECT COUNT(*) FROM water_meters WHERE zone = 'Zone_03_(B)' AND label = 'L3' AND type = 'D_Building_Bulk') as structure;

-- Zone_05 should have exactly 1 L2 and 33 villas
SELECT 
    'Zone_05' as zone,
    CASE 
        WHEN (SELECT COUNT(*) FROM water_meters WHERE zone = 'Zone_05' AND label = 'L2') != 1 
            THEN 'ERROR: Should have exactly 1 L2 meter'
        WHEN (SELECT COUNT(*) FROM water_meters WHERE zone = 'Zone_05' AND label = 'L3' AND type = 'Residential (Villa)') != 33 
            THEN 'ERROR: Should have exactly 33 L3 villas'
        ELSE 'OK: 1 L2 bulk + 33 L3 villas'
    END as validation;

-- 5. Type category validation
SELECT 'TYPE CATEGORY VALIDATION' as check_type;

SELECT 
    type,
    COUNT(*) as count,
    COUNT(DISTINCT zone) as zones_present,
    MIN(label) as min_label,
    MAX(label) as max_label
FROM water_meters
GROUP BY type
ORDER BY count DESC;

-- 6. Monthly consumption patterns check
WITH consumption_stats AS (
    SELECT 
        zone,
        label,
        AVG(COALESCE(jan_25,0)) as avg_jan,
        AVG(COALESCE(feb_25,0)) as avg_feb,
        AVG(COALESCE(mar_25,0)) as avg_mar,
        AVG(COALESCE(apr_25,0)) as avg_apr,
        AVG(COALESCE(may_25,0)) as avg_may,
        AVG(COALESCE(jun_25,0)) as avg_jun,
        STDDEV(COALESCE(jan_25,0)) as std_jan,
        STDDEV(COALESCE(may_25,0)) as std_may
    FROM water_meters
    WHERE label IN ('L3', 'L4')
    GROUP BY zone, label
)
SELECT 
    'CONSUMPTION PATTERN CHECK' as check_type,
    zone,
    label,
    ROUND(avg_jan, 2) as avg_jan,
    ROUND(avg_may, 2) as avg_may,
    CASE 
        WHEN avg_may > avg_jan * 3 THEN 'HIGH: May consumption 3x higher than Jan'
        WHEN avg_may > avg_jan * 2 THEN 'MODERATE: May consumption 2x higher than Jan'
        ELSE 'NORMAL'
    END as seasonal_pattern
FROM consumption_stats
ORDER BY zone, label;

-- 7. Water loss validation per zone
WITH loss_calc AS (
    SELECT 
        zone,
        SUM(CASE WHEN label = 'L2' THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as bulk_consumption,
        SUM(CASE WHEN label IN ('L3', 'L4') THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as individual_consumption
    FROM water_meters
    WHERE zone LIKE 'Zone_%'
    GROUP BY zone
)
SELECT 
    'WATER LOSS VALIDATION' as check_type,
    zone,
    bulk_consumption,
    individual_consumption,
    (bulk_consumption - individual_consumption) as water_loss,
    ROUND(((bulk_consumption - individual_consumption)::numeric / NULLIF(bulk_consumption, 0) * 100), 2) as loss_percentage,
    CASE 
        WHEN ((bulk_consumption - individual_consumption)::numeric / NULLIF(bulk_consumption, 0) * 100) > 50 
            THEN 'CRITICAL: Loss > 50%'
        WHEN ((bulk_consumption - individual_consumption)::numeric / NULLIF(bulk_consumption, 0) * 100) > 30 
            THEN 'HIGH: Loss > 30%'
        WHEN ((bulk_consumption - individual_consumption)::numeric / NULLIF(bulk_consumption, 0) * 100) > 15 
            THEN 'MODERATE: Loss > 15%'
        WHEN individual_consumption > bulk_consumption
            THEN 'ERROR: Individual > Bulk (check data)'
        ELSE 'ACCEPTABLE'
    END as loss_status
FROM loss_calc
WHERE bulk_consumption IS NOT NULL
ORDER BY loss_percentage DESC;

-- 8. Final summary
SELECT 'VALIDATION SUMMARY' as report;

WITH summary AS (
    SELECT 
        COUNT(*) as total_meters,
        COUNT(DISTINCT zone) as zones,
        COUNT(DISTINCT type) as types,
        COUNT(CASE WHEN jan_25 < 0 OR feb_25 < 0 OR mar_25 < 0 OR 
                       apr_25 < 0 OR may_25 < 0 OR jun_25 < 0 OR jul_25 < 0 THEN 1 END) as negative_values,
        COUNT(CASE WHEN label = 'L1' THEN 1 END) as l1_meters,
        COUNT(CASE WHEN label = 'L2' THEN 1 END) as l2_meters,
        COUNT(CASE WHEN label = 'L3' THEN 1 END) as l3_meters,
        COUNT(CASE WHEN label = 'L4' THEN 1 END) as l4_meters,
        COUNT(CASE WHEN label = 'DC' THEN 1 END) as dc_meters,
        COUNT(CASE WHEN label = 'N/A' THEN 1 END) as na_meters
    FROM water_meters
)
SELECT 
    total_meters,
    zones,
    types,
    negative_values,
    'L1=' || l1_meters || ', L2=' || l2_meters || ', L3=' || l3_meters || 
    ', L4=' || l4_meters || ', DC=' || dc_meters || ', N/A=' || na_meters as meter_distribution,
    CASE 
        WHEN negative_values > 0 THEN 'WARNING: Negative values found'
        WHEN l1_meters != 1 THEN 'ERROR: Should have exactly 1 main bulk meter'
        WHEN l2_meters < 5 THEN 'ERROR: Missing zone bulk meters'
        ELSE 'VALIDATION PASSED'
    END as overall_status
FROM summary;

-- ========== POST-VALIDATION FIXES ==========

-- If validation finds issues, run these fixes:

-- Fix any remaining parent meter issues
UPDATE water_meters m
SET parent_meter = (
    SELECT meter_label 
    FROM water_meters p 
    WHERE p.zone = m.zone 
      AND p.label = 'L2'
    LIMIT 1
)
WHERE m.label = 'L3' 
  AND m.zone LIKE 'Zone_%'
  AND NOT EXISTS (
    SELECT 1 
    FROM water_meters p 
    WHERE p.meter_label = m.parent_meter
  );

-- Ensure all zones have proper hierarchy
SELECT 
    'POST-FIX VALIDATION' as final_check,
    zone,
    COUNT(CASE WHEN label = 'L2' THEN 1 END) as bulk_meters,
    COUNT(CASE WHEN label = 'L3' THEN 1 END) as building_meters,
    COUNT(CASE WHEN label = 'L4' THEN 1 END) as apartment_meters,
    COUNT(*) as total
FROM water_meters
WHERE zone LIKE 'Zone_%'
GROUP BY zone
ORDER BY zone;