#!/usr/bin/env python3
"""
Script to fix water database parent meter references
Corrects the Zone_08 parent references and type names
"""

# Key fixes needed:
fixes = {
    "parent_meter_fixes": {
        "BULK ZONE 8": "ZONE 8 (Bulk Zone 8)",
        "ZONE 3A (BULK ZONE 3A)": "ZONE 3A (Bulk Zone 3A)", 
        "ZONE 3B (BULK ZONE 3B)": "ZONE 3B (Bulk Zone 3B)",
        "Sale Centre (Zone Bulk)": "Sales Center Common Building"
    },
    "type_fixes": {
        "IRR_Servies": "IRR_Services",
        "Main BULK": "Main Bulk"
    }
}

# SQL Update statements for Supabase
sql_updates = """
-- =====================================================
-- FIX WATER DATABASE IN SUPABASE
-- Run these updates to fix parent references and types
-- =====================================================

-- Fix Zone_08 parent meter references
UPDATE water_meters 
SET parent_meter = 'ZONE 8 (Bulk Zone 8)'
WHERE zone = 'Zone_08' 
  AND label = 'L3'
  AND parent_meter = 'BULK ZONE 8';

-- Fix Zone_03_(A) parent meter references  
UPDATE water_meters
SET parent_meter = 'ZONE 3A (Bulk Zone 3A)'
WHERE zone = 'Zone_03_(A)'
  AND label IN ('L3', 'L4')
  AND parent_meter = 'ZONE 3A (BULK ZONE 3A)';

-- Fix Zone_03_(B) parent meter references
UPDATE water_meters
SET parent_meter = 'ZONE 3B (Bulk Zone 3B)'  
WHERE zone = 'Zone_03_(B)'
  AND label IN ('L3', 'L4')
  AND parent_meter = 'ZONE 3B (BULK ZONE 3B)';

-- Fix Zone_SC parent meter references
UPDATE water_meters
SET parent_meter = 'Sales Center Common Building'
WHERE zone = 'Zone_SC'
  AND parent_meter = 'Sale Centre (Zone Bulk)';

-- Fix type spelling errors
UPDATE water_meters
SET type = 'IRR_Services'
WHERE type = 'IRR_Servies';

UPDATE water_meters  
SET type = 'Main Bulk'
WHERE type = 'Main BULK';

-- Fix any residential type variations
UPDATE water_meters
SET type = CASE
    WHEN type = 'Residential (Apart)' THEN 'Residential (Apartment)'
    ELSE type
END
WHERE type = 'Residential (Apart)';

-- Verify the fixes
SELECT zone, label, parent_meter, COUNT(*) as count
FROM water_meters
WHERE zone IN ('Zone_08', 'Zone_03_(A)', 'Zone_03_(B)', 'Zone_05')
GROUP BY zone, label, parent_meter
ORDER BY zone, label;
"""

print(sql_updates)

# Summary of Zone_08 expected data
zone_08_summary = """
ZONE_08 EXPECTED DATA SUMMARY:
==============================
Total Meters: 23
- L2 (Zone Bulk): 1 meter - "ZONE 8 (Bulk Zone 8)" 
- L3 (Villas): 22 meters - Z8-1 through Z8-22

All L3 meters should have:
- zone: 'Zone_08'
- parent_meter: 'ZONE 8 (Bulk Zone 8)'
- type: 'Residential (Villa)'
- label: 'L3'

Total Zone_08 Consumption (Jan-Jun):
- Zone Bulk (L2): 14,932 m³
- Individual Villas (L3): Variable per villa
"""

print(zone_08_summary)