"use client"

import { useState } from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"

interface TransactionRow {
  id: string
  paintName: string
  type: "ADD" | "REMOVE"
  quantity: number
  performedByName: string
  date: string
  note?: string
}

export function TransactionTable({ transactions }: { transactions: TransactionRow[] }) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.paintName.toLowerCase().includes(search.toLowerCase()) ||
      t.performedByName.toLowerCase().includes(search.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(search.toLowerCase()))
    const matchesType = typeFilter === "all" || t.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="ADD">Restock</SelectItem>
            <SelectItem value="REMOVE">Consumed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Paint</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="hidden md:table-cell">Performed By</TableHead>
              <TableHead className="hidden lg:table-cell">Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No transactions found</TableCell>
              </TableRow>
            ) : (
              filtered.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{tx.paintName}</TableCell>
                  <TableCell>
                    <Badge
                      variant={tx.type === "ADD" ? "default" : "secondary"}
                      className={
                        tx.type === "ADD"
                          ? "bg-success text-success-foreground"
                          : "bg-destructive/10 text-destructive-foreground"
                      }
                    >
                      {tx.type === "ADD" ? "Restock" : "Consumed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-foreground">{tx.type === "ADD" ? "+" : "-"}{tx.quantity}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{tx.performedByName}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">{tx.note || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
