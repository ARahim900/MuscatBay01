-- =====================================================
-- DAILY WATER CONSUMPTION ANALYSIS QUERIES
-- Comprehensive Analytics for Muscat Bay Water Management
-- =====================================================

-- =====================================================
-- 1. SYSTEM OVERVIEW QUERIES
-- =====================================================

-- Total system consumption overview
SELECT 
    'System Overview - July 2025' as report_title,
    COUNT(*) as total_meters,
    COUNT(CASE WHEN meter_status = 'Active' THEN 1 END) as active_meters,
    COUNT(CASE WHEN meter_status = 'Inactive' THEN 1 END) as inactive_meters,
    ROUND(SUM(total_monthly_consumption), 2) as total_system_consumption_m3,
    ROUND(AVG(total_monthly_consumption), 2) as average_per_meter_m3,
    ROUND(SUM(total_monthly_consumption) * 1000, 0) as total_system_consumption_liters
FROM daily_water_consumption 
WHERE reading_month = 72025;

-- Daily system totals for the entire month
SELECT 
    'Daily System Totals' as analysis_type,
    day_number,
    total_daily_consumption,
    running_total,
    percentage_of_month
FROM (
    SELECT 
        'Day 01' as day_number, ROUND(SUM(day_01), 2) as total_daily_consumption,
        ROUND(SUM(day_01), 2) as running_total,
        ROUND(SUM(day_01) * 100.0 / SUM(total_monthly_consumption), 2) as percentage_of_month
    FROM daily_water_consumption WHERE meter_status = 'Active'
    
    UNION ALL
    
    SELECT 'Day 15', ROUND(SUM(day_15), 2), 
           ROUND(SUM(day_01+day_02+day_03+day_04+day_05+day_06+day_07+day_08+day_09+day_10+day_11+day_12+day_13+day_14+day_15), 2),
           ROUND(SUM(day_15) * 100.0 / SUM(total_monthly_consumption), 2)
    FROM daily_water_consumption WHERE meter_status = 'Active'
    
    UNION ALL
    
    SELECT 'Day 31', ROUND(SUM(day_31), 2),
           ROUND(SUM(total_monthly_consumption), 2),
           ROUND(SUM(day_31) * 100.0 / SUM(total_monthly_consumption), 2)
    FROM daily_water_consumption WHERE meter_status = 'Active'
) daily_stats
ORDER BY day_number;

-- =====================================================
-- 2. ZONE-BASED ANALYSIS
-- =====================================================

-- Comprehensive zone analysis
SELECT 
    'Zone Performance Analysis' as report_section,
    zone_classification,
    building_type,
    COUNT(*) as meter_count,
    ROUND(SUM(total_monthly_consumption), 2) as zone_total_m3,
    ROUND(AVG(total_monthly_consumption), 2) as zone_average_m3,
    ROUND(MIN(total_monthly_consumption), 2) as zone_minimum_m3,
    ROUND(MAX(total_monthly_consumption), 2) as zone_maximum_m3,
    ROUND(STDDEV(total_monthly_consumption), 2) as consumption_std_dev,
    ROUND(SUM(total_monthly_consumption) * 100.0 / 
          (SELECT SUM(total_monthly_consumption) FROM daily_water_consumption WHERE meter_status = 'Active'), 2) as percentage_of_total
FROM daily_water_consumption 
WHERE meter_status = 'Active' AND reading_month = 72025
GROUP BY zone_classification, building_type
ORDER BY zone_total_m3 DESC;

-- Zone efficiency analysis (consumption per meter)
SELECT 
    'Zone Efficiency Ranking' as analysis_type,
    zone_classification,
    COUNT(*) as total_meters,
    ROUND(SUM(total_monthly_consumption), 2) as total_consumption,
    ROUND(AVG(total_monthly_consumption), 2) as avg_per_meter,
    CASE 
        WHEN AVG(total_monthly_consumption) > 100 THEN 'High Consumption Zone'
        WHEN AVG(total_monthly_consumption) > 50 THEN 'Medium Consumption Zone'
        ELSE 'Low Consumption Zone'
    END as efficiency_category,
    RANK() OVER (ORDER BY AVG(total_monthly_consumption) DESC) as consumption_rank
FROM daily_water_consumption 
WHERE meter_status = 'Active' AND reading_month = 72025
GROUP BY zone_classification
ORDER BY avg_per_meter DESC;

-- =====================================================
-- 3. BUILDING TYPE ANALYSIS
-- =====================================================

-- Building type consumption patterns
SELECT 
    'Building Type Analysis' as report_section,
    building_type,
    COUNT(*) as count,
    ROUND(MIN(total_monthly_consumption), 2) as min_consumption,
    ROUND(MAX(total_monthly_consumption), 2) as max_consumption,
    ROUND(AVG(total_monthly_consumption), 2) as avg_consumption,
    ROUND(STDDEV(total_monthly_consumption), 2) as std_deviation,
    ROUND(SUM(total_monthly_consumption), 2) as total_consumption,
    CASE 
        WHEN building_type = 'Residential_Villa' THEN 'Household'
        WHEN building_type LIKE '%Commercial%' OR building_type = 'Hotel' THEN 'Business'
        WHEN building_type LIKE '%Bulk%' THEN 'Distribution'
        ELSE 'Infrastructure'
    END as category
FROM daily_water_consumption 
WHERE meter_status = 'Active' AND reading_month = 72025
GROUP BY building_type
ORDER BY total_consumption DESC;

-- =====================================================
-- 4. HIGH CONSUMERS IDENTIFICATION
-- =====================================================

-- Top 50 consumers across all categories
SELECT 
    'Top 50 Consumers - July 2025' as report_title,
    ROW_NUMBER() OVER (ORDER BY total_monthly_consumption DESC) as rank,
    account_number,
    customer_name,
    address,
    zone_classification,
    building_type,
    ROUND(total_monthly_consumption, 2) as monthly_total_m3,
    ROUND(average_daily_consumption, 2) as daily_average_m3,
    ROUND(total_monthly_consumption * 1000, 0) as monthly_total_liters,
    CASE 
        WHEN total_monthly_consumption > 500 THEN 'Extremely High'
        WHEN total_monthly_consumption > 100 THEN 'High'
        WHEN total_monthly_consumption > 50 THEN 'Above Average'
        ELSE 'Normal'
    END as consumption_category
FROM daily_water_consumption 
WHERE meter_status = 'Active' AND reading_month = 72025
ORDER BY total_monthly_consumption DESC
LIMIT 50;

-- High consuming residential villas specifically
SELECT 
    'High Consuming Residential Villas' as focus_area,
    account_number,
    customer_name,
    address,
    ROUND(total_monthly_consumption, 2) as monthly_m3,
    ROUND(average_daily_consumption, 2) as daily_avg_m3,
    ROUND(total_monthly_consumption / (SELECT AVG(total_monthly_consumption) 
                                       FROM daily_water_consumption 
                                       WHERE building_type = 'Residential_Villa' AND meter_status = 'Active'), 2) as times_above_villa_average
FROM daily_water_consumption 
WHERE building_type = 'Residential_Villa' 
  AND meter_status = 'Active' 
  AND reading_month = 72025
  AND total_monthly_consumption > 50  -- Threshold for high consuming villas
ORDER BY total_monthly_consumption DESC;

-- =====================================================
-- 5. CONSUMPTION PATTERN ANALYSIS
-- =====================================================

-- Weekend vs Weekday consumption patterns
SELECT 
    'Weekend vs Weekday Consumption Analysis' as pattern_analysis,
    building_type,
    COUNT(*) as meter_count,
    -- Weekend days (Saturdays and Sundays in July 2025: 5,6,12,13,19,20,26,27)
    ROUND(AVG((day_05 + day_06 + day_12 + day_13 + day_19 + day_20 + day_26 + day_27) / 8.0), 2) as avg_weekend_consumption,
    -- Weekday average (remaining 23 days)
    ROUND(AVG((day_01 + day_02 + day_03 + day_04 + day_07 + day_08 + day_09 + day_10 + day_11 + 
               day_14 + day_15 + day_16 + day_17 + day_18 + day_21 + day_22 + day_23 + day_24 + 
               day_25 + day_28 + day_29 + day_30 + day_31) / 23.0), 2) as avg_weekday_consumption,
    ROUND(AVG((day_05 + day_06 + day_12 + day_13 + day_19 + day_20 + day_26 + day_27) / 8.0) - 
          AVG((day_01 + day_02 + day_03 + day_04 + day_07 + day_08 + day_09 + day_10 + day_11 + 
               day_14 + day_15 + day_16 + day_17 + day_18 + day_21 + day_22 + day_23 + day_24 + 
               day_25 + day_28 + day_29 + day_30 + day_31) / 23.0), 2) as weekend_weekday_diff
FROM daily_water_consumption 
WHERE meter_status = 'Active' AND reading_month = 72025
GROUP BY building_type
ORDER BY weekend_weekday_diff DESC;

-- Peak consumption analysis
SELECT 
    'Peak Consumption Analysis' as analysis_type,
    account_number,
    customer_name,
    building_type,
    zone_classification,
    ROUND(average_daily_consumption, 2) as daily_average,
    ROUND(GREATEST(day_01,day_02,day_03,day_04,day_05,day_06,day_07,day_08,day_09,day_10,
                   day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
                   day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31), 2) as peak_daily_consumption,
    ROUND(LEAST(day_01,day_02,day_03,day_04,day_05,day_06,day_07,day_08,day_09,day_10,
                day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
                day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31), 2) as minimum_daily_consumption,
    ROUND(GREATEST(day_01,day_02,day_03,day_04,day_05,day_06,day_07,day_08,day_09,day_10,
                   day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
                   day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31) / 
          NULLIF(average_daily_consumption, 0), 2) as peak_to_average_ratio
FROM daily_water_consumption 
WHERE meter_status = 'Active' AND reading_month = 72025 AND average_daily_consumption > 0
ORDER BY peak_to_average_ratio DESC
LIMIT 30;

-- =====================================================
-- 6. ANOMALY DETECTION
-- =====================================================

-- Comprehensive anomaly detection
SELECT 
    'Water Consumption Anomalies - July 2025' as alert_type,
    account_number,
    customer_name,
    address,
    zone_classification,
    building_type,
    ROUND(total_monthly_consumption, 2) as monthly_total,
    ROUND(average_daily_consumption, 2) as daily_average,
    CASE 
        WHEN average_daily_consumption = 0 THEN 'CRITICAL: No Consumption Detected'
        WHEN average_daily_consumption > 200 THEN 'CRITICAL: Extremely High Consumption'
        WHEN building_type = 'Residential_Villa' AND average_daily_consumption > 15 THEN 'HIGH: Villa Excessive Usage'
        WHEN building_type LIKE '%Commercial%' AND average_daily_consumption > 50 THEN 'MEDIUM: Commercial High Usage'
        WHEN (GREATEST(day_01,day_02,day_03,day_04,day_05,day_06,day_07,day_08,day_09,day_10,
                      day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
                      day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31) / 
              NULLIF(average_daily_consumption, 0)) > 5 THEN 'MEDIUM: Consumption Spike Detected'
        ELSE 'LOW: Minor Pattern Variation'
    END as anomaly_severity,
    ROUND(GREATEST(day_01,day_02,day_03,day_04,day_05,day_06,day_07,day_08,day_09,day_10,
                   day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
                   day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31), 2) as peak_daily_usage,
    meter_status
FROM daily_water_consumption 
WHERE reading_month = 72025
  AND (average_daily_consumption = 0 
       OR average_daily_consumption > 100 
       OR (building_type = 'Residential_Villa' AND average_daily_consumption > 15)
       OR (GREATEST(day_01,day_02,day_03,day_04,day_05,day_06,day_07,day_08,day_09,day_10,
                    day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
                    day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31) / 
           NULLIF(average_daily_consumption, 0)) > 5)
ORDER BY 
    CASE 
        WHEN average_daily_consumption = 0 THEN 1
        WHEN average_daily_consumption > 200 THEN 2
        WHEN building_type = 'Residential_Villa' AND average_daily_consumption > 15 THEN 3
        ELSE 4
    END,
    average_daily_consumption DESC;

-- Potential leak detection (continuous high usage)
SELECT 
    'Potential Leak Detection' as alert_category,
    account_number,
    customer_name,
    address,
    building_type,
    ROUND(average_daily_consumption, 2) as daily_avg,
    -- Count consecutive days with high consumption (above 2x average for building type)
    (SELECT COUNT(*) FROM (
        VALUES (day_01),(day_02),(day_03),(day_04),(day_05),(day_06),(day_07),(day_08),(day_09),(day_10),
               (day_11),(day_12),(day_13),(day_14),(day_15),(day_16),(day_17),(day_18),(day_19),(day_20),
               (day_21),(day_22),(day_23),(day_24),(day_25),(day_26),(day_27),(day_28),(day_29),(day_30),(day_31)
    ) AS daily_values(consumption)
    WHERE daily_values.consumption > (average_daily_consumption * 1.5)
    ) as high_consumption_days,
    CASE 
        WHEN average_daily_consumption > 10 THEN 'HIGH PRIORITY'
        WHEN average_daily_consumption > 5 THEN 'MEDIUM PRIORITY'
        ELSE 'LOW PRIORITY'
    END as investigation_priority
FROM daily_water_consumption 
WHERE meter_status = 'Active' 
  AND reading_month = 72025
  AND average_daily_consumption > 2  -- Only meters with significant usage
  AND building_type IN ('Residential_Villa', 'Commercial', 'Building')
ORDER BY high_consumption_days DESC, average_daily_consumption DESC
LIMIT 25;

-- =====================================================
-- 7. BILLING AND COST ANALYSIS
-- =====================================================

-- Estimated billing analysis with tiered rates
SELECT 
    'Estimated Billing Analysis - July 2025' as billing_report,
    zone_classification,
    building_type,
    COUNT(*) as meter_count,
    ROUND(SUM(total_monthly_consumption), 2) as total_zone_consumption_m3,
    ROUND(SUM(
        CASE 
            WHEN total_monthly_consumption <= 10 THEN total_monthly_consumption * 0.150
            WHEN total_monthly_consumption <= 25 THEN (10 * 0.150) + ((total_monthly_consumption - 10) * 0.200)
            ELSE (10 * 0.150) + (15 * 0.200) + ((total_monthly_consumption - 25) * 0.300)
        END
    ), 2) as estimated_zone_billing_omr,
    ROUND(AVG(
        CASE 
            WHEN total_monthly_consumption <= 10 THEN total_monthly_consumption * 0.150
            WHEN total_monthly_consumption <= 25 THEN (10 * 0.150) + ((total_monthly_consumption - 10) * 0.200)
            ELSE (10 * 0.150) + (15 * 0.200) + ((total_monthly_consumption - 25) * 0.300)
        END
    ), 2) as avg_bill_per_meter_omr
FROM daily_water_consumption 
WHERE meter_status = 'Active' AND reading_month = 72025
GROUP BY zone_classification, building_type
ORDER BY estimated_zone_billing_omr DESC;

-- High billing accounts
SELECT 
    'High Value Billing Accounts' as billing_category,
    account_number,
    customer_name,
    address,
    building_type,
    ROUND(total_monthly_consumption, 2) as consumption_m3,
    ROUND(CASE 
        WHEN total_monthly_consumption <= 10 THEN total_monthly_consumption * 0.150
        WHEN total_monthly_consumption <= 25 THEN (10 * 0.150) + ((total_monthly_consumption - 10) * 0.200)
        ELSE (10 * 0.150) + (15 * 0.200) + ((total_monthly_consumption - 25) * 0.300)
    END, 2) as estimated_bill_omr,
    CASE 
        WHEN total_monthly_consumption <= 10 THEN 'Tier 1 (0.150 OMR/m³)'
        WHEN total_monthly_consumption <= 25 THEN 'Tier 2 (0.200 OMR/m³ above 10m³)'
        ELSE 'Tier 3 (0.300 OMR/m³ above 25m³)'
    END as billing_tier
FROM daily_water_consumption 
WHERE meter_status = 'Active' AND reading_month = 72025
ORDER BY estimated_bill_omr DESC
LIMIT 30;

-- =====================================================
-- 8. OPERATIONAL REPORTS
-- =====================================================

-- Daily operational summary
SELECT 
    'Daily Operations Summary' as report_type,
    'System Status' as metric,
    COUNT(*) as total_meters,
    COUNT(CASE WHEN meter_status = 'Active' THEN 1 END) as active_meters,
    COUNT(CASE WHEN meter_status = 'Inactive' THEN 1 END) as inactive_meters,
    COUNT(CASE WHEN total_monthly_consumption = 0 THEN 1 END) as zero_consumption_meters,
    ROUND((COUNT(CASE WHEN meter_status = 'Active' THEN 1 END) * 100.0 / COUNT(*)), 2) as active_percentage
FROM daily_water_consumption 
WHERE reading_month = 72025;

-- System reliability indicators
SELECT 
    'System Reliability Indicators' as report_section,
    meter_status,
    zone_classification,
    COUNT(*) as meter_count,
    ROUND(AVG(total_monthly_consumption), 2) as avg_consumption,
    COUNT(CASE WHEN total_monthly_consumption = 0 THEN 1 END) as non_consuming_meters
FROM daily_water_consumption 
WHERE reading_month = 72025
GROUP BY meter_status, zone_classification
ORDER BY zone_classification, meter_status;

-- =====================================================
-- SUMMARY STATISTICS
-- =====================================================

SELECT 
    '=== MUSCAT BAY WATER CONSUMPTION SUMMARY - JULY 2025 ===' as final_summary,
    '' as separator,
    'Total Meters: ' || COUNT(*) as total_meters,
    'Active Meters: ' || COUNT(CASE WHEN meter_status = 'Active' THEN 1 END) as active_meters,
    'Total Consumption: ' || ROUND(SUM(total_monthly_consumption), 2) || ' m³' as total_consumption,
    'Average per Active Meter: ' || ROUND(SUM(total_monthly_consumption) / COUNT(CASE WHEN meter_status = 'Active' THEN 1 END), 2) || ' m³' as avg_per_active_meter,
    'Estimated Total Billing: ' || ROUND(SUM(
        CASE 
            WHEN total_monthly_consumption <= 10 THEN total_monthly_consumption * 0.150
            WHEN total_monthly_consumption <= 25 THEN (10 * 0.150) + ((total_monthly_consumption - 10) * 0.200)
            ELSE (10 * 0.150) + (15 * 0.200) + ((total_monthly_consumption - 25) * 0.300)
        END
    ), 2) || ' OMR' as estimated_total_billing,
    'Peak Single Day System Consumption: ' || ROUND((
        SELECT MAX(daily_total) FROM (
            SELECT SUM(day_01) as daily_total FROM daily_water_consumption WHERE meter_status = 'Active'
            UNION SELECT SUM(day_15) FROM daily_water_consumption WHERE meter_status = 'Active'
            UNION SELECT SUM(day_31) FROM daily_water_consumption WHERE meter_status = 'Active'
        ) peak_days
    ), 2) || ' m³' as peak_system_day
FROM daily_water_consumption 
WHERE reading_month = 72025;