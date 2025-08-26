-- =====================================================
-- COMPREHENSIVE DAILY WATER CONSUMPTION DATABASE SCHEMA
-- For Muscat Bay Water Management System
-- Supabase Implementation
-- =====================================================

-- Drop existing table if exists
DROP TABLE IF EXISTS daily_water_consumption CASCADE;

-- Create the comprehensive daily water consumption table
CREATE TABLE daily_water_consumption (
    -- Primary identification fields
    account_number VARCHAR(10) PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    address VARCHAR(150) NOT NULL, -- Zone/Location information
    meter_type VARCHAR(30) DEFAULT 'Standard',
    meter_size VARCHAR(10) DEFAULT '20mm',
    reading_month INTEGER NOT NULL DEFAULT 72025, -- 72025 = July 2025
    
    -- Daily consumption columns (1-31) - in cubic meters (m³)
    day_01 DECIMAL(10,3) DEFAULT 0,
    day_02 DECIMAL(10,3) DEFAULT 0,
    day_03 DECIMAL(10,3) DEFAULT 0,
    day_04 DECIMAL(10,3) DEFAULT 0,
    day_05 DECIMAL(10,3) DEFAULT 0,
    day_06 DECIMAL(10,3) DEFAULT 0,
    day_07 DECIMAL(10,3) DEFAULT 0,
    day_08 DECIMAL(10,3) DEFAULT 0,
    day_09 DECIMAL(10,3) DEFAULT 0,
    day_10 DECIMAL(10,3) DEFAULT 0,
    day_11 DECIMAL(10,3) DEFAULT 0,
    day_12 DECIMAL(10,3) DEFAULT 0,
    day_13 DECIMAL(10,3) DEFAULT 0,
    day_14 DECIMAL(10,3) DEFAULT 0,
    day_15 DECIMAL(10,3) DEFAULT 0,
    day_16 DECIMAL(10,3) DEFAULT 0,
    day_17 DECIMAL(10,3) DEFAULT 0,
    day_18 DECIMAL(10,3) DEFAULT 0,
    day_19 DECIMAL(10,3) DEFAULT 0,
    day_20 DECIMAL(10,3) DEFAULT 0,
    day_21 DECIMAL(10,3) DEFAULT 0,
    day_22 DECIMAL(10,3) DEFAULT 0,
    day_23 DECIMAL(10,3) DEFAULT 0,
    day_24 DECIMAL(10,3) DEFAULT 0,
    day_25 DECIMAL(10,3) DEFAULT 0,
    day_26 DECIMAL(10,3) DEFAULT 0,
    day_27 DECIMAL(10,3) DEFAULT 0,
    day_28 DECIMAL(10,3) DEFAULT 0,
    day_29 DECIMAL(10,3) DEFAULT 0,
    day_30 DECIMAL(10,3) DEFAULT 0,
    day_31 DECIMAL(10,3) DEFAULT 0,
    
    -- Computed and aggregated columns
    total_monthly_consumption DECIMAL(12,3) GENERATED ALWAYS AS (
        COALESCE(day_01,0) + COALESCE(day_02,0) + COALESCE(day_03,0) + COALESCE(day_04,0) + 
        COALESCE(day_05,0) + COALESCE(day_06,0) + COALESCE(day_07,0) + COALESCE(day_08,0) + 
        COALESCE(day_09,0) + COALESCE(day_10,0) + COALESCE(day_11,0) + COALESCE(day_12,0) + 
        COALESCE(day_13,0) + COALESCE(day_14,0) + COALESCE(day_15,0) + COALESCE(day_16,0) + 
        COALESCE(day_17,0) + COALESCE(day_18,0) + COALESCE(day_19,0) + COALESCE(day_20,0) + 
        COALESCE(day_21,0) + COALESCE(day_22,0) + COALESCE(day_23,0) + COALESCE(day_24,0) + 
        COALESCE(day_25,0) + COALESCE(day_26,0) + COALESCE(day_27,0) + COALESCE(day_28,0) + 
        COALESCE(day_29,0) + COALESCE(day_30,0) + COALESCE(day_31,0)
    ) STORED,
    
    average_daily_consumption DECIMAL(10,3) GENERATED ALWAYS AS (
        (COALESCE(day_01,0) + COALESCE(day_02,0) + COALESCE(day_03,0) + COALESCE(day_04,0) + 
         COALESCE(day_05,0) + COALESCE(day_06,0) + COALESCE(day_07,0) + COALESCE(day_08,0) + 
         COALESCE(day_09,0) + COALESCE(day_10,0) + COALESCE(day_11,0) + COALESCE(day_12,0) + 
         COALESCE(day_13,0) + COALESCE(day_14,0) + COALESCE(day_15,0) + COALESCE(day_16,0) + 
         COALESCE(day_17,0) + COALESCE(day_18,0) + COALESCE(day_19,0) + COALESCE(day_20,0) + 
         COALESCE(day_21,0) + COALESCE(day_22,0) + COALESCE(day_23,0) + COALESCE(day_24,0) + 
         COALESCE(day_25,0) + COALESCE(day_26,0) + COALESCE(day_27,0) + COALESCE(day_28,0) + 
         COALESCE(day_29,0) + COALESCE(day_30,0) + COALESCE(day_31,0)) / 31.0
    ) STORED,
    
    -- Metadata fields
    zone_classification VARCHAR(50),
    building_type VARCHAR(50),
    occupancy_status VARCHAR(20) DEFAULT 'Occupied',
    meter_status VARCHAR(20) DEFAULT 'Active',
    
    -- Audit fields
    data_source VARCHAR(50) DEFAULT 'Manual Reading',
    last_reading_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create performance indexes
CREATE INDEX idx_daily_consumption_account ON daily_water_consumption(account_number);
CREATE INDEX idx_daily_consumption_address ON daily_water_consumption(address);
CREATE INDEX idx_daily_consumption_zone ON daily_water_consumption(zone_classification);
CREATE INDEX idx_daily_consumption_month ON daily_water_consumption(reading_month);
CREATE INDEX idx_daily_consumption_total ON daily_water_consumption(total_monthly_consumption);
CREATE INDEX idx_daily_consumption_status ON daily_water_consumption(meter_status);
CREATE INDEX idx_daily_consumption_type ON daily_water_consumption(building_type);

-- Create composite indexes for complex queries
CREATE INDEX idx_daily_consumption_zone_month ON daily_water_consumption(zone_classification, reading_month);
CREATE INDEX idx_daily_consumption_type_status ON daily_water_consumption(building_type, meter_status);

-- =====================================================
-- SAMPLE DATA INSERT FOR 349 METERS
-- Daily readings for July 2025 (31 days)
-- =====================================================

-- Insert comprehensive sample data (349 meters with realistic daily consumption patterns)
INSERT INTO daily_water_consumption (
    account_number, customer_name, address, meter_type, meter_size, zone_classification, building_type,
    day_01, day_02, day_03, day_04, day_05, day_06, day_07, day_08, day_09, day_10,
    day_11, day_12, day_13, day_14, day_15, day_16, day_17, day_18, day_19, day_20,
    day_21, day_22, day_23, day_24, day_25, day_26, day_27, day_28, day_29, day_30, day_31
) VALUES

-- Zone 03A Residential Villas (Sample 50 meters)
('4300002', 'Al-Rashid Family', 'Zone 3A - Villa Z3-42', 'Standard', '20mm', 'Zone_03A', 'Residential_Villa',
 1.2, 1.5, 1.8, 2.1, 1.9, 2.3, 2.0, 1.7, 1.4, 1.6, 1.8, 1.9, 2.2, 1.5, 1.3, 1.7, 1.9, 2.1, 1.8, 1.6,
 1.4, 1.7, 1.9, 2.0, 1.8, 1.5, 1.3, 1.6, 1.8, 2.1, 1.9),

('4300005', 'Al-Balushi Residence', 'Zone 3A - Villa Z3-38', 'Standard', '20mm', 'Zone_03A', 'Residential_Villa',
 3.2, 3.8, 4.1, 3.9, 3.7, 4.2, 3.5, 3.1, 2.9, 3.4, 3.6, 3.8, 4.0, 3.3, 3.1, 3.5, 3.7, 3.9, 3.6, 3.2,
 3.0, 3.4, 3.6, 3.8, 3.5, 3.2, 2.9, 3.3, 3.5, 3.7, 3.4),

('4300038', 'Empty Villa Z3-23', 'Zone 3A - Villa Z3-23', 'Standard', '20mm', 'Zone_03A', 'Residential_Villa',
 0.0, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0),

('4300044', 'Johnson Family', 'Zone 3A - Villa Z3-41', 'Standard', '20mm', 'Zone_03A', 'Residential_Villa',
 0.8, 1.2, 1.5, 1.3, 1.1, 1.6, 1.4, 0.9, 0.7, 1.0, 1.2, 1.3, 1.5, 1.1, 0.9, 1.3, 1.5, 1.7, 1.4, 1.0,
 0.8, 1.1, 1.3, 1.4, 1.2, 0.9, 0.7, 1.0, 1.2, 1.5, 1.3),

('4300049', 'Al-Kindi Residence', 'Zone 3A - Villa Z3-37', 'Standard', '20mm', 'Zone_03A', 'Residential_Villa',
 1.1, 1.4, 1.7, 1.5, 1.3, 1.8, 1.6, 1.2, 1.0, 1.3, 1.5, 1.6, 1.8, 1.4, 1.2, 1.6, 1.8, 2.0, 1.7, 1.3,
 1.1, 1.4, 1.6, 1.7, 1.5, 1.2, 1.0, 1.3, 1.5, 1.8, 1.6),

-- Zone 03A Building Apartments (Sample 30 meters)
('4300176', 'Building D-75 Common', 'Zone 3A - Building D-75', 'Commercial', '25mm', 'Zone_03A', 'Building_Bulk',
 2.8, 3.2, 3.5, 3.3, 3.1, 3.6, 3.4, 3.0, 2.7, 3.1, 3.3, 3.4, 3.6, 3.2, 3.0, 3.4, 3.6, 3.8, 3.5, 3.1,
 2.9, 3.2, 3.4, 3.5, 3.3, 3.0, 2.8, 3.1, 3.3, 3.6, 3.4),

('4300177', 'Building D-74 Common', 'Zone 3A - Building D-74', 'Commercial', '25mm', 'Zone_03A', 'Building_Bulk',
 3.5, 4.1, 4.4, 4.2, 4.0, 4.5, 4.3, 3.9, 3.6, 4.0, 4.2, 4.3, 4.5, 4.1, 3.9, 4.3, 4.5, 4.7, 4.4, 4.0,
 3.8, 4.1, 4.3, 4.4, 4.2, 3.9, 3.7, 4.0, 4.2, 4.5, 4.3),

-- Zone 03B Residential Villas (Sample 25 meters)
('4300009', 'Al-Said Family', 'Zone 3B - Villa Z3-21', 'Standard', '20mm', 'Zone_03B', 'Residential_Villa',
 2.1, 2.5, 2.8, 2.6, 2.4, 2.9, 2.7, 2.3, 2.0, 2.4, 2.6, 2.7, 2.9, 2.5, 2.3, 2.7, 2.9, 3.1, 2.8, 2.4,
 2.2, 2.5, 2.7, 2.8, 2.6, 2.3, 2.1, 2.4, 2.6, 2.9, 2.7),

('4300020', 'Thompson Residence', 'Zone 3B - Villa Z3-20', 'Standard', '20mm', 'Zone_03B', 'Residential_Villa',
 0.6, 0.8, 1.0, 0.9, 0.7, 1.1, 0.9, 0.5, 0.3, 0.6, 0.8, 0.9, 1.1, 0.7, 0.5, 0.9, 1.1, 1.3, 1.0, 0.6,
 0.4, 0.7, 0.9, 1.0, 0.8, 0.5, 0.3, 0.6, 0.8, 1.1, 0.9),

-- Zone 05 Residential Villas (Sample 75 meters)
('4300001', 'Al-Harthi Family', 'Zone 05 - Villa Z5-17', 'Standard', '20mm', 'Zone_05', 'Residential_Villa',
 3.8, 4.2, 4.5, 4.3, 4.1, 4.6, 4.4, 4.0, 3.7, 4.1, 4.3, 4.4, 4.6, 4.2, 4.0, 4.4, 4.6, 4.8, 4.5, 4.1,
 3.9, 4.2, 4.4, 4.5, 4.3, 4.0, 3.8, 4.1, 4.3, 4.6, 4.4),

('4300058', 'Miller Residence', 'Zone 05 - Villa Z5-13', 'Standard', '20mm', 'Zone_05', 'Residential_Villa',
 5.2, 5.8, 6.1, 5.9, 5.7, 6.2, 6.0, 5.6, 5.3, 5.7, 5.9, 6.0, 6.2, 5.8, 5.6, 6.0, 6.2, 6.4, 6.1, 5.7,
 5.5, 5.8, 6.0, 6.1, 5.9, 5.6, 5.4, 5.7, 5.9, 6.2, 6.0),

-- Zone 08 Residential Villas (Sample 50 meters)
('4300023', 'Empty Villa Z8-11', 'Zone 08 - Villa Z8-11', 'Standard', '20mm', 'Zone_08', 'Residential_Villa',
 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0),

('4300024', 'Villa Z8-13', 'Zone 08 - Villa Z8-13', 'Standard', '20mm', 'Zone_08', 'Residential_Villa',
 7.1, 7.5, 7.8, 7.6, 7.4, 7.9, 7.7, 7.3, 7.0, 7.4, 7.6, 7.7, 7.9, 7.5, 7.3, 7.7, 7.9, 8.1, 7.8, 7.4,
 7.2, 7.5, 7.7, 7.8, 7.6, 7.3, 7.1, 7.4, 7.6, 7.9, 7.7),

-- Commercial/Retail Properties (Sample 40 meters)
('4300334', 'Shangri La Hotel', 'Main Building - Hotel Complex', 'Commercial', '50mm', 'Direct_Connection', 'Hotel',
 485.2, 492.8, 498.5, 495.1, 490.3, 501.7, 496.9, 488.4, 482.6, 489.2, 493.7, 495.8, 501.2, 492.1, 488.9, 496.3, 501.4, 507.8, 499.2, 485.7,
 483.1, 490.5, 494.2, 497.3, 493.8, 489.4, 484.6, 488.9, 492.1, 499.7, 495.3),

('4300348', 'Al Adrak Camp', 'Worker Accommodation', 'Commercial', '32mm', 'Direct_Connection', 'Accommodation',
 31.2, 32.8, 33.5, 32.9, 31.7, 34.1, 33.3, 30.8, 29.6, 31.4, 32.6, 33.1, 34.5, 32.2, 30.9, 33.2, 34.8, 35.7, 33.9, 31.5,
 30.1, 32.1, 33.4, 34.2, 32.8, 31.2, 29.8, 31.6, 32.9, 34.3, 33.1),

-- Zone Bulk Meters (8 meters)
('4300343', 'Zone 3A Bulk Supply', 'Zone 3A - Main Distribution', 'Bulk', '80mm', 'Zone_03A', 'Zone_Bulk',
 195.8, 201.4, 205.2, 202.3, 198.7, 207.1, 204.5, 196.9, 192.1, 198.4, 202.8, 204.9, 208.3, 201.2, 197.8, 205.1, 209.7, 214.3, 206.8, 193.5,
 191.2, 199.7, 203.5, 206.8, 202.1, 197.3, 193.8, 198.1, 201.6, 207.9, 204.2),

('4300344', 'Zone 3B Bulk Supply', 'Zone 3B - Main Distribution', 'Bulk', '80mm', 'Zone_03B', 'Zone_Bulk',
 105.2, 108.7, 111.1, 109.4, 106.8, 112.5, 110.3, 104.6, 101.9, 106.2, 108.9, 110.4, 113.1, 108.1, 105.3, 109.8, 112.4, 115.2, 111.7, 102.7,
 100.8, 107.1, 109.6, 111.9, 108.5, 105.1, 102.4, 106.7, 109.2, 112.8, 110.1),

-- Infrastructure/Services (30 meters)
('4300294', 'Irrigation Tank 04', 'Zone 08 - Irrigation System', 'Service', '25mm', 'Zone_08', 'Irrigation',
 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0),

('4300297', 'Security Building', 'Main Entrance - Security Post', 'Service', '20mm', 'Direct_Connection', 'Security',
 0.6, 0.7, 0.8, 0.7, 0.6, 0.8, 0.7, 0.5, 0.4, 0.6, 0.7, 0.8, 0.9, 0.6, 0.5, 0.7, 0.8, 0.9, 0.8, 0.6,
 0.4, 0.6, 0.7, 0.8, 0.7, 0.5, 0.4, 0.6, 0.7, 0.8, 0.7);

-- Continue adding more sample data to reach 349 meters total...
-- [This is a sample - you would continue adding entries for all 349 meters]

-- =====================================================
-- ANALYTICAL VIEWS FOR AGGREGATED DATA
-- =====================================================

-- Daily Zone Consumption Summary View
CREATE OR REPLACE VIEW daily_zone_summary AS
SELECT 
    zone_classification,
    building_type,
    COUNT(*) as meter_count,
    SUM(total_monthly_consumption) as zone_total_consumption,
    AVG(average_daily_consumption) as zone_avg_daily,
    MAX(total_monthly_consumption) as max_consumer,
    MIN(total_monthly_consumption) as min_consumer,
    STDDEV(total_monthly_consumption) as consumption_variance
FROM daily_water_consumption 
WHERE meter_status = 'Active'
GROUP BY zone_classification, building_type
ORDER BY zone_total_consumption DESC;

-- Top Daily Consumers View
CREATE OR REPLACE VIEW top_daily_consumers AS
SELECT 
    account_number,
    customer_name,
    address,
    zone_classification,
    building_type,
    total_monthly_consumption,
    average_daily_consumption,
    RANK() OVER (ORDER BY total_monthly_consumption DESC) as consumption_rank
FROM daily_water_consumption 
WHERE meter_status = 'Active'
ORDER BY total_monthly_consumption DESC
LIMIT 50;

-- Daily Consumption Pattern Analysis View
CREATE OR REPLACE VIEW daily_consumption_patterns AS
SELECT 
    account_number,
    customer_name,
    address,
    -- Weekend vs Weekday consumption comparison
    (day_06 + day_07 + day_13 + day_14 + day_20 + day_21 + day_27 + day_28) / 8.0 as avg_weekend_consumption,
    (day_01 + day_02 + day_03 + day_04 + day_05 + day_08 + day_09 + day_10 + day_11 + day_12 + 
     day_15 + day_16 + day_17 + day_18 + day_19 + day_22 + day_23 + day_24 + day_25 + day_26 + 
     day_29 + day_30 + day_31) / 23.0 as avg_weekday_consumption,
    -- Peak consumption analysis
    GREATEST(day_01,day_02,day_03,day_04,day_05,day_06,day_07,day_08,day_09,day_10,
             day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
             day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31) as peak_daily_consumption,
    -- Consumption volatility
    (GREATEST(day_01,day_02,day_03,day_04,day_05,day_06,day_07,day_08,day_09,day_10,
              day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
              day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31) -
     LEAST(day_01,day_02,day_03,day_04,day_05,day_06,day_07,day_08,day_09,day_10,
           day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
           day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31)) as consumption_range
FROM daily_water_consumption
WHERE meter_status = 'Active';

-- Anomaly Detection View (Potential Leaks)
CREATE OR REPLACE VIEW consumption_anomalies AS
SELECT 
    account_number,
    customer_name,
    address,
    zone_classification,
    building_type,
    average_daily_consumption,
    total_monthly_consumption,
    CASE 
        WHEN average_daily_consumption > 50 THEN 'High Consumption Alert'
        WHEN average_daily_consumption = 0 THEN 'No Consumption - Check Meter'
        WHEN (GREATEST(day_01,day_02,day_03,day_04,day_05,day_06,day_07,day_08,day_09,day_10,
                      day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
                      day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31) / 
              NULLIF(average_daily_consumption, 0)) > 5 THEN 'Peak Consumption Anomaly'
        WHEN building_type = 'Residential_Villa' AND average_daily_consumption > 10 THEN 'Villa High Usage'
        ELSE 'Normal'
    END as anomaly_type,
    -- Calculate consistency score (lower = more consistent)
    (GREATEST(day_01,day_02,day_03,day_04,day_05,day_06,day_07,day_08,day_09,day_10,
              day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
              day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31) -
     LEAST(day_01,day_02,day_03,day_04,day_05,day_06,day_07,day_08,day_09,day_10,
           day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
           day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31)) / 
    NULLIF(average_daily_consumption, 0) as consumption_volatility_ratio
FROM daily_water_consumption
WHERE meter_status = 'Active'
ORDER BY average_daily_consumption DESC;

-- Monthly Billing Summary View
CREATE OR REPLACE VIEW monthly_billing_summary AS
SELECT 
    account_number,
    customer_name,
    address,
    zone_classification,
    building_type,
    total_monthly_consumption,
    CASE 
        WHEN total_monthly_consumption <= 10 THEN total_monthly_consumption * 0.150  -- Low tier
        WHEN total_monthly_consumption <= 25 THEN (10 * 0.150) + ((total_monthly_consumption - 10) * 0.200)  -- Mid tier
        ELSE (10 * 0.150) + (15 * 0.200) + ((total_monthly_consumption - 25) * 0.300)  -- High tier
    END as estimated_bill_omr,
    CASE 
        WHEN total_monthly_consumption <= 10 THEN 'Low Usage'
        WHEN total_monthly_consumption <= 25 THEN 'Medium Usage'
        ELSE 'High Usage'
    END as usage_category
FROM daily_water_consumption
WHERE meter_status = 'Active'
ORDER BY estimated_bill_omr DESC;

-- =====================================================
-- UTILITY FUNCTIONS AND PROCEDURES
-- =====================================================

-- Function to get consumption for specific date range
CREATE OR REPLACE FUNCTION get_date_range_consumption(
    p_account_number VARCHAR(10),
    p_start_day INTEGER,
    p_end_day INTEGER
)
RETURNS DECIMAL(10,3) AS $$
DECLARE
    result DECIMAL(10,3) := 0;
    daily_values DECIMAL(10,3)[];
    i INTEGER;
BEGIN
    SELECT ARRAY[day_01,day_02,day_03,day_04,day_05,day_06,day_07,day_08,day_09,day_10,
                 day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
                 day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31]
    INTO daily_values
    FROM daily_water_consumption 
    WHERE account_number = p_account_number;
    
    FOR i IN p_start_day..LEAST(p_end_day, 31) LOOP
        result := result + COALESCE(daily_values[i], 0);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATA VALIDATION AND QUALITY CHECKS
-- =====================================================

-- Check for data completeness
SELECT 
    'Data Completeness Check' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN total_monthly_consumption > 0 THEN 1 END) as records_with_consumption,
    COUNT(CASE WHEN meter_status = 'Active' THEN 1 END) as active_meters,
    ROUND(AVG(total_monthly_consumption), 2) as avg_monthly_consumption
FROM daily_water_consumption;

-- Zone distribution validation
SELECT 
    'Zone Distribution' as check_type,
    zone_classification,
    COUNT(*) as meter_count,
    SUM(total_monthly_consumption) as zone_total,
    ROUND(AVG(total_monthly_consumption), 2) as zone_average
FROM daily_water_consumption 
GROUP BY zone_classification
ORDER BY zone_total DESC;

-- Building type analysis
SELECT 
    'Building Type Analysis' as check_type,
    building_type,
    COUNT(*) as count,
    ROUND(AVG(total_monthly_consumption), 2) as avg_consumption,
    ROUND(MIN(total_monthly_consumption), 2) as min_consumption,
    ROUND(MAX(total_monthly_consumption), 2) as max_consumption
FROM daily_water_consumption 
GROUP BY building_type
ORDER BY avg_consumption DESC;

-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- Additional indexes for specific query patterns
CREATE INDEX CONCURRENTLY idx_daily_consumption_customer_name ON daily_water_consumption(customer_name);
CREATE INDEX CONCURRENTLY idx_daily_consumption_building_zone ON daily_water_consumption(building_type, zone_classification);
CREATE INDEX CONCURRENTLY idx_daily_consumption_avg_daily ON daily_water_consumption(average_daily_consumption DESC);

-- Partial index for active meters only (most common queries)
CREATE INDEX CONCURRENTLY idx_daily_consumption_active_total ON daily_water_consumption(total_monthly_consumption DESC) 
WHERE meter_status = 'Active';

-- =====================================================
-- SUCCESS CONFIRMATION
-- =====================================================

SELECT 'Daily Water Consumption Database Schema Created Successfully!' as status,
       'Tables, Views, Indexes, and Functions are ready for use' as details,
       'Sample data for ' || COUNT(*) || ' meters has been inserted' as data_status
FROM daily_water_consumption;