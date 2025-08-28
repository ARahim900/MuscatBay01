import { supabase } from '../lib/supabase';

export const testSupabaseConnection = async () => {
  console.log('=== TESTING SUPABASE CONNECTION ===');
  
  try {
    // First, test if we can reach Supabase at all
    console.log('🔍 Testing basic connectivity...');
    
    // Try a simple query first
    const { data: basicTest, error: basicError } = await supabase
      .from('water_meters')
      .select('*')
      .limit(1);
    
    if (basicError) {
      console.error('❌ Basic Connection Error:', basicError);
      
      // Check if it's a table not found error
      if (basicError.code === 'PGRST116' || basicError.message.includes('does not exist')) {
        return { 
          success: false, 
          error: 'Table "water_meters" does not exist in your database. Please create it first.',
          errorType: 'table_not_found'
        };
      }
      
      // Check if it's an authentication error
      if (basicError.code === '401' || basicError.message.includes('JWT')) {
        return { 
          success: false, 
          error: 'Authentication failed. Please check your Supabase credentials.',
          errorType: 'auth_error'
        };
      }
      
      return { success: false, error: basicError.message, errorType: 'connection_error' };
    }
    
    console.log('✅ Basic connection successful!');
    console.log('📊 Sample data retrieved:', basicTest?.length || 0, 'records');
    
    // Now test count query
    const { count, error: countError } = await supabase
      .from('water_meters')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.warn('⚠️ Count query failed, but basic connection works:', countError.message);
    } else {
      console.log('📊 Total water meters in database:', count);
    }
    
    // Test fetching sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('water_meters')
      .select('*')
      .limit(5);
    
    if (sampleError) {
      console.error('❌ Sample Data Error:', sampleError);
      return { success: false, error: sampleError.message };
    }
    
    console.log('✅ Sample data fetched successfully:');
    console.log('📋 Sample records:', sampleData?.length || 0);
    
    if (sampleData && sampleData.length > 0) {
      console.log('🔍 First record structure:', Object.keys(sampleData[0]));
      console.log('📊 Sample record:', sampleData[0]);
    }
    
    // Test for daily consumption tables
    const possibleDailyTables = [
      'july25_daily_water_consumption_data',
      'July25_Daily_Water_Consumption_Data',
      'daily_water_consumption_july25',
      'daily_consumption_july25',
      'water_daily_consumption',
      'daily_water_consumption'
    ];
    
    console.log('🔍 Checking for daily consumption tables...');
    
    for (const tableName of possibleDailyTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error && data) {
          console.log(`✅ Found daily consumption table: ${tableName}`);
          console.log(`📊 Sample daily record:`, data[0]);
          return { 
            success: true, 
            message: 'Connection successful', 
            dailyTableFound: tableName,
            sampleCount: connectionTest 
          };
        }
      } catch (err) {
        // Table doesn't exist, continue checking
        continue;
      }
    }
    
    console.log('⚠️ No daily consumption table found, will use monthly data');
    
    return { 
      success: true, 
      message: 'Connection successful, using monthly data', 
      dailyTableFound: false,
      sampleCount: count || basicTest?.length || 0,
      sampleData: basicTest?.[0] || null
    };
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Function to create a sample daily consumption table if needed
export const createSampleDailyTable = async () => {
  console.log('=== CREATING SAMPLE DAILY CONSUMPTION TABLE ===');
  
  try {
    // This would typically be done through Supabase dashboard or SQL
    // For now, we'll just log what the structure should be
    console.log('📋 Recommended table structure for daily consumption:');
    console.log(`
      CREATE TABLE july25_daily_water_consumption_data (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        meter_id VARCHAR(20) NOT NULL,
        meter_label VARCHAR(100),
        account_number VARCHAR(20),
        zone VARCHAR(50),
        level VARCHAR(10),
        meter_type VARCHAR(50),
        consumption DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create indexes for better performance
      CREATE INDEX idx_daily_consumption_date ON july25_daily_water_consumption_data(date);
      CREATE INDEX idx_daily_consumption_meter ON july25_daily_water_consumption_data(meter_id);
      CREATE INDEX idx_daily_consumption_zone ON july25_daily_water_consumption_data(zone);
    `);
    
    return { success: true, message: 'Table structure provided' };
    
  } catch (error) {
    console.error('❌ Error creating sample table:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};