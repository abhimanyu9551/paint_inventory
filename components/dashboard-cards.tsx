import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Paintbrush, Truck, AlertTriangle, ArrowLeftRight, TrendingDown, TrendingUp } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: "up" | "down" | "neutral"
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-foreground">{value}</div>
        {description && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
            {trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface DashboardCardsProps {
  totalPaints: number
  totalSuppliers: number
  lowStockCount: number
  totalTransactions: number
  role: string
}

export function DashboardCards({ totalPaints, totalSuppliers, lowStockCount, totalTransactions, role }: DashboardCardsProps) {
  const cards: StatCardProps[] = []

  cards.push({
    title: "Total Paints",
    value: totalPaints,
    description: "Active paint colors in stock",
    icon: Paintbrush,
  })

  if (role === "admin") {
    cards.push({
      title: "Suppliers",
      value: totalSuppliers,
      description: "Active supplier partnerships",
      icon: Truck,
    })
  }

  cards.push({
    title: "Low Stock Alerts",
    value: lowStockCount,
    description: lowStockCount > 0 ? "Items need restocking" : "All stock levels healthy",
    icon: AlertTriangle,
    trend: lowStockCount > 0 ? "down" : "neutral",
  })

  cards.push({
    title: "Transactions",
    value: totalTransactions,
    description: "Total stock movements recorded",
    icon: ArrowLeftRight,
  })

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  )
}
