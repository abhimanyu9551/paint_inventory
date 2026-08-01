import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/supabase/server"
import { getSuppliers, getPaints } from "@/lib/data"
import { SupplierTable } from "@/components/supplier-table"

export default async function SuppliersPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  if (user.role !== "admin") redirect("/dashboard")

  const [suppliers, paints] = await Promise.all([getSuppliers(), getPaints()])

  const paintCounts: Record<string, number> = {}
  for (const paint of paints) {
    paintCounts[paint.supplierId] = (paintCounts[paint.supplierId] || 0) + 1
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Suppliers</h1>
        <p className="text-muted-foreground">Manage your paint suppliers and their contact information</p>
      </div>
      <SupplierTable suppliers={suppliers} paintCounts={paintCounts} />
    </div>
  )
}
