// Is a real Supabase backend wired up? The whole app is built to run without one
// (marketing landing, login screen and "connect your backend" states all render),
// and to light up the moment these env vars point at a real project.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabaseConfigured =
  /^https:\/\/[a-z0-9-]+\.supabase\.co/i.test(supabaseUrl) &&
  supabaseAnon.length > 20 &&
  !supabaseUrl.includes("YOUR-PROJECT");
