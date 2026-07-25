import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Copy .env.example to .env.local " +
      "and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

// The anon key is safe to ship to the browser — it only grants what Row
// Level Security policies allow. Never use the service-role key here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
