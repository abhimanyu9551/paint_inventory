import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/supabase/server"
import { getAlerts, getPaints, getSuppliers } from "@/lib/data"
import { AlertList } from "@/components/alert-list"

export default async function AlertsPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  if (!["admin", "supervisor"].includes(user.role)) redirect("/dashboard")

  const [alerts, paints, suppliers] = await Promise.all([getAlerts(), getPaints(), getSuppliers()])

  const alertItems = alerts.map((alert) => {
    const paint = paints.find((p) => p.id === alert.paintId)
    const supplier = paint ? suppliers.find((s) => s.id === paint.supplierId) : null
    return {
      id: alert.id,
      paintName: paint?.name || "Unknown",
      paintColor: paint?.colorHex || "#888",
      currentStock: paint?.stock || 0,
      threshold: paint?.threshold || 0,
      supplierName: supplier?.name || "Unknown",
      supplierPhone: supplier?.phone || "",
      supplierEmail: supplier?.email || "",
      message: alert.message,
      resolved: alert.resolved,
      createdAt: alert.createdAt,
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Stock Alerts</h1>
        <p className="text-muted-foreground">Monitor low-stock warnings and contact suppliers for restocking</p>
      </div>
      <AlertList alerts={alertItems} />
    </div>
  )
}
