import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jpqkoyxnsdzorsadpdvs.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcWtveXhuc2R6b3JzYWRwZHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODMwNjcsImV4cCI6MjA3MTA1OTA2N30.6D0kMEPyZVeDi1nUpk_XE8xPIKr6ylHyfjmjG4apPWY'

// Validate configuration
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase configuration missing!')
  console.error('Please check your environment variables:')
  console.error('- VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.error('- VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')
}

console.log('🔧 Supabase Configuration:')
console.log('- URL:', supabaseUrl)
console.log('- Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Missing')

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // Disable auth for now since we're using anon access
  },
  global: {
    headers: {
      'X-Client-Info': 'muscat-bay-dashboard'
    }
  }
})

export type WaterMeter = {
  id: number
  meter_label: string
  account_number: string
  label: 'L1' | 'L2' | 'L3' | 'L4' | 'DC' | 'N/A'
  zone: string
  parent_meter: string
  type: string
  jan_25: number
  feb_25: number
  mar_25: number
  apr_25: number
  may_25: number
  jun_25: number
  jul_25: number
  created_at?: string
  updated_at?: string
}