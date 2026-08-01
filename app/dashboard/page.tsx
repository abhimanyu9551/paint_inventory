import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/supabase/server"
import { getPaints, getSuppliers, getTransactions, getLowStockPaints, getRecentTransactions, getUsers } from "@/lib/data"
import { DashboardCards } from "@/components/dashboard-cards"
import { DashboardOverviewChart } from "@/components/dashboard-overview-chart"
import { RecentTransactions } from "@/components/recent-transactions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  const [paints, suppliers, transactions, lowStockPaints, recentTxs, users] = await Promise.all([
    getPaints(),
    getSuppliers(),
    getTransactions(),
    getLowStockPaints(),
    getRecentTransactions(8),
    getUsers(),
  ])

  const chartMap = new Map<string, { consumed: number; restocked: number }>()
  for (const tx of transactions) {
    const paint = paints.find((p) => p.id === tx.paintId)
    if (!paint) continue
    const shortName = paint.name.length > 10 ? paint.name.slice(0, 10) + "..." : paint.name
    const existing = chartMap.get(shortName) || { consumed: 0, restocked: 0 }
    if (tx.type === "ADD") existing.restocked += tx.quantity
    else existing.consumed += tx.quantity
    chartMap.set(shortName, existing)
  }
  const chartData = Array.from(chartMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .slice(0, 8)

  const formattedTxs = recentTxs.map((tx) => {
    const paint = paints.find((p) => p.id === tx.paintId)
    const performedByUser = users.find((u) => u.id === tx.performedBy)
    return {
      id: tx.id,
      paintName: paint?.name || "Unknown",
      type: tx.type,
      quantity: tx.quantity,
      performedByName: performedByUser?.name || "Unknown",
      date: tx.date,
    }
  })

  if (user.role === "user") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome, {user.name}</h1>
          <p className="text-muted-foreground">Browse available paints and consume stock for your tasks</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paints
            .filter((p) => p.stock > 0)
            .map((paint) => (
              <Card key={paint.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md border border-border" style={{ backgroundColor: paint.colorHex }} />
                    <div>
                      <CardTitle className="text-sm text-card-foreground">{paint.name}</CardTitle>
                      <CardDescription>{paint.finishType} - {paint.brand}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">In Stock</span>
                    <Badge variant={paint.stock <= paint.threshold ? "destructive" : "secondary"}>
                      {paint.stock} units
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
        <div className="flex items-center justify-center">
          <Link href="/dashboard/consume" className="text-sm font-medium text-primary hover:underline">
            Go to Consume Paint page to take paint from inventory
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your paint inventory
          {user.role === "admin" ? " and business operations" : " and stock levels"}
        </p>
      </div>
      <DashboardCards
        totalPaints={paints.length}
        totalSuppliers={suppliers.length}
        lowStockCount={lowStockPaints.length}
        totalTransactions={transactions.length}
        role={user.role}
      />
      {lowStockPaints.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-warning-foreground">Low Stock Warning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockPaints.map((paint) => (
                <Badge key={paint.id} variant="outline" className="border-warning/40 text-warning-foreground">
                  {paint.name}: {paint.stock}/{paint.threshold}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardOverviewChart data={chartData} />
        <RecentTransactions transactions={formattedTxs} />
      </div>
    </div>
  )
}
