import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/supabase/server"
import { getUsers } from "@/lib/data"
import { UserTable } from "@/components/user-table"

export default async function UsersPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  if (user.role !== "admin") redirect("/dashboard")

  const users = await getUsers()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and role assignments</p>
      </div>
      <UserTable users={users} currentUser={user} />
    </div>
  )
}
