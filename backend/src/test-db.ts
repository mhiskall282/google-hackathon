import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in environment.');
  process.exit(1);
}

console.log('📡 Initializing Supabase client...');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  console.log('🔍 Executing test query on table "alerts"...');
  
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .limit(3);

  if (error) {
    console.error('❌ Database Query Failed:', error.message);
    console.error('Code:', error.code);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
    process.exit(1);
  }

  console.log('✅ Database Query Succeeded!');
  console.log(`📊 Retrieved ${data.length} records from "alerts" table:`);
  console.log(JSON.stringify(data, null, 2));
}

testConnection().catch((err) => {
  console.error('❌ Connection script error:', err);
  process.exit(1);
});
