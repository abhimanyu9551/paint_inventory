import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/supabase/server"
import { getPaints, getTransactions } from "@/lib/data"
import { ReportCharts } from "@/components/report-charts"

const chartColors = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48",
]

export default async function ReportsPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  if (user.role !== "admin") redirect("/dashboard")

  const [paints, transactions] = await Promise.all([getPaints(), getTransactions()])

  const usageMap = new Map<string, { consumed: number; restocked: number }>()
  for (const tx of transactions) {
    const paint = paints.find((p) => p.id === tx.paintId)
    if (!paint) continue
    const existing = usageMap.get(paint.name) || { consumed: 0, restocked: 0 }
    if (tx.type === "ADD") existing.restocked += tx.quantity
    else existing.consumed += tx.quantity
    usageMap.set(paint.name, existing)
  }
  const usageData = Array.from(usageMap.entries()).map(([name, data]) => ({ name, ...data }))

  const trendMap = new Map<string, { adds: number; removes: number }>()
  for (const tx of transactions) {
    const date = new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const existing = trendMap.get(date) || { adds: 0, removes: 0 }
    if (tx.type === "ADD") existing.adds += tx.quantity
    else existing.removes += tx.quantity
    trendMap.set(date, existing)
  }
  const trendData = Array.from(trendMap.entries()).map(([date, data]) => ({ date, ...data }))

  const stockDistribution = paints.map((p, i) => ({
    name: p.name,
    value: p.stock,
    color: chartColors[i % chartColors.length],
  }))

  const csvHeader = "Paint,Consumed,Restocked,Current Stock,Threshold,Status\n"
  const csvRows = paints.map((p) => {
    const usage = usageMap.get(p.name) || { consumed: 0, restocked: 0 }
    const status = p.stock <= p.threshold ? "Low Stock" : "In Stock"
    return `${p.name},${usage.consumed},${usage.restocked},${p.stock},${p.threshold},${status}`
  }).join("\n")
  const csvData = csvHeader + csvRows

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
        <p className="text-muted-foreground">Analyze inventory usage, trends, and stock distribution</p>
      </div>
      <ReportCharts
        usageData={usageData}
        trendData={trendData}
        stockDistribution={stockDistribution}
        csvData={csvData}
      />
    </div>
  )
}
