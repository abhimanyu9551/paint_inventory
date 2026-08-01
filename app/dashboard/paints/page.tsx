import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/supabase/server"
import { getPaints, getSuppliers } from "@/lib/data"
import { PaintTable } from "@/components/paint-table"

export default async function PaintsPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  if (!["admin", "supervisor"].includes(user.role)) redirect("/dashboard")

  const [paints, suppliers] = await Promise.all([getPaints(), getSuppliers()])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Paint Inventory</h1>
        <p className="text-muted-foreground">
          Manage your paint stock, add new colors, and track inventory levels
        </p>
      </div>
      <PaintTable paints={paints} suppliers={suppliers} user={user} />
    </div>
  )
}
