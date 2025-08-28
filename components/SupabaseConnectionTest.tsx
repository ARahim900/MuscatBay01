import React, { useState } from 'react';
import { Card, Button } from '../src/components/ui';
import { testSupabaseConnection, createSampleDailyTable } from '../src/utils/testSupabaseConnection';
import { CheckCircle, XCircle, RefreshCw, Database, AlertTriangle } from 'lucide-react';

export const SupabaseConnectionTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const testResult = await testSupabaseConnection();
      setResult(testResult);
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setTesting(false);
    }
  };

  const showTableStructure = async () => {
    const structureResult = await createSampleDailyTable();
    console.log('Table structure result:', structureResult);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          Supabase Connection Test
        </h3>
        <div className="flex gap-2">
          <Button onClick={runTest} disabled={testing} size="sm">
            {testing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Button onClick={showTableStructure} variant="outline" size="sm">
            Show Table Structure
          </Button>
        </div>
      </div>

      {testing && (
        <div className="flex items-center gap-2 text-blue-600 mb-4">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Testing connection to Supabase...</span>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            result.success 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">
              {result.success ? 'Connection Successful!' : 'Connection Failed'}
            </span>
          </div>

          {result.success && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Database Status</h4>
                <p className="text-sm text-blue-600">
                  Water meters table: ✅ Connected
                </p>
                {result.sampleCount && (
                  <p className="text-sm text-blue-600">
                    Total records: {result.sampleCount}
                  </p>
                )}
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Daily Data Status</h4>
                {result.dailyTableFound ? (
                  <p className="text-sm text-yellow-600">
                    ✅ Daily table found: {result.dailyTableFound}
                  </p>
                ) : (
                  <div className="text-sm text-yellow-600">
                    <p className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      No daily consumption table found
                    </p>
                    <p className="mt-1">Will generate from monthly data</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {result.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Error Details</h4>
              <p className="text-sm text-red-600 font-mono mb-2">{result.error}</p>
              
              {result.errorType === 'table_not_found' && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800 font-medium">Quick Fix:</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    The water_meters table doesn't exist. You can either:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-1 ml-4 list-disc">
                    <li>Create the table using the SQL provided below</li>
                    <li>Or continue using the demo with sample data</li>
                  </ul>
                </div>
              )}
              
              {result.errorType === 'auth_error' && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800 font-medium">Authentication Issue:</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct.
                  </p>
                </div>
              )}
            </div>
          )}

          {result.message && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{result.message}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">How to Set Up Daily Consumption Table</h4>
        <div className="text-sm text-blue-600 space-y-2">
          <p>1. Go to your Supabase dashboard</p>
          <p>2. Navigate to the SQL Editor</p>
          <p>3. Create the table "july25_daily_water_consumption_data"</p>
          <p>4. Click "Show Table Structure" above to see the recommended schema</p>
          <p>5. Import your daily consumption data</p>
        </div>
      </div>
    </Card>
  );
};