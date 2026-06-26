"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { adjustStock } from "@/lib/actions"
import { toast } from "sonner"

interface StockActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paintId: string
  paintName: string
  currentStock: number
  type: "ADD" | "REMOVE"
}

export function StockActionModal({
  open,
  onOpenChange,
  paintId,
  paintName,
  currentStock,
  type,
}: StockActionModalProps) {
  const [quantity, setQuantity] = useState("")
  const [note, setNote] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { user } = useAuth()

  function handleSubmit() {
    const qty = parseInt(quantity)
    if (!qty || qty <= 0) {
      toast.error("Please enter a valid quantity")
      return
    }
    if (type === "REMOVE" && qty > currentStock) {
      toast.error("Cannot remove more than current stock")
      return
    }

    startTransition(async () => {
      const result = await adjustStock(paintId, type, qty, user?.id || "unknown", note || undefined)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          `${type === "ADD" ? "Added" : "Removed"} ${qty} units ${type === "ADD" ? "to" : "from"} ${paintName}`
        )
        if (result.lowStock) {
          toast.warning(
            `Low stock alert: ${result.paintName} is at ${result.stock} units (threshold: ${result.threshold})`,
            { duration: 8000 }
          )
        }
        setQuantity("")
        setNote("")
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {type === "ADD" ? "Restock" : "Release"} Paint
          </DialogTitle>
          <DialogDescription>
            {type === "ADD" ? "Add stock to" : "Remove stock from"}{" "}
            <span className="font-medium">{paintName}</span>
            {" "}(current: {currentStock} units)
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={type === "REMOVE" ? currentStock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Enter quantity to ${type === "ADD" ? "add" : "remove"}`}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for stock adjustment"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Processing..." : type === "ADD" ? "Add Stock" : "Remove Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
