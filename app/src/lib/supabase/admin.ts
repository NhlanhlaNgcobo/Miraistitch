import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Bypasses RLS via the service role. Use only in route handlers /
// server actions that have already validated the request (checkout, PayFast webhook).
// Never import this into a Client Component.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
