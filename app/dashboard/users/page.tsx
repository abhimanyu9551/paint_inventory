"use client"

import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { users } from "@/lib/data"
import { UserTable } from "@/components/user-table"

export default function UsersPage() {
  const { user } = useAuth()

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and role assignments</p>
        </div>
        {user && <UserTable users={[...users]} currentUser={user} />}
      </div>
    </AuthGuard>
  )
}
