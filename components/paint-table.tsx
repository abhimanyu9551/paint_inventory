"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StockActionModal } from "@/components/stock-action-modal"
import { PaintFormModal } from "@/components/paint-form-modal"
import { deletePaint } from "@/lib/actions"
import { toast } from "sonner"
import type { Paint, Supplier, SessionUser } from "@/lib/types"
import { Plus, MoreHorizontal, Pencil, Trash2, PackagePlus, PackageMinus, Search } from "lucide-react"

interface PaintTableProps {
  paints: Paint[]
  suppliers: Supplier[]
  user: SessionUser
}

export function PaintTable({ paints, suppliers, user }: PaintTableProps) {
  const [search, setSearch] = useState("")
  const [stockModal, setStockModal] = useState<{ open: boolean; paintId: string; paintName: string; stock: number; type: "ADD" | "REMOVE" } | null>(null)
  const [paintModal, setPaintModal] = useState<{ open: boolean; paint: Paint | null }>({ open: false, paint: null })
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const filtered = paints.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.finishType.toLowerCase().includes(search.toLowerCase())
  )

  function getSupplierName(supplierId: string) {
    return suppliers.find((s) => s.id === supplierId)?.name || "Unknown"
  }

  function handleDelete(paintId: string, paintName: string) {
    if (!confirm(`Delete "${paintName}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deletePaint(paintId)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`Deleted ${paintName}`)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search paints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {user.role === "admin" && (
          <Button onClick={() => setPaintModal({ open: true, paint: null })}>
            <Plus className="mr-2 h-4 w-4" />
            Add Paint
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Color</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Finish</TableHead>
              <TableHead className="hidden lg:table-cell">Brand</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="hidden md:table-cell">Threshold</TableHead>
              <TableHead className="hidden lg:table-cell">Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No paints found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((paint) => {
                const isLow = paint.stock <= paint.threshold
                return (
                  <TableRow key={paint.id} className={isLow ? "bg-destructive/5" : ""}>
                    <TableCell>
                      <div
                        className="h-7 w-7 rounded-md border border-border"
                        style={{ backgroundColor: paint.colorHex }}
                        title={paint.colorHex}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{paint.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{paint.finishType}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{paint.brand}</TableCell>
                    <TableCell className="font-mono font-medium text-foreground">{paint.stock}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{paint.threshold}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{getSupplierName(paint.supplierId)}</TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-success/10 text-success border-success/20">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setStockModal({ open: true, paintId: paint.id, paintName: paint.name, stock: paint.stock, type: "ADD" })
                            }
                          >
                            <PackagePlus className="mr-2 h-4 w-4" />
                            Restock
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setStockModal({ open: true, paintId: paint.id, paintName: paint.name, stock: paint.stock, type: "REMOVE" })
                            }
                          >
                            <PackageMinus className="mr-2 h-4 w-4" />
                            Release
                          </DropdownMenuItem>
                          {user.role === "admin" && (
                            <>
                              <DropdownMenuItem onClick={() => setPaintModal({ open: true, paint })}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(paint.id, paint.name)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {stockModal && (
        <StockActionModal
          open={stockModal.open}
          onOpenChange={(open) => setStockModal(open ? stockModal : null)}
          paintId={stockModal.paintId}
          paintName={stockModal.paintName}
          currentStock={stockModal.stock}
          type={stockModal.type}
        />
      )}

      <PaintFormModal
        open={paintModal.open}
        onOpenChange={(open) => setPaintModal({ open, paint: open ? paintModal.paint : null })}
        paint={paintModal.paint}
        suppliers={suppliers}
      />
    </>
  )
}
