"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { adjustStock } from "@/lib/actions"
import { toast } from "sonner"
import { Droplets, Search } from "lucide-react"

interface PaintItem {
  id: string
  name: string
  colorHex: string
  finishType: string
  brand: string
  stock: number
  threshold: number
}

export function ConsumeGrid({ paints }: { paints: PaintItem[] }) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<PaintItem | null>(null)
  const [quantity, setQuantity] = useState("")
  const [note, setNote] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { user } = useAuth()

  const filtered = paints.filter(
    (p) =>
      p.stock > 0 &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()))
  )

  function handleConsume() {
    if (!selected) return
    const qty = parseInt(quantity)
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity")
      return
    }
    if (qty > selected.stock) {
      toast.error("Not enough stock available")
      return
    }

    startTransition(async () => {
      const result = await adjustStock(selected.id, "REMOVE", qty, user?.id || "unknown", note || `Consumed by user`)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Consumed ${qty} units of ${selected.name}`)
        if (result.lowStock) {
          toast.warning(
            `Low stock: ${result.paintName} is at ${result.stock} units (threshold: ${result.threshold})`,
            { duration: 8000 }
          )
        }
        setSelected(null)
        setQuantity("")
        setNote("")
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search available paints..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Droplets className="mb-3 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-card-foreground">No Paints Available</h3>
            <p className="text-sm text-muted-foreground">All paints are currently out of stock</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((paint) => {
            const isLow = paint.stock <= paint.threshold
            return (
              <Card key={paint.id} className="group transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg border border-border shadow-sm"
                      style={{ backgroundColor: paint.colorHex }}
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate text-sm text-card-foreground">{paint.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{paint.finishType} - {paint.brand}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-card-foreground">{paint.stock}</span>
                      <span className="text-xs text-muted-foreground">units</span>
                      {isLow && <Badge variant="destructive" className="text-[10px]">Low</Badge>}
                    </div>
                    <Button size="sm" onClick={() => setSelected(paint)}>
                      <Droplets className="mr-1.5 h-3.5 w-3.5" />
                      Take
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {selected && (
                <div className="h-5 w-5 rounded" style={{ backgroundColor: selected.colorHex }} />
              )}
              Consume {selected?.name}
            </DialogTitle>
            <DialogDescription>
              Available: {selected?.stock} units. Enter the amount you need.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cqty">Quantity</Label>
              <Input
                id="cqty"
                type="number"
                min={1}
                max={selected?.stock}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="How many units?"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cnote">Reason / Note</Label>
              <Textarea
                id="cnote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Conference room B painting"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleConsume} disabled={isPending}>
              {isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
