"use client"

import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { paints, suppliers } from "@/lib/data"
import { PaintTable } from "@/components/paint-table"

export default function PaintsPage() {
  const { user } = useAuth()

  return (
    <AuthGuard allowedRoles={["admin", "supervisor"]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Paint Inventory</h1>
          <p className="text-muted-foreground">
            Manage your paint stock, add new colors, and track inventory levels
          </p>
        </div>
        {user && <PaintTable paints={[...paints]} suppliers={[...suppliers]} user={user} />}
      </div>
    </AuthGuard>
  )
}
