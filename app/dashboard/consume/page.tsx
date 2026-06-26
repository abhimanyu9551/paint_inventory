"use client"

import { paints } from "@/lib/data"
import { ConsumeGrid } from "@/components/consume-grid"

export default function ConsumePage() {
  const paintItems = paints.map((p) => ({
    id: p.id,
    name: p.name,
    colorHex: p.colorHex,
    finishType: p.finishType,
    brand: p.brand,
    stock: p.stock,
    threshold: p.threshold,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Consume Paint</h1>
        <p className="text-muted-foreground">
          Select paint from inventory for your tasks. Each consumption is recorded as a transaction.
        </p>
      </div>
      <ConsumeGrid paints={paintItems} />
    </div>
  )
}
