import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RecentTransaction {
  id: string
  paintName: string
  type: "ADD" | "REMOVE"
  quantity: number
  performedByName: string
  date: string
}

export function RecentTransactions({ transactions }: { transactions: RecentTransaction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-foreground">Recent Transactions</CardTitle>
        <CardDescription>Latest stock movements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Badge
                  variant={tx.type === "ADD" ? "default" : "secondary"}
                  className={
                    tx.type === "ADD"
                      ? "bg-success text-success-foreground"
                      : "bg-destructive/10 text-destructive-foreground"
                  }
                >
                  {tx.type === "ADD" ? "+" : "-"}{tx.quantity}
                </Badge>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm font-medium text-card-foreground">{tx.paintName}</span>
                  <span className="text-xs text-muted-foreground">by {tx.performedByName}</span>
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(tx.date).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
