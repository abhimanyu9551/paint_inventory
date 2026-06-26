"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { resolveAlert } from "@/lib/actions"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, Phone } from "lucide-react"

interface AlertItem {
  id: string
  paintName: string
  paintColor: string
  currentStock: number
  threshold: number
  supplierName: string
  supplierPhone: string
  supplierEmail: string
  message: string
  resolved: boolean
  createdAt: string
}

export function AlertList({ alerts }: { alerts: AlertItem[] }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const unresolvedAlerts = alerts.filter((a) => !a.resolved)
  const resolvedAlerts = alerts.filter((a) => a.resolved)

  function handleResolve(id: string) {
    startTransition(async () => {
      const result = await resolveAlert(id)
      if (result.error) toast.error(result.error)
      else {
        toast.success("Alert resolved")
        router.refresh()
      }
    })
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="mb-3 h-12 w-12 text-success" />
          <h3 className="text-lg font-semibold text-card-foreground">No Alerts</h3>
          <p className="text-sm text-muted-foreground">All paint stock levels are healthy</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {unresolvedAlerts.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Active Alerts ({unresolvedAlerts.length})</h2>
          {unresolvedAlerts.map((alert) => (
            <Card key={alert.id} className="border-warning/30 bg-warning/5">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-warning/20">
                      <AlertTriangle className="h-4 w-4 text-warning-foreground" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2 text-sm text-card-foreground">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: alert.paintColor }} />
                        {alert.paintName}
                        <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                      </CardTitle>
                      <CardDescription className="mt-0.5">
                        {alert.currentStock} units remaining (threshold: {alert.threshold})
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(alert.id)}
                    disabled={isPending}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Resolve
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 rounded-md bg-card p-3 text-sm">
                  <p className="font-medium text-card-foreground">Supplier: {alert.supplierName}</p>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {alert.supplierPhone}
                    </span>
                    <span>{alert.supplierEmail}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Created: {new Date(alert.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {resolvedAlerts.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Resolved ({resolvedAlerts.length})</h2>
          {resolvedAlerts.map((alert) => (
            <Card key={alert.id} className="opacity-60">
              <CardHeader className="py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <div>
                    <CardTitle className="text-sm text-card-foreground">{alert.paintName}</CardTitle>
                    <CardDescription className="text-xs">{alert.message}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
