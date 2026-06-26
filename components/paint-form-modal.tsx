"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addPaint, updatePaint } from "@/lib/actions"
import { toast } from "sonner"
import type { Paint, Supplier, FinishType } from "@/lib/types"

interface PaintFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paint?: Paint | null
  suppliers: Supplier[]
}

const finishTypes: FinishType[] = ["Matte", "Gloss", "Satin", "Eggshell"]

export function PaintFormModal({ open, onOpenChange, paint, suppliers }: PaintFormModalProps) {
  const isEditing = !!paint
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [name, setName] = useState(paint?.name || "")
  const [colorHex, setColorHex] = useState(paint?.colorHex || "#3B82F6")
  const [finishType, setFinishType] = useState<FinishType>(paint?.finishType || "Matte")
  const [brand, setBrand] = useState(paint?.brand || "")
  const [stock, setStock] = useState(String(paint?.stock || 0))
  const [threshold, setThreshold] = useState(String(paint?.threshold || 10))
  const [supplierId, setSupplierId] = useState(paint?.supplierId || "")

  function handleSubmit() {
    if (!name || !brand || !supplierId) {
      toast.error("Please fill in all required fields")
      return
    }

    const formData = new FormData()
    formData.set("name", name)
    formData.set("colorHex", colorHex)
    formData.set("finishType", finishType)
    formData.set("brand", brand)
    formData.set("stock", stock)
    formData.set("threshold", threshold)
    formData.set("supplierId", supplierId)

    startTransition(async () => {
      const result = isEditing ? await updatePaint(paint.id, formData) : await addPaint(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? "Paint updated" : "Paint added")
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEditing ? "Edit" : "Add"} Paint</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update paint details" : "Add a new paint to the inventory"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Paint name" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-md border border-input"
                />
                <Input value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Finish Type</Label>
              <Select value={finishType} onValueChange={(v) => setFinishType(v as FinishType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {finishTypes.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {!isEditing && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="stock">Initial Stock</Label>
                <Input id="stock" type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="threshold">Low Stock Threshold</Label>
              <Input id="threshold" type="number" min={1} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Supplier *</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Save Changes" : "Add Paint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
