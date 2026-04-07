
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPromos() {
  const { data, error } = await supabase.from('promotions').select('*');
  if (error) {
    console.error("Error fetching promos:", error);
    return;
  }
  console.log("PROMOTIONS TABLE CONTENT:");
  console.log(JSON.stringify(data, null, 2));
}

checkPromos();
