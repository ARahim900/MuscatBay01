-- =====================================================
-- STP DATABASE VALIDATION QUERIES
-- Identifies missing dates, duplicates, and data issues
-- =====================================================

-- 1. CHECK FOR MISSING DATES IN THE SEQUENCE
WITH date_series AS (
    SELECT generate_series(
        '2024-07-01'::DATE,
        '2025-08-15'::DATE,
        '1 day'::INTERVAL
    )::DATE AS expected_date
)
SELECT 
    ds.expected_date AS missing_date,
    TO_CHAR(ds.expected_date, 'Day') AS day_of_week,
    TO_CHAR(ds.expected_date, 'Month YYYY') AS month_year
FROM date_series ds
LEFT JOIN stp_daily_records sdr ON ds.expected_date = sdr.date
WHERE sdr.date IS NULL
ORDER BY ds.expected_date;

-- 2. CHECK FOR DUPLICATE DATES
SELECT 
    date,
    COUNT(*) as duplicate_count
FROM stp_daily_records
GROUP BY date
HAVING COUNT(*) > 1
ORDER BY date;

-- 3. DATA INTEGRITY CHECKS - IDENTIFY ANOMALIES
SELECT 
    date,
    tankers_discharged,
    expected_tanker_volume,
    direct_inline_sewage,
    total_inlet_received,
    total_treated_water,
    total_tse_output,
    CASE 
        WHEN expected_tanker_volume != tankers_discharged * 20 THEN 'Volume mismatch'
        WHEN total_inlet_received != expected_tanker_volume + direct_inline_sewage THEN 'Inlet calculation error'
        WHEN total_tse_output > total_treated_water THEN 'TSE exceeds treated water'
        WHEN income_from_tankers != tankers_discharged * 4.5 THEN 'Income calculation error'
        ELSE 'OK'
    END as validation_status
FROM stp_daily_records
WHERE date >= '2024-07-01'
    AND (
        expected_tanker_volume != tankers_discharged * 20 OR
        total_inlet_received != expected_tanker_volume + direct_inline_sewage OR
        total_tse_output > total_treated_water OR
        income_from_tankers != tankers_discharged * 4.5
    )
ORDER BY date;

-- 4. MONTHLY SUMMARY STATISTICS
SELECT 
    TO_CHAR(date, 'YYYY-MM') AS month,
    COUNT(*) AS days_recorded,
    DATE_PART('days', 
        DATE_TRUNC('month', date) + '1 month'::INTERVAL - 
        DATE_TRUNC('month', date)
    ) AS days_in_month,
    SUM(tankers_discharged) AS total_tankers,
    SUM(expected_tanker_volume) AS total_tanker_volume,
    SUM(direct_inline_sewage) AS total_inline_sewage,
    SUM(total_inlet_received) AS total_inlet,
    SUM(total_treated_water) AS total_treated,
    SUM(total_tse_output) AS total_tse,
    ROUND(SUM(income_from_tankers), 1) AS total_tanker_income,
    SUM(saving_from_tse) AS total_tse_savings,
    SUM(total_saving_income) AS total_savings
FROM stp_daily_records
WHERE date >= '2024-07-01'
GROUP BY TO_CHAR(date, 'YYYY-MM'), DATE_TRUNC('month', date)
ORDER BY month;

-- 5. DAILY AVERAGES BY MONTH
SELECT 
    TO_CHAR(date, 'YYYY-MM') AS month,
    ROUND(AVG(tankers_discharged), 1) AS avg_tankers_per_day,
    ROUND(AVG(direct_inline_sewage), 0) AS avg_inline_sewage,
    ROUND(AVG(total_inlet_received), 0) AS avg_inlet,
    ROUND(AVG(total_treated_water), 0) AS avg_treated,
    ROUND(AVG(total_tse_output), 0) AS avg_tse_output,
    ROUND(AVG(income_from_tankers), 1) AS avg_daily_income,
    ROUND(AVG(saving_from_tse), 0) AS avg_daily_tse_saving
FROM stp_daily_records
WHERE date >= '2024-07-01'
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month;

-- 6. CHECK DATA COMPLETENESS BY MONTH
WITH monthly_counts AS (
    SELECT 
        TO_CHAR(date, 'YYYY-MM') AS month,
        COUNT(*) AS days_recorded,
        DATE_PART('days', 
            DATE_TRUNC('month', date) + '1 month'::INTERVAL - 
            DATE_TRUNC('month', date)
        ) AS expected_days
    FROM stp_daily_records
    WHERE date >= '2024-07-01'
    GROUP BY TO_CHAR(date, 'YYYY-MM'), DATE_TRUNC('month', date)
)
SELECT 
    month,
    days_recorded,
    expected_days,
    expected_days - days_recorded AS missing_days,
    ROUND((days_recorded::NUMERIC / expected_days * 100), 1) AS completeness_percentage
FROM monthly_counts
ORDER BY month;

-- 7. IDENTIFY OUTLIERS (VALUES FAR FROM AVERAGE)
WITH stats AS (
    SELECT 
        AVG(tankers_discharged) AS avg_tankers,
        STDDEV(tankers_discharged) AS stddev_tankers,
        AVG(total_treated_water) AS avg_treated,
        STDDEV(total_treated_water) AS stddev_treated
    FROM stp_daily_records
    WHERE date >= '2024-07-01'
)
SELECT 
    s.date,
    s.tankers_discharged,
    ROUND(st.avg_tankers, 1) AS avg_tankers,
    s.total_treated_water,
    ROUND(st.avg_treated, 0) AS avg_treated,
    CASE 
        WHEN ABS(s.tankers_discharged - st.avg_tankers) > 2 * st.stddev_tankers THEN 'Tanker outlier'
        WHEN ABS(s.total_treated_water - st.avg_treated) > 2 * st.stddev_treated THEN 'Treatment outlier'
        ELSE 'Normal'
    END AS outlier_status
FROM stp_daily_records s
CROSS JOIN stats st
WHERE s.date >= '2024-07-01'
    AND (
        ABS(s.tankers_discharged - st.avg_tankers) > 2 * st.stddev_tankers OR
        ABS(s.total_treated_water - st.avg_treated) > 2 * st.stddev_treated
    )
ORDER BY s.date;

-- 8. WEEKLY TRENDS
SELECT 
    DATE_TRUNC('week', date) AS week_start,
    COUNT(*) AS days_in_week,
    SUM(tankers_discharged) AS weekly_tankers,
    SUM(total_inlet_received) AS weekly_inlet,
    SUM(total_treated_water) AS weekly_treated,
    SUM(total_tse_output) AS weekly_tse,
    ROUND(SUM(income_from_tankers), 1) AS weekly_income,
    SUM(total_saving_income) AS weekly_total_savings
FROM stp_daily_records
WHERE date >= '2024-07-01'
GROUP BY DATE_TRUNC('week', date)
ORDER BY week_start;

-- 9. EFFICIENCY METRICS
SELECT 
    TO_CHAR(date, 'YYYY-MM') AS month,
    ROUND(AVG((total_tse_output::NUMERIC / NULLIF(total_treated_water, 0)) * 100), 1) AS avg_tse_recovery_rate,
    ROUND(AVG((total_treated_water::NUMERIC / NULLIF(total_inlet_received, 0)) * 100), 1) AS avg_treatment_efficiency,
    MIN(total_tse_output) AS min_daily_tse,
    MAX(total_tse_output) AS max_daily_tse,
    MIN(total_treated_water) AS min_daily_treated,
    MAX(total_treated_water) AS max_daily_treated
FROM stp_daily_records
WHERE date >= '2024-07-01'
    AND total_treated_water > 0
    AND total_inlet_received > 0
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month;

-- 10. YEAR-OVER-YEAR COMPARISON (IF DATA EXISTS FOR MULTIPLE YEARS)
SELECT 
    DATE_PART('month', date) AS month_number,
    TO_CHAR(date, 'Month') AS month_name,
    DATE_PART('year', date) AS year,
    SUM(tankers_discharged) AS total_tankers,
    SUM(total_inlet_received) AS total_inlet,
    SUM(total_treated_water) AS total_treated,
    SUM(total_tse_output) AS total_tse,
    ROUND(SUM(income_from_tankers), 1) AS total_income
FROM stp_daily_records
WHERE date >= '2024-07-01'
GROUP BY DATE_PART('month', date), TO_CHAR(date, 'Month'), DATE_PART('year', date)
ORDER BY year, month_number;