-- =====================================================
-- COMPREHENSIVE WATER LOSS ANALYSIS
-- Detailed loss tracking by zone, type, and time period
-- =====================================================

-- ========== 1. SYSTEM-WIDE LOSS OVERVIEW ==========

-- Main Bulk to Zone Bulk Loss Analysis
WITH system_flow AS (
    SELECT 
        -- L1: Main Bulk from NAMA
        (SELECT SUM(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
                    COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0))
         FROM water_meters WHERE label = 'L1') as main_bulk_total,
        
        -- L2: All Zone Bulks
        (SELECT SUM(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
                    COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0))
         FROM water_meters WHERE label = 'L2') as zone_bulks_total,
        
        -- DC: Direct Connections
        (SELECT SUM(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
                    COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0))
         FROM water_meters WHERE label = 'DC') as direct_connections_total
)
SELECT 
    'SYSTEM-WIDE WATER LOSS (6 MONTHS)' as analysis,
    main_bulk_total as nama_input,
    zone_bulks_total as zone_bulks,
    direct_connections_total as direct_conn,
    (zone_bulks_total + direct_connections_total) as total_distributed,
    (main_bulk_total - zone_bulks_total - direct_connections_total) as system_loss,
    ROUND(((main_bulk_total - zone_bulks_total - direct_connections_total)::numeric / 
           NULLIF(main_bulk_total, 0) * 100), 2) as system_loss_percentage
FROM system_flow;

-- ========== 2. ZONE-BY-ZONE LOSS ANALYSIS ==========

-- Detailed Zone Loss Breakdown
WITH zone_consumption AS (
    SELECT 
        zone,
        -- Zone Bulk (L2)
        SUM(CASE WHEN label = 'L2' THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as bulk_meter_total,
        
        -- Villas (L3 Residential Villa)
        SUM(CASE WHEN label = 'L3' AND type = 'Residential (Villa)' THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as villas_total,
        
        -- Building Bulks (L3 Building)
        SUM(CASE WHEN label = 'L3' AND type = 'D_Building_Bulk' THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as building_bulks_total,
        
        -- Other L3 (Retail, Common, etc)
        SUM(CASE WHEN label = 'L3' AND type NOT IN ('Residential (Villa)', 'D_Building_Bulk') THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as other_l3_total,
        
        -- Apartments (L4)
        SUM(CASE WHEN label = 'L4' THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as apartments_total,
        
        -- All Individual Meters
        SUM(CASE WHEN label IN ('L3', 'L4') THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as all_individual_total
    FROM water_meters
    WHERE zone LIKE 'Zone_%'
    GROUP BY zone
)
SELECT 
    zone,
    bulk_meter_total as zone_bulk_input,
    COALESCE(villas_total, 0) as villas,
    COALESCE(building_bulks_total, 0) as buildings,
    COALESCE(other_l3_total, 0) as other_l3,
    COALESCE(apartments_total, 0) as apartments,
    all_individual_total as total_metered,
    (bulk_meter_total - all_individual_total) as water_loss,
    ROUND(((bulk_meter_total - all_individual_total)::numeric / 
           NULLIF(bulk_meter_total, 0) * 100), 2) as loss_percentage,
    CASE 
        WHEN ((bulk_meter_total - all_individual_total)::numeric / NULLIF(bulk_meter_total, 0) * 100) > 40 
            THEN 'CRITICAL'
        WHEN ((bulk_meter_total - all_individual_total)::numeric / NULLIF(bulk_meter_total, 0) * 100) > 25 
            THEN 'HIGH'
        WHEN ((bulk_meter_total - all_individual_total)::numeric / NULLIF(bulk_meter_total, 0) * 100) > 10 
            THEN 'MODERATE'
        ELSE 'ACCEPTABLE'
    END as loss_severity
FROM zone_consumption
WHERE bulk_meter_total IS NOT NULL
ORDER BY loss_percentage DESC;

-- ========== 3. MONTHLY LOSS TRENDS ==========

-- Monthly Loss Trend Analysis
WITH monthly_data AS (
    SELECT 
        'January' as month, 1 as month_num,
        SUM(CASE WHEN label = 'L1' THEN jan_25 END) as main_bulk,
        SUM(CASE WHEN label = 'L2' THEN jan_25 END) as zone_bulks,
        SUM(CASE WHEN label IN ('L3', 'L4') THEN jan_25 END) as individual,
        SUM(CASE WHEN label = 'DC' THEN jan_25 END) as direct
    FROM water_meters
    UNION ALL
    SELECT 'February', 2,
        SUM(CASE WHEN label = 'L1' THEN feb_25 END),
        SUM(CASE WHEN label = 'L2' THEN feb_25 END),
        SUM(CASE WHEN label IN ('L3', 'L4') THEN feb_25 END),
        SUM(CASE WHEN label = 'DC' THEN feb_25 END)
    FROM water_meters
    UNION ALL
    SELECT 'March', 3,
        SUM(CASE WHEN label = 'L1' THEN mar_25 END),
        SUM(CASE WHEN label = 'L2' THEN mar_25 END),
        SUM(CASE WHEN label IN ('L3', 'L4') THEN mar_25 END),
        SUM(CASE WHEN label = 'DC' THEN mar_25 END)
    FROM water_meters
    UNION ALL
    SELECT 'April', 4,
        SUM(CASE WHEN label = 'L1' THEN apr_25 END),
        SUM(CASE WHEN label = 'L2' THEN apr_25 END),
        SUM(CASE WHEN label IN ('L3', 'L4') THEN apr_25 END),
        SUM(CASE WHEN label = 'DC' THEN apr_25 END)
    FROM water_meters
    UNION ALL
    SELECT 'May', 5,
        SUM(CASE WHEN label = 'L1' THEN may_25 END),
        SUM(CASE WHEN label = 'L2' THEN may_25 END),
        SUM(CASE WHEN label IN ('L3', 'L4') THEN may_25 END),
        SUM(CASE WHEN label = 'DC' THEN may_25 END)
    FROM water_meters
    UNION ALL
    SELECT 'June', 6,
        SUM(CASE WHEN label = 'L1' THEN jun_25 END),
        SUM(CASE WHEN label = 'L2' THEN jun_25 END),
        SUM(CASE WHEN label IN ('L3', 'L4') THEN jun_25 END),
        SUM(CASE WHEN label = 'DC' THEN jun_25 END)
    FROM water_meters
)
SELECT 
    month,
    main_bulk as nama_input,
    zone_bulks + COALESCE(direct, 0) as total_l2_dc,
    individual as total_individual,
    (main_bulk - zone_bulks - COALESCE(direct, 0)) as l1_to_l2_loss,
    ROUND(((main_bulk - zone_bulks - COALESCE(direct, 0))::numeric / 
           NULLIF(main_bulk, 0) * 100), 2) as l1_loss_pct,
    (zone_bulks - individual) as l2_to_l3_loss,
    ROUND(((zone_bulks - individual)::numeric / 
           NULLIF(zone_bulks, 0) * 100), 2) as l2_loss_pct,
    (main_bulk - individual - COALESCE(direct, 0)) as total_system_loss,
    ROUND(((main_bulk - individual - COALESCE(direct, 0))::numeric / 
           NULLIF(main_bulk, 0) * 100), 2) as total_loss_pct
FROM monthly_data
ORDER BY month_num;

-- ========== 4. BUILDING-LEVEL LOSS ANALYSIS ==========

-- Building Bulk to Apartment Loss (L3 to L4)
WITH building_loss AS (
    SELECT 
        b.zone,
        b.meter_label as building_bulk,
        b.type,
        (COALESCE(b.jan_25,0) + COALESCE(b.feb_25,0) + COALESCE(b.mar_25,0) + 
         COALESCE(b.apr_25,0) + COALESCE(b.may_25,0) + COALESCE(b.jun_25,0)) as bulk_total,
        COALESCE(SUM(
            COALESCE(a.jan_25,0) + COALESCE(a.feb_25,0) + COALESCE(a.mar_25,0) + 
            COALESCE(a.apr_25,0) + COALESCE(a.may_25,0) + COALESCE(a.jun_25,0)
        ), 0) as apartments_total,
        COUNT(a.meter_label) as apartment_count
    FROM water_meters b
    LEFT JOIN water_meters a ON a.parent_meter = b.meter_label AND a.label = 'L4'
    WHERE b.label = 'L3' AND b.type = 'D_Building_Bulk'
    GROUP BY b.zone, b.meter_label, b.type, b.jan_25, b.feb_25, b.mar_25, b.apr_25, b.may_25, b.jun_25
)
SELECT 
    zone,
    building_bulk,
    apartment_count,
    bulk_total as building_consumption,
    apartments_total as apartments_consumption,
    (bulk_total - apartments_total) as building_loss,
    CASE 
        WHEN bulk_total > 0 THEN 
            ROUND(((bulk_total - apartments_total)::numeric / bulk_total * 100), 2)
        ELSE 0
    END as loss_percentage,
    CASE 
        WHEN bulk_total > 0 AND ((bulk_total - apartments_total)::numeric / bulk_total * 100) > 30 
            THEN 'HIGH LOSS'
        WHEN bulk_total > 0 AND ((bulk_total - apartments_total)::numeric / bulk_total * 100) > 15 
            THEN 'MODERATE LOSS'
        WHEN apartments_total > bulk_total 
            THEN 'DATA ERROR'
        ELSE 'ACCEPTABLE'
    END as status
FROM building_loss
ORDER BY zone, building_bulk;

-- ========== 5. TYPE CATEGORY LOSS ANALYSIS ==========

-- Loss Analysis by Type Category
WITH type_analysis AS (
    SELECT 
        type,
        label,
        COUNT(*) as meter_count,
        SUM(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0)) as total_consumption,
        AVG(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0)) as avg_consumption
    FROM water_meters
    WHERE label IN ('L3', 'L4')
    GROUP BY type, label
)
SELECT 
    type,
    label,
    meter_count,
    total_consumption,
    ROUND(avg_consumption, 2) as avg_per_meter,
    RANK() OVER (ORDER BY total_consumption DESC) as consumption_rank
FROM type_analysis
ORDER BY total_consumption DESC;

-- ========== 6. ZONE COMPARISON ANALYSIS ==========

-- Zone Performance Comparison
WITH zone_performance AS (
    SELECT 
        zone,
        COUNT(CASE WHEN label = 'L3' AND type = 'Residential (Villa)' THEN 1 END) as villa_count,
        COUNT(CASE WHEN label = 'L4' THEN 1 END) as apartment_count,
        SUM(CASE WHEN label = 'L2' THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as bulk_consumption,
        SUM(CASE WHEN label IN ('L3', 'L4') THEN 
            COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0) 
        END) as metered_consumption
    FROM water_meters
    WHERE zone LIKE 'Zone_%'
    GROUP BY zone
)
SELECT 
    zone,
    villa_count,
    apartment_count,
    bulk_consumption,
    metered_consumption,
    (bulk_consumption - metered_consumption) as water_loss,
    ROUND(((bulk_consumption - metered_consumption)::numeric / 
           NULLIF(bulk_consumption, 0) * 100), 2) as loss_pct,
    CASE 
        WHEN villa_count > 0 THEN 
            ROUND(bulk_consumption::numeric / villa_count, 2)
        ELSE NULL
    END as avg_per_villa,
    RANK() OVER (ORDER BY ((bulk_consumption - metered_consumption)::numeric / 
                          NULLIF(bulk_consumption, 0)) DESC) as loss_rank
FROM zone_performance
WHERE bulk_consumption IS NOT NULL
ORDER BY loss_pct DESC;

-- ========== 7. SPECIAL CASES & ANOMALIES ==========

-- High Loss Meters (Individual meters with unusually high consumption)
WITH meter_stats AS (
    SELECT 
        zone,
        type,
        AVG(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
            COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0)) as avg_consumption,
        STDDEV(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
               COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0)) as std_consumption
    FROM water_meters
    WHERE label IN ('L3', 'L4')
      AND type LIKE 'Residential%'
    GROUP BY zone, type
)
SELECT 
    m.meter_label,
    m.zone,
    m.type,
    (COALESCE(m.jan_25,0) + COALESCE(m.feb_25,0) + COALESCE(m.mar_25,0) + 
     COALESCE(m.apr_25,0) + COALESCE(m.may_25,0) + COALESCE(m.jun_25,0)) as total_consumption,
    ROUND(s.avg_consumption, 2) as zone_avg,
    CASE 
        WHEN s.avg_consumption > 0 THEN
            ROUND(((COALESCE(m.jan_25,0) + COALESCE(m.feb_25,0) + COALESCE(m.mar_25,0) + 
                    COALESCE(m.apr_25,0) + COALESCE(m.may_25,0) + COALESCE(m.jun_25,0)) - 
                   s.avg_consumption) / NULLIF(s.std_consumption, 0), 2)
        ELSE NULL
    END as std_deviations_above,
    CASE 
        WHEN (COALESCE(m.jan_25,0) + COALESCE(m.feb_25,0) + COALESCE(m.mar_25,0) + 
              COALESCE(m.apr_25,0) + COALESCE(m.may_25,0) + COALESCE(m.jun_25,0)) > 
             s.avg_consumption + (2 * COALESCE(s.std_consumption, 0))
            THEN 'POTENTIAL LEAK'
        ELSE 'NORMAL'
    END as status
FROM water_meters m
JOIN meter_stats s ON m.zone = s.zone AND m.type = s.type
WHERE m.label IN ('L3', 'L4')
  AND m.type LIKE 'Residential%'
  AND (COALESCE(m.jan_25,0) + COALESCE(m.feb_25,0) + COALESCE(m.mar_25,0) + 
       COALESCE(m.apr_25,0) + COALESCE(m.may_25,0) + COALESCE(m.jun_25,0)) > 
      s.avg_consumption + (2 * COALESCE(s.std_consumption, 0))
ORDER BY std_deviations_above DESC NULLS LAST;

-- ========== 8. LOSS SUMMARY REPORT ==========

-- Executive Loss Summary
WITH loss_summary AS (
    SELECT 
        -- System Level
        (SELECT SUM(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
                    COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0))
         FROM water_meters WHERE label = 'L1') as main_bulk,
        
        (SELECT SUM(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
                    COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0))
         FROM water_meters WHERE label = 'L2') as zone_bulks,
        
        (SELECT SUM(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
                    COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0))
         FROM water_meters WHERE label = 'DC') as direct_conn,
        
        (SELECT SUM(COALESCE(jan_25,0) + COALESCE(feb_25,0) + COALESCE(mar_25,0) + 
                    COALESCE(apr_25,0) + COALESCE(may_25,0) + COALESCE(jun_25,0))
         FROM water_meters WHERE label IN ('L3', 'L4')) as individual_meters
)
SELECT 
    'WATER LOSS EXECUTIVE SUMMARY (6 MONTHS)' as report,
    main_bulk as total_input_nama,
    zone_bulks as total_zone_bulks,
    direct_conn as total_direct_connections,
    individual_meters as total_individual_meters,
    (main_bulk - zone_bulks - direct_conn) as l1_distribution_loss,
    ROUND(((main_bulk - zone_bulks - direct_conn)::numeric / 
           NULLIF(main_bulk, 0) * 100), 2) as l1_loss_pct,
    (zone_bulks - individual_meters) as l2_distribution_loss,
    ROUND(((zone_bulks - individual_meters)::numeric / 
           NULLIF(zone_bulks, 0) * 100), 2) as l2_loss_pct,
    (main_bulk - individual_meters - direct_conn) as total_system_loss,
    ROUND(((main_bulk - individual_meters - direct_conn)::numeric / 
           NULLIF(main_bulk, 0) * 100), 2) as total_loss_pct,
    CASE 
        WHEN ((main_bulk - individual_meters - direct_conn)::numeric / 
              NULLIF(main_bulk, 0) * 100) > 30
            THEN 'CRITICAL: System loss exceeds 30%'
        WHEN ((main_bulk - individual_meters - direct_conn)::numeric / 
              NULLIF(main_bulk, 0) * 100) > 20
            THEN 'HIGH: System loss between 20-30%'
        WHEN ((main_bulk - individual_meters - direct_conn)::numeric / 
              NULLIF(main_bulk, 0) * 100) > 10
            THEN 'MODERATE: System loss between 10-20%'
        ELSE 'ACCEPTABLE: System loss under 10%'
    END as loss_assessment
FROM loss_summary;