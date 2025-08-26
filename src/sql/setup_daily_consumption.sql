-- =====================================================
-- DAILY WATER CONSUMPTION TABLE SETUP FOR SUPABASE
-- =====================================================
-- Run this entire script in your Supabase SQL editor

-- Step 1: Drop existing table if it exists
DROP TABLE IF EXISTS daily_water_consumption CASCADE;

-- Step 2: Create the daily consumption table with proper structure
CREATE TABLE daily_water_consumption (
    account_number VARCHAR(10) PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    address VARCHAR(100) NOT NULL,
    reading_month INTEGER NOT NULL,
    day_01 NUMERIC(10,3),
    day_02 NUMERIC(10,3),
    day_03 NUMERIC(10,3),
    day_04 NUMERIC(10,3),
    day_05 NUMERIC(10,3),
    day_06 NUMERIC(10,3),
    day_07 NUMERIC(10,3),
    day_08 NUMERIC(10,3),
    day_09 NUMERIC(10,3),
    day_10 NUMERIC(10,3),
    day_11 NUMERIC(10,3),
    day_12 NUMERIC(10,3),
    day_13 NUMERIC(10,3),
    day_14 NUMERIC(10,3),
    day_15 NUMERIC(10,3),
    day_16 NUMERIC(10,3),
    day_17 NUMERIC(10,3),
    day_18 NUMERIC(10,3),
    day_19 NUMERIC(10,3),
    day_20 NUMERIC(10,3),
    day_21 NUMERIC(10,3),
    day_22 NUMERIC(10,3),
    day_23 NUMERIC(10,3),
    day_24 NUMERIC(10,3),
    day_25 NUMERIC(10,3),
    day_26 NUMERIC(10,3),
    day_27 NUMERIC(10,3),
    day_28 NUMERIC(10,3),
    day_29 NUMERIC(10,3),
    day_30 NUMERIC(10,3),
    day_31 NUMERIC(10,3),
    monthly_total NUMERIC(12,3) GENERATED ALWAYS AS (
        COALESCE(day_01, 0) + COALESCE(day_02, 0) + COALESCE(day_03, 0) + 
        COALESCE(day_04, 0) + COALESCE(day_05, 0) + COALESCE(day_06, 0) + 
        COALESCE(day_07, 0) + COALESCE(day_08, 0) + COALESCE(day_09, 0) + 
        COALESCE(day_10, 0) + COALESCE(day_11, 0) + COALESCE(day_12, 0) + 
        COALESCE(day_13, 0) + COALESCE(day_14, 0) + COALESCE(day_15, 0) + 
        COALESCE(day_16, 0) + COALESCE(day_17, 0) + COALESCE(day_18, 0) + 
        COALESCE(day_19, 0) + COALESCE(day_20, 0) + COALESCE(day_21, 0) + 
        COALESCE(day_22, 0) + COALESCE(day_23, 0) + COALESCE(day_24, 0) + 
        COALESCE(day_25, 0) + COALESCE(day_26, 0) + COALESCE(day_27, 0) + 
        COALESCE(day_28, 0) + COALESCE(day_29, 0) + COALESCE(day_30, 0) + 
        COALESCE(day_31, 0)
    ) STORED,
    daily_average NUMERIC(10,3) GENERATED ALWAYS AS (
        (COALESCE(day_01, 0) + COALESCE(day_02, 0) + COALESCE(day_03, 0) + 
         COALESCE(day_04, 0) + COALESCE(day_05, 0) + COALESCE(day_06, 0) + 
         COALESCE(day_07, 0) + COALESCE(day_08, 0) + COALESCE(day_09, 0) + 
         COALESCE(day_10, 0) + COALESCE(day_11, 0) + COALESCE(day_12, 0) + 
         COALESCE(day_13, 0) + COALESCE(day_14, 0) + COALESCE(day_15, 0) + 
         COALESCE(day_16, 0) + COALESCE(day_17, 0) + COALESCE(day_18, 0) + 
         COALESCE(day_19, 0) + COALESCE(day_20, 0) + COALESCE(day_21, 0) + 
         COALESCE(day_22, 0) + COALESCE(day_23, 0) + COALESCE(day_24, 0) + 
         COALESCE(day_25, 0) + COALESCE(day_26, 0) + COALESCE(day_27, 0) + 
         COALESCE(day_28, 0) + COALESCE(day_29, 0) + COALESCE(day_30, 0) + 
         COALESCE(day_31, 0)) / 31.0
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_daily_consumption_address ON daily_water_consumption(address);
CREATE INDEX idx_daily_consumption_month ON daily_water_consumption(reading_month);
CREATE INDEX idx_daily_consumption_customer ON daily_water_consumption(customer_name);
CREATE INDEX idx_daily_consumption_monthly_total ON daily_water_consumption(monthly_total);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE daily_water_consumption ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policy for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access" ON daily_water_consumption
    FOR SELECT USING (true);

-- Step 6: Grant permissions
GRANT SELECT ON daily_water_consumption TO anon;
GRANT SELECT ON daily_water_consumption TO authenticated;

-- Step 7: Verify table creation
SELECT 
    'Table created successfully' as status,
    count(*) as current_records
FROM daily_water_consumption;