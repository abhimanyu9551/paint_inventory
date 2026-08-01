import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Service-role client for privileged operations (creating/deleting real auth
// users). Server-only: SUPABASE_SERVICE_ROLE_KEY must never reach the browser.
// Only import this from Server Actions / Route Handlers.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (Supabase Dashboard -> Settings -> API)."
    )
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
