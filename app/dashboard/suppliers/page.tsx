"use client"

import { AuthGuard } from "@/components/auth-guard"
import { suppliers, paints } from "@/lib/data"
import { SupplierTable } from "@/components/supplier-table"

export default function SuppliersPage() {
  const paintCounts: Record<string, number> = {}
  for (const paint of paints) {
    paintCounts[paint.supplierId] = (paintCounts[paint.supplierId] || 0) + 1
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Suppliers</h1>
          <p className="text-muted-foreground">Manage your paint suppliers and their contact information</p>
        </div>
        <SupplierTable suppliers={[...suppliers]} paintCounts={paintCounts} />
      </div>
    </AuthGuard>
  )
}
