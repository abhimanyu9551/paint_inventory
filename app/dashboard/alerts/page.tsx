"use client"

import { AuthGuard } from "@/components/auth-guard"
import { alerts, getPaintById, getSupplierById } from "@/lib/data"
import { AlertList } from "@/components/alert-list"

export default function AlertsPage() {
  const alertItems = alerts.map((alert) => {
    const paint = getPaintById(alert.paintId)
    const supplier = paint ? getSupplierById(paint.supplierId) : null
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
    <AuthGuard allowedRoles={["admin", "supervisor"]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Stock Alerts</h1>
          <p className="text-muted-foreground">Monitor low-stock warnings and contact suppliers for restocking</p>
        </div>
        <AlertList alerts={alertItems} />
      </div>
    </AuthGuard>
  )
}
