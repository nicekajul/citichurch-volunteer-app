
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkTeams() {
  console.log("Checking teams table...");
  const { data, error } = await supabase
    .from('teams')
    .select('*');

  if (error) {
    console.error("Error fetching teams:", error);
  } else {
    console.log("Teams found:", data?.length || 0);
    if (data && data.length > 0) {
      console.log("First team sample:", JSON.stringify(data[0], null, 2));
      console.log("All columns:", Object.keys(data[0]));
    } else {
      console.log("Teams table is empty.");
    }
  }
}

checkTeams();
