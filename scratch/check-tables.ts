import { supabase } from "../backend/src/services/supabase";

async function checkTables() {
  console.log("Checking tables...");
  
  const tables = ["dynamic_records", "user_activity", "app_registry", "app_snapshots"];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.warn(`Table ${table} error:`, error.message);
    } else {
      console.log(`Table ${table} exists and is accessible.`);
    }
  }
}

checkTables();
