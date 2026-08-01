"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { SessionUser } from "./types"

interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchSessionUser(
  supabase: ReturnType<typeof createClient>,
  authUserId: string
): Promise<SessionUser | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .eq("id", authUserId)
    .single()

  if (!profile) return null
  return { id: profile.id, name: profile.name, email: profile.email, role: profile.role }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(await fetchSessionUser(supabase, session.user.id))
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(await fetchSessionUser(supabase, session.user.id))
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const supabase = supabaseRef.current
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return { error: error.message }
    if (data.user) {
      setUser(await fetchSessionUser(supabase, data.user.id))
    }
    return {}
  }, [])

  const logout = useCallback(() => {
    const supabase = supabaseRef.current
    supabase.auth.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
