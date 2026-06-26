"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { UserRole } from "@/lib/types"

export function AuthGuard({
  children,
  allowedRoles,
  fallback = "/dashboard",
}: {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  fallback?: string
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(fallback)
    }
  }, [user, loading, router, allowedRoles, fallback])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return null
  if (allowedRoles && !allowedRoles.includes(user.role)) return null

  return <>{children}</>
}
