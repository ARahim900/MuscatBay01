-- =====================================================
-- COMPREHENSIVE WATER SYSTEM ANALYSIS QUERIES
-- For monitoring, verification, and loss tracking
-- =====================================================

-- ========== 1. SYSTEM OVERVIEW ==========

-- Complete System Statistics
SELECT 
    'SYSTEM OVERVIEW' as report_section,
    COUNT(*) as total_meters,
    COUNT(DISTINCT zone) as unique_zones,
    COUNT(DISTINCT type) as meter_types,
    COUNT(CASE WHEN label = 'L1' THEN 1 END) as main_bulk_meters,
    COUNT(CASE WHEN label = 'L2' THEN 1 END) as zone_bulk_meters,
    COUNT(CASE WHEN label = 'L3' THEN 1 END) as building_meters,
    COUNT(CASE WHEN label = 'L4' THEN 1 END) as apartment_meters,
    COUNT(CASE WHEN label = 'DC' THEN 1 END) as direct_connections,
    COUNT(CASE WHEN label = 'N/A' THEN 1 END) as special_meters
FROM water_meters;

-- ========== 2. ZONE-WISE ANALYSIS ==========

-- Detailed Zone Breakdown with Monthly Consumption
SELECT 
    zone,
    label,
    type,
    COUNT(*) as meters,
    SUM(COALESCE(jan_25,0)) as jan,
    SUM(COALESCE(feb_25,0)) as feb,
    SUM(COALESCE(mar_25,0)) as mar,
    SUM(COALESCE(apr_25,0)) as apr,
    SUM(COALESCE(may_25,0)) as may,
    SUM(COALESCE(jun_25,0)) as jun,
    SUM(COALESCE(jul_25,0)) as jul,
    SUM(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
        COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) + COALESCE(jul_25,0)) as total_7month
FROM water_meters
GROUP BY zone, label, type
ORDER BY zone, label, type;

-- Zone Summary by Type Categories
SELECT 
    zone,
    COUNT(CASE WHEN type LIKE 'Residential%' THEN 1 END) as residential_meters,
    COUNT(CASE WHEN type = 'Retail' THEN 1 END) as retail_meters,
    COUNT(CASE WHEN type = 'IRR_Services' THEN 1 END) as irrigation_meters,
    COUNT(CASE WHEN type LIKE '%Building%' THEN 1 END) as building_meters,
    COUNT(CASE WHEN type LIKE '%Common%' THEN 1 END) as common_meters,
    COUNT(*) as total_meters
FROM water_meters
WHERE zone NOT IN ('Main Bulk', 'Direct Connection', 'N/A')
GROUP BY zone
ORDER BY zone;

-- ========== 3. WATER LOSS CALCULATIONS ==========

-- Monthly Water Loss Analysis by Zone
WITH monthly_consumption AS (
    SELECT 
        zone,
        'January' as month,
        SUM(CASE WHEN label = 'L2' THEN COALESCE(jan_25,0) END) as bulk,
        SUM(CASE WHEN label IN ('L3','L4') THEN COALESCE(jan_25,0) END) as individual
    FROM water_meters WHERE zone LIKE 'Zone_%' GROUP BY zone
    UNION ALL
    SELECT 
        zone,
        'February',
        SUM(CASE WHEN label = 'L2' THEN COALESCE(feb_25,0) END),
        SUM(CASE WHEN label IN ('L3','L4') THEN COALESCE(feb_25,0) END)
    FROM water_meters WHERE zone LIKE 'Zone_%' GROUP BY zone
    UNION ALL
    SELECT 
        zone,
        'March',
        SUM(CASE WHEN label = 'L2' THEN COALESCE(mar_25,0) END),
        SUM(CASE WHEN label IN ('L3','L4') THEN COALESCE(mar_25,0) END)
    FROM water_meters WHERE zone LIKE 'Zone_%' GROUP BY zone
    UNION ALL
    SELECT 
        zone,
        'April',
        SUM(CASE WHEN label = 'L2' THEN COALESCE(apr_25,0) END),
        SUM(CASE WHEN label IN ('L3','L4') THEN COALESCE(apr_25,0) END)
    FROM water_meters WHERE zone LIKE 'Zone_%' GROUP BY zone
    UNION ALL
    SELECT 
        zone,
        'May',
        SUM(CASE WHEN label = 'L2' THEN COALESCE(may_25,0) END),
        SUM(CASE WHEN label IN ('L3','L4') THEN COALESCE(may_25,0) END)
    FROM water_meters WHERE zone LIKE 'Zone_%' GROUP BY zone
    UNION ALL
    SELECT 
        zone,
        'June',
        SUM(CASE WHEN label = 'L2' THEN COALESCE(jun_25,0) END),
        SUM(CASE WHEN label IN ('L3','L4') THEN COALESCE(jun_25,0) END)
    FROM water_meters WHERE zone LIKE 'Zone_%' GROUP BY zone
)
SELECT 
    zone,
    month,
    bulk as zone_bulk_consumption,
    individual as individual_consumption,
    (bulk - individual) as water_loss,
    CASE 
        WHEN bulk > 0 THEN ROUND(((bulk - individual)::numeric / bulk * 100), 2)
        ELSE 0 
    END as loss_percentage
FROM monthly_consumption
WHERE bulk IS NOT NULL
ORDER BY zone, 
    CASE month
        WHEN 'January' THEN 1
        WHEN 'February' THEN 2
        WHEN 'March' THEN 3
        WHEN 'April' THEN 4
        WHEN 'May' THEN 5
        WHEN 'June' THEN 6
    END;

-- Cumulative Water Loss Summary
WITH zone_totals AS (
    SELECT 
        zone,
        SUM(CASE WHEN label = 'L2' THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as bulk_total,
        SUM(CASE WHEN label = 'L3' THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as l3_total,
        SUM(CASE WHEN label = 'L4' THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as l4_total
    FROM water_meters
    WHERE zone LIKE 'Zone_%'
    GROUP BY zone
)
SELECT 
    zone,
    bulk_total as zone_bulk_6month,
    COALESCE(l3_total, 0) as l3_consumption,
    COALESCE(l4_total, 0) as l4_consumption,
    COALESCE(l3_total, 0) + COALESCE(l4_total, 0) as total_individual,
    bulk_total - (COALESCE(l3_total, 0) + COALESCE(l4_total, 0)) as water_loss,
    ROUND(((bulk_total - (COALESCE(l3_total, 0) + COALESCE(l4_total, 0)))::numeric / 
           NULLIF(bulk_total, 0) * 100), 2) as loss_percentage
FROM zone_totals
WHERE bulk_total IS NOT NULL
ORDER BY zone;

-- ========== 4. TYPE CATEGORY ANALYSIS ==========

-- Consumption by Meter Type
SELECT 
    type,
    COUNT(*) as meter_count,
    AVG(COALESCE(jan_25,0)) as avg_jan,
    AVG(COALESCE(feb_25,0)) as avg_feb,
    AVG(COALESCE(mar_25,0)) as avg_mar,
    AVG(COALESCE(apr_25,0)) as avg_apr,
    AVG(COALESCE(may_25,0)) as avg_may,
    AVG(COALESCE(jun_25,0)) as avg_jun,
    SUM(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
        COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0)) as total_6month
FROM water_meters
GROUP BY type
ORDER BY total_6month DESC;

-- Residential Analysis
SELECT 
    CASE 
        WHEN type = 'Residential (Villa)' THEN 'Villas'
        WHEN type = 'Residential (Apartment)' THEN 'Apartments'
        ELSE 'Other'
    END as residential_type,
    zone,
    COUNT(*) as units,
    SUM(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
        COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0)) as total_consumption,
    ROUND(AVG(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
              COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0)), 2) as avg_per_unit
FROM water_meters
WHERE type LIKE 'Residential%'
GROUP BY residential_type, zone
ORDER BY zone, residential_type;

-- ========== 5. DATA INTEGRITY CHECKS ==========

-- Parent-Child Relationship Validation
SELECT 
    'ORPHAN METERS' as check_type,
    m.zone,
    m.label,
    m.meter_label,
    m.parent_meter,
    CASE 
        WHEN p.meter_label IS NULL AND m.parent_meter NOT IN ('NAMA', 'N/A') 
        THEN 'Parent not found'
        ELSE 'OK'
    END as status
FROM water_meters m
LEFT JOIN water_meters p ON m.parent_meter = p.meter_label
WHERE m.label IN ('L2', 'L3', 'L4', 'DC')
  AND (p.meter_label IS NULL AND m.parent_meter NOT IN ('NAMA', 'N/A'))
ORDER BY m.zone, m.label;

-- Check for Duplicate Account Numbers
SELECT 
    account_number,
    COUNT(*) as duplicate_count,
    STRING_AGG(meter_label, ', ') as meters
FROM water_meters
GROUP BY account_number
HAVING COUNT(*) > 1;

-- Meters with Negative Consumption
SELECT 
    meter_label,
    zone,
    type,
    CASE WHEN jan_25 < 0 THEN 'Jan: ' || jan_25 ELSE '' END ||
    CASE WHEN feb_25 < 0 THEN ' Feb: ' || feb_25 ELSE '' END ||
    CASE WHEN mar_25 < 0 THEN ' Mar: ' || mar_25 ELSE '' END ||
    CASE WHEN apr_25 < 0 THEN ' Apr: ' || apr_25 ELSE '' END ||
    CASE WHEN may_25 < 0 THEN ' May: ' || may_25 ELSE '' END ||
    CASE WHEN jun_25 < 0 THEN ' Jun: ' || jun_25 ELSE '' END ||
    CASE WHEN jul_25 < 0 THEN ' Jul: ' || jul_25 ELSE '' END as negative_months
FROM water_meters
WHERE jan_25 < 0 OR feb_25 < 0 OR mar_25 < 0 OR apr_25 < 0 
   OR may_25 < 0 OR jun_25 < 0 OR jul_25 < 0;

-- ========== 6. HIGH CONSUMPTION ALERTS ==========

-- Top 10 Highest Consumers (6-month total)
SELECT 
    meter_label,
    zone,
    type,
    (COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
     COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0)) as total_consumption
FROM water_meters
WHERE label IN ('L3', 'L4', 'DC')
ORDER BY total_consumption DESC
LIMIT 10;

-- Meters with Sudden Consumption Spikes
WITH monthly_avg AS (
    SELECT 
        meter_label,
        zone,
        type,
        (COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
         COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0)) / 6.0 as avg_consumption,
        GREATEST(jan_25, feb_25, mar_25, apr_25, may_25, jun_25) as max_month
    FROM water_meters
    WHERE label IN ('L3', 'L4')
)
SELECT 
    meter_label,
    zone,
    type,
    ROUND(avg_consumption, 2) as monthly_avg,
    max_month as highest_month,
    ROUND((max_month / NULLIF(avg_consumption, 0)), 2) as spike_ratio
FROM monthly_avg
WHERE max_month > avg_consumption * 2
  AND avg_consumption > 10
ORDER BY spike_ratio DESC;

-- ========== 7. ZONE-SPECIFIC REPORTS ==========

-- Zone_08 Complete Analysis
SELECT 
    'Zone_08 Analysis' as report,
    label,
    type,
    COUNT(*) as meters,
    SUM(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
        COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0)) as total_6month
FROM water_meters
WHERE zone = 'Zone_08'
GROUP BY label, type
ORDER BY label, type;

-- Zone_03 Combined Analysis (A + B)
SELECT 
    CASE 
        WHEN zone = 'Zone_03_(A)' THEN 'Zone 3A'
        WHEN zone = 'Zone_03_(B)' THEN 'Zone 3B'
    END as zone_section,
    label,
    type,
    COUNT(*) as meters,
    SUM(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
        COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0)) as total_6month
FROM water_meters
WHERE zone IN ('Zone_03_(A)', 'Zone_03_(B)')
GROUP BY zone_section, label, type
ORDER BY zone_section, label, type;

-- ========== 8. IRRIGATION SERVICES ANALYSIS ==========

SELECT 
    meter_label,
    zone,
    parent_meter,
    jan_25, feb_25, mar_25, apr_25, may_25, jun_25, jul_25,
    (COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
     COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) + COALESCE(jul_25,0)) as total_7month
FROM water_meters
WHERE type = 'IRR_Services'
ORDER BY zone, meter_label;

-- ========== 9. BUILDING HIERARCHY VALIDATION ==========

-- Verify all L4 apartments have valid L3 building parents
SELECT 
    l4.zone,
    l4.meter_label as apartment,
    l4.parent_meter as building_bulk,
    l3.meter_label as found_parent,
    CASE 
        WHEN l3.meter_label IS NULL THEN 'MISSING PARENT'
        ELSE 'OK'
    END as status
FROM water_meters l4
LEFT JOIN water_meters l3 ON l4.parent_meter = l3.meter_label AND l3.label = 'L3'
WHERE l4.label = 'L4'
ORDER BY l4.zone, status DESC, l4.meter_label;

-- ========== 10. EXECUTIVE SUMMARY ==========

WITH system_summary AS (
    SELECT 
        SUM(CASE WHEN label = 'L1' THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as main_bulk_total,
        SUM(CASE WHEN label = 'L2' THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as zone_bulk_total,
        SUM(CASE WHEN label IN ('L3', 'L4') THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as individual_total,
        SUM(CASE WHEN label = 'DC' THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as direct_total
    FROM water_meters
)
SELECT 
    'EXECUTIVE WATER SUMMARY (6 MONTHS)' as report,
    main_bulk_total as nama_main_bulk,
    zone_bulk_total as all_zone_bulks,
    individual_total as all_individual_meters,
    direct_total as direct_connections,
    (main_bulk_total - zone_bulk_total - direct_total) as l1_to_l2_loss,
    ROUND(((main_bulk_total - zone_bulk_total - direct_total)::numeric / 
           NULLIF(main_bulk_total, 0) * 100), 2) as l1_loss_percentage,
    (zone_bulk_total - individual_total) as l2_to_l3_loss,
    ROUND(((zone_bulk_total - individual_total)::numeric / 
           NULLIF(zone_bulk_total, 0) * 100), 2) as l2_loss_percentage
FROM system_summary;