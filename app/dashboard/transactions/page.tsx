"use client"

import { AuthGuard } from "@/components/auth-guard"
import { transactions, paints, getUserById } from "@/lib/data"
import { TransactionTable } from "@/components/transaction-table"

export default function TransactionsPage() {
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const rows = sorted.map((tx) => {
    const paint = paints.find((p) => p.id === tx.paintId)
    const performer = getUserById(tx.performedBy)
    return {
      id: tx.id,
      paintName: paint?.name || "Unknown",
      type: tx.type,
      quantity: tx.quantity,
      performedByName: performer?.name || "Unknown",
      date: tx.date,
      note: tx.note,
    }
  })

  return (
    <AuthGuard allowedRoles={["admin", "supervisor"]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Complete history of stock movements and adjustments</p>
        </div>
        <TransactionTable transactions={rows} />
      </div>
    </AuthGuard>
  )
}
