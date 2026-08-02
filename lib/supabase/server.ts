import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { SessionUser } from "@/lib/types"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // setAll called from a Server Component - safe to ignore because
            // middleware refreshes the session on every request instead.
          }
        },
      },
    }
  )
}

// Reads the logged-in user's auth session plus their profile row (name/role).
// Returns null if nobody is logged in.
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .eq("id", authUser.id)
    .single()

  if (!profile) return null

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
  }
}
