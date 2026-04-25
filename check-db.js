
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeams() {
  console.log("Checking teams table...");
  const { data, error } = await supabase
    .from('teams')
    .select('*');

  if (error) {
    console.error("Error fetching teams:", error);
  } else {
    console.log("Teams found:", data.length);
    if (data.length > 0) {
      console.log("First team sample:", JSON.stringify(data[0], null, 2));
    } else {
      console.log("Teams table is empty.");
    }
  }

  // Check columns of teams table
  const { data: columns, error: colError } = await supabase
    .rpc('get_column_names', { table_name: 'teams' });
  
  if (colError) {
    // If RPC doesn't exist, try another way or just infer from select *
    console.log("RPC get_column_names failing (expected if not defined). Inferring columns from 'select *' results.");
  } else {
    console.log("Columns in teams table:", columns);
  }
}

checkTeams();
