-- =====================================================
-- STP OPERATIONAL ANALYSIS QUERIES
-- For monitoring plant performance and financial metrics
-- =====================================================

-- 1. EXECUTIVE DASHBOARD - KEY PERFORMANCE INDICATORS
WITH current_month AS (
    SELECT 
        COUNT(*) AS days_operated,
        SUM(tankers_discharged) AS tankers_processed,
        SUM(total_inlet_received) AS total_inlet,
        SUM(total_treated_water) AS total_treated,
        SUM(total_tse_output) AS total_tse,
        ROUND(SUM(income_from_tankers), 1) AS tanker_revenue,
        SUM(saving_from_tse) AS tse_savings,
        SUM(total_saving_income) AS total_savings
    FROM stp_daily_records
    WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
),
previous_month AS (
    SELECT 
        SUM(tankers_discharged) AS tankers_processed,
        SUM(total_inlet_received) AS total_inlet,
        SUM(total_treated_water) AS total_treated,
        SUM(total_tse_output) AS total_tse,
        SUM(total_saving_income) AS total_savings
    FROM stp_daily_records
    WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
)
SELECT 
    'Current Month Performance' AS metric_type,
    cm.days_operated,
    cm.tankers_processed,
    cm.total_inlet AS inlet_m3,
    cm.total_treated AS treated_m3,
    cm.total_tse AS tse_m3,
    ROUND((cm.total_tse::NUMERIC / NULLIF(cm.total_treated, 0)) * 100, 1) AS tse_recovery_rate,
    cm.tanker_revenue AS revenue_omr,
    cm.tse_savings AS tse_savings_omr,
    cm.total_savings AS total_savings_omr,
    CASE 
        WHEN pm.tankers_processed > 0 THEN 
            ROUND(((cm.tankers_processed - pm.tankers_processed)::NUMERIC / pm.tankers_processed) * 100, 1)
        ELSE NULL
    END AS tanker_growth_pct,
    CASE 
        WHEN pm.total_tse > 0 THEN 
            ROUND(((cm.total_tse - pm.total_tse)::NUMERIC / pm.total_tse) * 100, 1)
        ELSE NULL
    END AS tse_growth_pct
FROM current_month cm, previous_month pm;

-- 2. MONTHLY FINANCIAL SUMMARY
SELECT 
    TO_CHAR(date, 'YYYY-MM') AS month,
    TO_CHAR(date, 'Month YYYY') AS month_name,
    COUNT(*) AS operating_days,
    SUM(tankers_discharged) AS total_tankers,
    ROUND(SUM(income_from_tankers), 1) AS tanker_revenue,
    SUM(saving_from_tse) AS tse_savings,
    SUM(total_saving_income) AS total_income,
    ROUND(AVG(total_saving_income), 1) AS avg_daily_income,
    ROUND(SUM(income_from_tankers) / NULLIF(SUM(tankers_discharged), 0), 2) AS revenue_per_tanker
FROM stp_daily_records
WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
GROUP BY TO_CHAR(date, 'YYYY-MM'), TO_CHAR(date, 'Month YYYY')
ORDER BY TO_CHAR(date, 'YYYY-MM') DESC;

-- 3. TREATMENT EFFICIENCY ANALYSIS
SELECT 
    TO_CHAR(date, 'YYYY-MM') AS month,
    COUNT(*) AS days,
    SUM(total_inlet_received) AS total_inlet,
    SUM(total_treated_water) AS total_treated,
    SUM(total_tse_output) AS total_tse,
    ROUND((SUM(total_treated_water)::NUMERIC / NULLIF(SUM(total_inlet_received), 0)) * 100, 1) AS treatment_efficiency,
    ROUND((SUM(total_tse_output)::NUMERIC / NULLIF(SUM(total_treated_water), 0)) * 100, 1) AS tse_recovery_rate,
    ROUND(AVG(total_inlet_received), 0) AS avg_daily_inlet,
    ROUND(AVG(total_treated_water), 0) AS avg_daily_treated,
    ROUND(AVG(total_tse_output), 0) AS avg_daily_tse
FROM stp_daily_records
WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY TO_CHAR(date, 'YYYY-MM');

-- 4. TANKER OPERATIONS ANALYSIS
WITH tanker_stats AS (
    SELECT 
        TO_CHAR(date, 'YYYY-MM') AS month,
        COUNT(*) AS operating_days,
        SUM(tankers_discharged) AS total_tankers,
        SUM(expected_tanker_volume) AS total_volume,
        ROUND(SUM(income_from_tankers), 1) AS total_revenue,
        AVG(tankers_discharged) AS avg_daily_tankers,
        MAX(tankers_discharged) AS max_daily_tankers,
        MIN(tankers_discharged) AS min_daily_tankers
    FROM stp_daily_records
    WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
    GROUP BY TO_CHAR(date, 'YYYY-MM')
)
SELECT 
    month,
    total_tankers,
    total_volume AS volume_m3,
    total_revenue AS revenue_omr,
    ROUND(avg_daily_tankers, 1) AS avg_tankers_per_day,
    max_daily_tankers,
    min_daily_tankers,
    ROUND(total_revenue / NULLIF(total_tankers, 0), 2) AS avg_revenue_per_tanker,
    ROUND(total_volume::NUMERIC / NULLIF(total_tankers, 0), 1) AS avg_volume_per_tanker
FROM tanker_stats
ORDER BY month;

-- 5. INLINE SEWAGE VS TANKER CONTRIBUTION
SELECT 
    TO_CHAR(date, 'YYYY-MM') AS month,
    SUM(expected_tanker_volume) AS tanker_volume,
    SUM(direct_inline_sewage) AS inline_volume,
    SUM(total_inlet_received) AS total_inlet,
    ROUND((SUM(expected_tanker_volume)::NUMERIC / NULLIF(SUM(total_inlet_received), 0)) * 100, 1) AS tanker_percentage,
    ROUND((SUM(direct_inline_sewage)::NUMERIC / NULLIF(SUM(total_inlet_received), 0)) * 100, 1) AS inline_percentage
FROM stp_daily_records
WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY TO_CHAR(date, 'YYYY-MM');

-- 6. DAILY PERFORMANCE METRICS (LAST 30 DAYS)
SELECT 
    date,
    TO_CHAR(date, 'Day') AS day_of_week,
    tankers_discharged,
    total_inlet_received,
    total_treated_water,
    total_tse_output,
    ROUND((total_tse_output::NUMERIC / NULLIF(total_treated_water, 0)) * 100, 1) AS tse_recovery_pct,
    income_from_tankers,
    saving_from_tse,
    total_saving_income
FROM stp_daily_records
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;

-- 7. WEEKLY AVERAGES AND TRENDS
WITH weekly_data AS (
    SELECT 
        DATE_TRUNC('week', date) AS week_start,
        TO_CHAR(DATE_TRUNC('week', date), 'YYYY-MM-DD') AS week_label,
        COUNT(*) AS days,
        AVG(tankers_discharged) AS avg_tankers,
        AVG(total_inlet_received) AS avg_inlet,
        AVG(total_treated_water) AS avg_treated,
        AVG(total_tse_output) AS avg_tse,
        AVG(total_saving_income) AS avg_income
    FROM stp_daily_records
    WHERE date >= CURRENT_DATE - INTERVAL '12 weeks'
    GROUP BY DATE_TRUNC('week', date)
)
SELECT 
    week_label,
    days AS days_operated,
    ROUND(avg_tankers, 1) AS avg_daily_tankers,
    ROUND(avg_inlet, 0) AS avg_daily_inlet,
    ROUND(avg_treated, 0) AS avg_daily_treated,
    ROUND(avg_tse, 0) AS avg_daily_tse,
    ROUND(avg_income, 0) AS avg_daily_income,
    ROUND((avg_tse / NULLIF(avg_treated, 0)) * 100, 1) AS avg_tse_recovery_pct
FROM weekly_data
ORDER BY week_start DESC;

-- 8. CAPACITY UTILIZATION (ASSUMING MAX CAPACITY)
WITH capacity_metrics AS (
    SELECT 
        TO_CHAR(date, 'YYYY-MM') AS month,
        AVG(total_inlet_received) AS avg_daily_inlet,
        MAX(total_inlet_received) AS max_daily_inlet,
        AVG(total_treated_water) AS avg_daily_treated,
        MAX(total_treated_water) AS max_daily_treated,
        -- Assuming max design capacity is 2000 m3/day
        2000 AS design_capacity
    FROM stp_daily_records
    WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
    GROUP BY TO_CHAR(date, 'YYYY-MM')
)
SELECT 
    month,
    ROUND(avg_daily_inlet, 0) AS avg_inlet_m3,
    max_daily_inlet AS peak_inlet_m3,
    ROUND(avg_daily_treated, 0) AS avg_treated_m3,
    max_daily_treated AS peak_treated_m3,
    design_capacity,
    ROUND((avg_daily_treated / design_capacity) * 100, 1) AS avg_capacity_utilization,
    ROUND((max_daily_treated::NUMERIC / design_capacity) * 100, 1) AS peak_capacity_utilization
FROM capacity_metrics
ORDER BY month;

-- 9. CUMULATIVE YEARLY PERFORMANCE
WITH yearly_cumulative AS (
    SELECT 
        DATE_PART('year', date) AS year,
        DATE_PART('month', date) AS month_num,
        TO_CHAR(date, 'Month') AS month_name,
        SUM(tankers_discharged) AS monthly_tankers,
        SUM(total_inlet_received) AS monthly_inlet,
        SUM(total_treated_water) AS monthly_treated,
        SUM(total_tse_output) AS monthly_tse,
        SUM(total_saving_income) AS monthly_income,
        SUM(SUM(tankers_discharged)) OVER (PARTITION BY DATE_PART('year', date) ORDER BY DATE_PART('month', date)) AS cumulative_tankers,
        SUM(SUM(total_treated_water)) OVER (PARTITION BY DATE_PART('year', date) ORDER BY DATE_PART('month', date)) AS cumulative_treated,
        SUM(SUM(total_tse_output)) OVER (PARTITION BY DATE_PART('year', date) ORDER BY DATE_PART('month', date)) AS cumulative_tse,
        SUM(SUM(total_saving_income)) OVER (PARTITION BY DATE_PART('year', date) ORDER BY DATE_PART('month', date)) AS cumulative_income
    FROM stp_daily_records
    WHERE date >= '2024-07-01'
    GROUP BY DATE_PART('year', date), DATE_PART('month', date), TO_CHAR(date, 'Month')
)
SELECT 
    year,
    month_num,
    month_name,
    monthly_tankers,
    monthly_treated,
    monthly_tse,
    monthly_income,
    cumulative_tankers,
    cumulative_treated,
    cumulative_tse,
    cumulative_income
FROM yearly_cumulative
ORDER BY year, month_num;

-- 10. PERFORMANCE BENCHMARKS AND TARGETS
WITH performance_metrics AS (
    SELECT 
        TO_CHAR(date, 'YYYY-MM') AS month,
        AVG(tankers_discharged) AS avg_tankers,
        AVG(total_tse_output) AS avg_tse,
        AVG((total_tse_output::NUMERIC / NULLIF(total_treated_water, 0)) * 100) AS avg_tse_recovery,
        AVG(total_saving_income) AS avg_income
    FROM stp_daily_records
    WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')
    GROUP BY TO_CHAR(date, 'YYYY-MM')
),
benchmarks AS (
    SELECT 
        AVG(avg_tankers) AS benchmark_tankers,
        AVG(avg_tse) AS benchmark_tse,
        AVG(avg_tse_recovery) AS benchmark_recovery,
        AVG(avg_income) AS benchmark_income
    FROM performance_metrics
)
SELECT 
    p.month,
    ROUND(p.avg_tankers, 1) AS avg_daily_tankers,
    ROUND(b.benchmark_tankers, 1) AS benchmark_tankers,
    CASE 
        WHEN p.avg_tankers >= b.benchmark_tankers THEN 'Above Target'
        ELSE 'Below Target'
    END AS tanker_performance,
    ROUND(p.avg_tse_recovery, 1) AS tse_recovery_pct,
    ROUND(b.benchmark_recovery, 1) AS benchmark_recovery_pct,
    CASE 
        WHEN p.avg_tse_recovery >= b.benchmark_recovery THEN 'Above Target'
        ELSE 'Below Target'
    END AS recovery_performance,
    ROUND(p.avg_income, 0) AS avg_daily_income,
    ROUND(b.benchmark_income, 0) AS benchmark_income,
    CASE 
        WHEN p.avg_income >= b.benchmark_income THEN 'Above Target'
        ELSE 'Below Target'
    END AS income_performance
FROM performance_metrics p
CROSS JOIN benchmarks b
ORDER BY p.month DESC;